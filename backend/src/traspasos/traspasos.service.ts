import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, EntityManager, In } from 'typeorm';
import { Traspaso, EstadoTraspaso, CargoCostoTraspaso } from './traspaso.entity';
import { DetalleTraspaso } from './detalle-traspaso.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Producto } from '../productos/producto.entity';
import { Lote } from '../inventario/lote.entity';
import { MovimientoInventario } from '../movimientos-inventario/movimiento_inventario.entity';

@Injectable()
export class TraspasosService implements OnModuleInit {
    constructor(
        @InjectRepository(Traspaso)
        private traspasoRepo: Repository<Traspaso>,
        @InjectRepository(DetalleTraspaso)
        private detalleRepo: Repository<DetalleTraspaso>,
        @InjectRepository(Inventario)
        private inventarioRepo: Repository<Inventario>,
        @InjectRepository(Sucursal)
        private sucursalRepo: Repository<Sucursal>,
        @InjectRepository(Producto)
        private productoRepo: Repository<Producto>,
        @InjectRepository(Lote)
        private loteRepo: Repository<Lote>,
        private dataSource: DataSource,
    ) {}

    async onModuleInit() {
        try {
            await this.dataSource.query(`
                ALTER TABLE traspasos ADD COLUMN IF NOT EXISTS "sucursalGastoId" INTEGER REFERENCES sucursales(id) ON DELETE SET NULL;
            `);
            await this.dataSource.query(`
                UPDATE traspasos 
                SET "sucursalGastoId" = CASE 
                    WHEN "sucursalCargoCosto" = 'DESTINO' THEN "sucursalDestinoId" 
                    ELSE "sucursalOrigenId" 
                END 
                WHERE "sucursalGastoId" IS NULL;
            `);
        } catch (e) {
            console.error('Error auto-migrating sucursalGastoId in traspasos:', e);
        }

        try {
            const legacyTraspasos = await this.traspasoRepo
                .createQueryBuilder('traspaso')
                .leftJoinAndSelect('traspaso.sucursalOrigen', 'sucursalOrigen')
                .leftJoinAndSelect('sucursalOrigen.ciudad', 'origenCiudad')
                .where("traspaso.codigo ~ '^TRASP-[0-9]+$'")
                .orderBy('traspaso.fecha', 'ASC')
                .addOrderBy('traspaso.id', 'ASC')
                .getMany();

            if (legacyTraspasos.length > 0) {
                for (const t of legacyTraspasos) {
                    const oldCode = t.codigo;
                    const newCode = await this.generateCodigo(t.sucursalOrigen);
                    if (newCode && newCode !== oldCode) {
                        t.codigo = newCode;
                        await this.traspasoRepo.save(t);
                        await this.dataSource
                            .createQueryBuilder()
                            .update(MovimientoInventario)
                            .set({
                                numeroDocumento: newCode,
                                motivo: () => `REPLACE(motivo, '[${oldCode}]', '[${newCode}]')`,
                            })
                            .where('numeroDocumento = :oldCode OR motivo LIKE :likeOld', {
                                oldCode,
                                likeOld: `%[${oldCode}]%`,
                            })
                            .execute();
                    }
                }
            }
        } catch (e) {
            console.error('Error auto-migrating traspaso codes by branch:', e);
        }
    }

    async findAll(): Promise<Traspaso[]> {
        return this.traspasoRepo.createQueryBuilder('traspaso')
            .leftJoinAndSelect('traspaso.sucursalOrigen', 'sucursalOrigen')
            .leftJoinAndSelect('sucursalOrigen.ciudad', 'origenCiudad')
            .leftJoinAndSelect('traspaso.sucursalDestino', 'sucursalDestino')
            .leftJoinAndSelect('sucursalDestino.ciudad', 'destinoCiudad')
            .leftJoinAndSelect('traspaso.sucursalGasto', 'sucursalGasto')
            .leftJoinAndSelect('sucursalGasto.ciudad', 'gastoCiudad')
            .leftJoinAndSelect('traspaso.usuario', 'usuario')
            .leftJoinAndSelect('traspaso.detalles', 'detalles')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .orderBy('traspaso.fecha', 'DESC')
            .addOrderBy('traspaso.id', 'DESC')
            .getMany();
    }

    async findOne(id: number): Promise<Traspaso> {
        const traspaso = await this.traspasoRepo.createQueryBuilder('traspaso')
            .leftJoinAndSelect('traspaso.sucursalOrigen', 'sucursalOrigen')
            .leftJoinAndSelect('sucursalOrigen.ciudad', 'origenCiudad')
            .leftJoinAndSelect('traspaso.sucursalDestino', 'sucursalDestino')
            .leftJoinAndSelect('sucursalDestino.ciudad', 'destinoCiudad')
            .leftJoinAndSelect('traspaso.sucursalGasto', 'sucursalGasto')
            .leftJoinAndSelect('sucursalGasto.ciudad', 'gastoCiudad')
            .leftJoinAndSelect('traspaso.usuario', 'usuario')
            .leftJoinAndSelect('traspaso.detalles', 'detalles')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .where('traspaso.id = :id', { id })
            .getOne();

        if (!traspaso) {
            throw new NotFoundException(`Traspaso #${id} no encontrado`);
        }

        if (traspaso.detalles?.length) {
            const isActivo = traspaso.activo && traspaso.estado !== EstadoTraspaso.ANULADO;
            for (const det of traspaso.detalles) {
                if (isActivo && traspaso.sucursalDestino) {
                    const status = await this.getDetalleDestinoStatus(this.dataSource.manager, traspaso, det);
                    (det as any).cantidadVendidaDestino = status.cantidadVendidaDestino;
                    (det as any).cantidadDisponibleDestino = status.cantidadRevertible;
                    (det as any).tieneVentasDestino = status.tieneVentasDestino;
                } else {
                    (det as any).cantidadVendidaDestino = 0;
                    (det as any).cantidadDisponibleDestino = Number(det.cantidad) || 0;
                    (det as any).tieneVentasDestino = false;
                }
            }
        }

        return traspaso;
    }

    private parseLotesDetalle(det: DetalleTraspaso): Array<{ numeroLote: string; cantidad: number; fechaVencimiento?: any }> {
        let lotesTransf: Array<{ numeroLote: string; cantidad: number; fechaVencimiento?: any }> = [];
        if (det.lotesDetalle) {
            try {
                const parsed = JSON.parse(det.lotesDetalle);
                if (Array.isArray(parsed)) {
                    lotesTransf = parsed.map(l => ({
                        numeroLote: l.numeroLote,
                        cantidad: Number(l.cantidad) || 0,
                        fechaVencimiento: l.fechaVencimiento || null,
                    }));
                }
            } catch {
                lotesTransf = [];
            }
        }
        if (lotesTransf.length === 0 && det.numeroLote) {
            lotesTransf = [{
                numeroLote: det.numeroLote,
                cantidad: Number(det.cantidad) || 0,
                fechaVencimiento: det.fechaVencimiento || null,
            }];
        }
        return lotesTransf;
    }

    private async findDestinoLote(
        manager: EntityManager,
        productoId: number,
        sucursalDestinoId: number,
        numeroLote: string,
        codigoTraspaso: string,
    ): Promise<Lote | null> {
        let lotDest = await manager.findOne(Lote, {
            where: {
                producto: { id: productoId },
                sucursal: { id: sucursalDestinoId },
                numeroLote,
            },
        });
        if (!lotDest && (numeroLote === 'S/N' || !numeroLote)) {
            lotDest = await manager.findOne(Lote, {
                where: {
                    producto: { id: productoId },
                    sucursal: { id: sucursalDestinoId },
                    numeroLote: `TRASP-${codigoTraspaso}`,
                },
            });
        }
        return lotDest;
    }

    private async getDetalleDestinoStatus(
        manager: EntityManager,
        traspaso: Traspaso,
        det: DetalleTraspaso,
    ): Promise<{
        cantidadOriginal: number;
        cantidadRevertible: number;
        cantidadVendidaDestino: number;
        tieneVentasDestino: boolean;
        lotesTransf: Array<{ numeroLote: string; cantidad: number; fechaVencimiento?: any }>;
    }> {
        const cantidadOriginal = Number(det.cantidad) || 0;
        const invDestino = await manager.findOne(Inventario, {
            where: {
                producto: { id: det.producto.id },
                sucursal: { id: traspaso.sucursalDestino.id },
            },
        });
        const invDestinoStock = invDestino ? Math.max(0, Number(invDestino.stockActual)) : 0;
        const lotesTransf = this.parseLotesDetalle(det);

        let totalRevertiblePorLotes = invDestinoStock;
        if (lotesTransf.length > 0) {
            totalRevertiblePorLotes = 0;
            for (const lt of lotesTransf) {
                const ltCant = Number(lt.cantidad) || 0;
                const lotDest = await this.findDestinoLote(
                    manager,
                    det.producto.id,
                    traspaso.sucursalDestino.id,
                    lt.numeroLote,
                    traspaso.codigo,
                );
                const loteActualDestino = lotDest ? Math.max(0, Number(lotDest.cantidadActual)) : 0;
                totalRevertiblePorLotes += Math.min(ltCant, loteActualDestino);
            }
        }

        const invRevertible = Math.min(cantidadOriginal, invDestinoStock);
        const cantidadRevertible = Math.max(0, Math.min(cantidadOriginal, totalRevertiblePorLotes, invRevertible));
        const cantidadVendidaDestino = Math.max(0, Number((cantidadOriginal - cantidadRevertible).toFixed(2)));

        return {
            cantidadOriginal,
            cantidadRevertible: Number(cantidadRevertible.toFixed(2)),
            cantidadVendidaDestino,
            tieneVentasDestino: cantidadVendidaDestino > 0,
            lotesTransf,
        };
    }

    private async applyTransferForward(
        manager: EntityManager,
        params: {
            codigo: string;
            sucursalOrigen: Sucursal;
            sucursalDestino: Sucursal;
            producto: Producto;
            cantidad: number;
            numeroLote?: string;
            observacion?: string;
            observacionesHeader?: string;
            usuarioId?: number;
            motivoPrefix?: string;
            skipKardex?: boolean;
        },
    ): Promise<{
        lotesTransferidos: Array<{ numeroLote: string; cantidad: number; fechaVencimiento: Date | null }>;
    }> {
        const { codigo, sucursalOrigen, sucursalDestino, producto, cantidad, numeroLote, observacion, observacionesHeader, usuarioId, motivoPrefix, skipKardex } = params;

        const invOrigen = await manager.findOne(Inventario, {
            where: {
                producto: { id: producto.id },
                sucursal: { id: sucursalOrigen.id },
            },
        });

        const stockDisponible = invOrigen ? Number(invOrigen.stockActual) : 0;
        if (!invOrigen || stockDisponible < cantidad) {
            throw new BadRequestException(
                `Stock insuficiente para "${producto.nombre}" en ${sucursalOrigen.nombre}. Disponible: ${stockDisponible}, Solicitado: ${cantidad}`,
            );
        }

        invOrigen.stockActual = Number(invOrigen.stockActual) - cantidad;
        await manager.save(invOrigen);

        const cleanRequestedLote = numeroLote && !numeroLote.startsWith('TRASP-') && numeroLote !== 'S/N' ? numeroLote : undefined;
        const lotesWhere: any = {
            producto: { id: producto.id },
            sucursal: { id: sucursalOrigen.id },
            cantidadActual: MoreThan(0),
        };
        if (cleanRequestedLote) {
            lotesWhere.numeroLote = cleanRequestedLote;
        }

        const lotesOrigen = await manager.find(Lote, {
            where: lotesWhere,
            order: {
                fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                fechaIngreso: 'ASC',
            },
        });

        if (cleanRequestedLote) {
            const totalRequestedLote = lotesOrigen.reduce((acc, l) => acc + Number(l.cantidadActual), 0);
            if (totalRequestedLote < cantidad) {
                const anyLotesInOrigen = await manager.count(Lote, {
                    where: { producto: { id: producto.id }, sucursal: { id: sucursalOrigen.id }, cantidadActual: MoreThan(0) },
                });
                if (anyLotesInOrigen > 0) {
                    throw new BadRequestException(
                        `Stock insuficiente en el lote "${cleanRequestedLote}" para "${producto.nombre}" en ${sucursalOrigen.nombre}. Disponible: ${totalRequestedLote}, Solicitado: ${cantidad}`,
                    );
                }
            }
        }

        let cantidadPorDescontar = cantidad;
        const lotesTransferidos: Array<{
            numeroLote: string;
            cantidad: number;
            fechaVencimiento: Date | null;
        }> = [];

        for (const loteOrigen of lotesOrigen) {
            if (cantidadPorDescontar <= 0) break;
            const cantDisp = Number(loteOrigen.cantidadActual);
            if (cantDisp > 0) {
                const cantADescontar = Math.min(cantDisp, cantidadPorDescontar);
                loteOrigen.cantidadActual = cantDisp - cantADescontar;
                await manager.save(loteOrigen);

                const targetLoteNum = loteOrigen.numeroLote || `TRASP-${codigo}`;
                let loteDestino = await manager.findOne(Lote, {
                    where: {
                        producto: { id: producto.id },
                        sucursal: { id: sucursalDestino.id },
                        numeroLote: targetLoteNum,
                    },
                });

                if (loteDestino) {
                    loteDestino.cantidadActual = Number(loteDestino.cantidadActual) + cantADescontar;
                    if (loteOrigen.fechaVencimiento && !loteDestino.fechaVencimiento) {
                        loteDestino.fechaVencimiento = loteOrigen.fechaVencimiento;
                    }
                    await manager.save(loteDestino);
                } else {
                    loteDestino = manager.create(Lote, {
                        numeroLote: targetLoteNum,
                        producto,
                        sucursal: sucursalDestino,
                        cantidadInicial: cantADescontar,
                        cantidadActual: cantADescontar,
                        costoUnitario: loteOrigen.costoUnitario || Number(invOrigen.precioCompra) || Number(producto.precioCompra) || 0,
                        fechaIngreso: new Date(),
                        fechaVencimiento: loteOrigen.fechaVencimiento,
                    });
                    await manager.save(loteDestino);
                }

                lotesTransferidos.push({
                    numeroLote: loteOrigen.numeroLote || 'S/N',
                    cantidad: cantADescontar,
                    fechaVencimiento: loteOrigen.fechaVencimiento || null,
                });

                cantidadPorDescontar -= cantADescontar;
            }
        }

        if (cantidadPorDescontar > 0) {
            let loteDestino = await manager.findOne(Lote, {
                where: {
                    producto: { id: producto.id },
                    sucursal: { id: sucursalDestino.id },
                    numeroLote: `TRASP-${codigo}`,
                },
            });

            if (loteDestino) {
                loteDestino.cantidadActual = Number(loteDestino.cantidadActual) + cantidadPorDescontar;
                await manager.save(loteDestino);
            } else {
                loteDestino = manager.create(Lote, {
                    numeroLote: `TRASP-${codigo}`,
                    producto,
                    sucursal: sucursalDestino,
                    cantidadInicial: cantidadPorDescontar,
                    cantidadActual: cantidadPorDescontar,
                    costoUnitario: Number(invOrigen.precioCompra) || Number(producto.precioCompra) || 0,
                    fechaIngreso: new Date(),
                });
                await manager.save(loteDestino);
            }

            lotesTransferidos.push({
                numeroLote: `TRASP-${codigo}`,
                cantidad: cantidadPorDescontar,
                fechaVencimiento: null,
            });
            cantidadPorDescontar = 0;
        }

        const lotesResumen = lotesTransferidos.map(l => `${l.numeroLote} (${l.cantidad} u.)`).join(', ');
        const costoTraspaso = Number(invOrigen.precioCompra) || Number(producto.precioCompra) || 0;
        const obsTraspaso = observacion || observacionesHeader || '';
        const prefix = motivoPrefix ? `${motivoPrefix} ` : '';

        if (!skipKardex) {
            const movOrigen = manager.create(MovimientoInventario, {
                inventario: invOrigen,
                tipo: 'TRASPASO_SALIDA',
                cantidad: -cantidad,
                motivo: `${prefix}Traspaso [${codigo}] hacia ${sucursalDestino.nombre}${lotesResumen ? ' [Lotes: ' + lotesResumen + ']' : ''}. ${observacion || ''}`.trim(),
                numeroDocumento: codigo,
                observaciones: obsTraspaso,
                costoUnitario: costoTraspaso,
                usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
            });
            await manager.save(movOrigen);
        }

        let invDestino = await manager.findOne(Inventario, {
            where: {
                producto: { id: producto.id },
                sucursal: { id: sucursalDestino.id },
            },
        });

        if (invDestino) {
            invDestino.stockActual = Number(invDestino.stockActual) + cantidad;
            await manager.save(invDestino);
        } else {
            invDestino = manager.create(Inventario, {
                producto,
                sucursal: sucursalDestino,
                stockActual: cantidad,
                stockMinimo: 0,
                stockMaximo: 0,
                precioCompra: Number(invOrigen.precioCompra) || Number(producto.precioCompra) || 0,
                precioVenta: Number(invOrigen.precioVenta) || Number(producto.precioVenta) || 0,
            });
            await manager.save(invDestino);
        }

        if (!skipKardex) {
            const movDestino = manager.create(MovimientoInventario, {
                inventario: invDestino,
                tipo: 'TRASPASO_ENTRADA',
                cantidad: cantidad,
                motivo: `${prefix}Traspaso [${codigo}] desde ${sucursalOrigen.nombre}${lotesResumen ? ' [Lotes: ' + lotesResumen + ']' : ''}. ${observacion || ''}`.trim(),
                numeroDocumento: codigo,
                observaciones: obsTraspaso,
                costoUnitario: costoTraspaso,
                usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
            });
            await manager.save(movDestino);
        }

        return { lotesTransferidos };
    }

    private async revertTransferPartial(
        manager: EntityManager,
        params: {
            codigo: string;
            sucursalOrigen: Sucursal;
            sucursalDestino: Sucursal;
            producto: Producto;
            cantidadARevertir: number;
            lotesTransf: Array<{ numeroLote: string; cantidad: number; fechaVencimiento?: any }>;
            observacion?: string;
            usuarioId?: number;
            motivoPrefix?: string;
            skipKardex?: boolean;
        },
    ): Promise<Array<{ numeroLote: string; cantidad: number; fechaVencimiento?: any }>> {
        const { codigo, sucursalOrigen, sucursalDestino, producto, cantidadARevertir, lotesTransf, observacion, usuarioId, motivoPrefix, skipKardex } = params;

        const invDestino = await manager.findOne(Inventario, {
            where: {
                producto: { id: producto.id },
                sucursal: { id: sucursalDestino.id },
            },
        });
        const stockDestino = invDestino ? Number(invDestino.stockActual) : 0;
        if (!invDestino || stockDestino < cantidadARevertir) {
            throw new BadRequestException(
                `No se puede revertir ${cantidadARevertir} unidad(es) de "${producto.nombre}" porque la sucursal destino "${sucursalDestino.nombre}" solo dispone de ${stockDestino} en stock.`,
            );
        }

        invDestino.stockActual = Number(invDestino.stockActual) - cantidadARevertir;
        await manager.save(invDestino);

        let invOrigen = await manager.findOne(Inventario, {
            where: {
                producto: { id: producto.id },
                sucursal: { id: sucursalOrigen.id },
            },
        });
        if (invOrigen) {
            invOrigen.stockActual = Number(invOrigen.stockActual) + cantidadARevertir;
            await manager.save(invOrigen);
        } else {
            invOrigen = manager.create(Inventario, {
                producto,
                sucursal: sucursalOrigen,
                stockActual: cantidadARevertir,
                stockMinimo: 0,
                stockMaximo: 0,
                precioCompra: Number(invDestino.precioCompra) || Number(producto.precioCompra) || 0,
                precioVenta: Number(invDestino.precioVenta) || Number(producto.precioVenta) || 0,
            });
            await manager.save(invOrigen);
        }

        const updatedLotes = lotesTransf.map(l => ({ ...l, cantidad: Number(l.cantidad) || 0 }));
        const revertedSummary: string[] = [];

        if (updatedLotes.length > 0) {
            let porRevertir = cantidadARevertir;
            // Revert from end (LIFO) so earlier lots keep priority
            for (let i = updatedLotes.length - 1; i >= 0 && porRevertir > 0; i--) {
                const lt = updatedLotes[i];
                if (lt.cantidad <= 0) continue;

                const lotDest = await this.findDestinoLote(manager, producto.id, sucursalDestino.id, lt.numeroLote, codigo);
                const dispDest = lotDest ? Math.max(0, Number(lotDest.cantidadActual)) : 0;
                const aRevertir = Math.min(porRevertir, lt.cantidad, dispDest);

                if (aRevertir > 0 && lotDest) {
                    lotDest.cantidadActual = Number(lotDest.cantidadActual) - aRevertir;
                    await manager.save(lotDest);

                    const lotOrigNum = lt.numeroLote === `TRASP-${codigo}` || lt.numeroLote === 'S/N' ? lt.numeroLote : lt.numeroLote;
                    const lotOrig = await manager.findOne(Lote, {
                        where: {
                            producto: { id: producto.id },
                            sucursal: { id: sucursalOrigen.id },
                            numeroLote: lotOrigNum,
                        },
                    });
                    if (lotOrig) {
                        lotOrig.cantidadActual = Number(lotOrig.cantidadActual) + aRevertir;
                        await manager.save(lotOrig);
                    } else {
                        const newLotOrig = manager.create(Lote, {
                            numeroLote: lotOrigNum,
                            producto,
                            sucursal: sucursalOrigen,
                            cantidadInicial: aRevertir,
                            cantidadActual: aRevertir,
                            costoUnitario: Number(producto.precioCompra) || 0,
                            fechaIngreso: new Date(),
                            fechaVencimiento: lt.fechaVencimiento ? new Date(lt.fechaVencimiento) : undefined,
                        });
                        await manager.save(newLotOrig);
                    }

                    lt.cantidad -= aRevertir;
                    porRevertir -= aRevertir;
                    revertedSummary.push(`${lt.numeroLote} (${aRevertir} u.)`);
                }
            }

            if (porRevertir > 0) {
                throw new BadRequestException(
                    `No hay suficientes unidades disponibles en los lotes de "${sucursalDestino.nombre}" para revertir ${cantidadARevertir} unidad(es) de "${producto.nombre}".`,
                );
            }
        }

        if (!skipKardex) {
            const lotesMsg = revertedSummary.length > 0 ? ` [Lotes: ${revertedSummary.join(', ')}]` : '';
            const prefix = motivoPrefix || 'Edición de Traspaso';
            const costoUnit = Number(invOrigen.precioCompra) || Number(producto.precioCompra) || 0;

            const movRevDestino = manager.create(MovimientoInventario, {
                inventario: invDestino,
                tipo: 'TRASPASO_SALIDA',
                cantidad: -cantidadARevertir,
                motivo: `${prefix} [${codigo}] devuelto a ${sucursalOrigen.nombre}${lotesMsg}. ${observacion || ''}`.trim(),
                numeroDocumento: codigo,
                costoUnitario: costoUnit,
                usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
            });
            await manager.save(movRevDestino);

            const movRevOrigen = manager.create(MovimientoInventario, {
                inventario: invOrigen,
                tipo: 'TRASPASO_ENTRADA',
                cantidad: cantidadARevertir,
                motivo: `${prefix} [${codigo}] devuelto desde ${sucursalDestino.nombre}${lotesMsg}. ${observacion || ''}`.trim(),
                numeroDocumento: codigo,
                costoUnitario: costoUnit,
                usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
            });
            await manager.save(movRevOrigen);
        }

        return updatedLotes.filter(l => l.cantidad > 0);
    }

    /**
     * Sincroniza los registros de Kardex (MovimientoInventario) para un traspaso editado:
     * actualiza en el mismo registro original (preservando su fecha/hora inicial) la nueva cantidad
     * total por producto en Origen y Destino, elimina movimientos duplicados o de ítems removidos,
     * y crea movimientos nuevos solo para productos agregados por primera vez.
     */
    private async syncKardexMovementsForTraspaso(
        manager: EntityManager,
        params: {
            oldCodigo: string;
            codigo: string;
            sucursalOrigen: Sucursal;
            sucursalDestino: Sucursal;
            detallesActuales: DetalleTraspaso[];
            observacionesHeader?: string;
            usuarioId?: number;
        },
    ): Promise<void> {
        const { oldCodigo, codigo, sucursalOrigen, sucursalDestino, detallesActuales, observacionesHeader, usuarioId } = params;
        const docNumbers = Array.from(new Set([oldCodigo, codigo].filter(Boolean)));

        const existingMovs = docNumbers.length > 0
            ? await manager.find(MovimientoInventario, {
                where: { numeroDocumento: In(docNumbers) },
                relations: ['inventario', 'inventario.producto', 'inventario.sucursal'],
                order: { id: 'ASC' },
            })
            : [];

        const grouped = new Map<number, {
            producto: Producto;
            totalQty: number;
            lotes: Array<{ numeroLote: string; cantidad: number }>;
            observaciones: string[];
        }>();

        for (const det of detallesActuales) {
            const prodId = det.producto?.id;
            if (!prodId) continue;
            if (!grouped.has(prodId)) {
                grouped.set(prodId, {
                    producto: det.producto,
                    totalQty: 0,
                    lotes: [],
                    observaciones: [],
                });
            }
            const g = grouped.get(prodId)!;
            g.totalQty = Number((g.totalQty + (Number(det.cantidad) || 0)).toFixed(2));
            const detLotes = this.parseLotesDetalle(det);
            g.lotes = this.mergeLotesDetalle(g.lotes, detLotes);
            if (det.observacion?.trim()) {
                g.observaciones.push(det.observacion.trim());
            }
        }

        const keptMovIds = new Set<number>();

        for (const [prodId, g] of grouped.entries()) {
            const lotesResumen = g.lotes.map(l => `${l.numeroLote} (${l.cantidad} u.)`).join(', ');
            const obsItem = g.observaciones.join(' | ');
            const obsKardex = obsItem || observacionesHeader || '';

            const invOrigen = await manager.findOne(Inventario, {
                where: { producto: { id: prodId }, sucursal: { id: sucursalOrigen.id } },
            });
            const invDestino = await manager.findOne(Inventario, {
                where: { producto: { id: prodId }, sucursal: { id: sucursalDestino.id } },
            });

            if (invOrigen) {
                const movsOrig = existingMovs.filter(
                    m => m.inventario?.id === invOrigen.id && m.tipo === 'TRASPASO_SALIDA',
                );
                const motivoOrig = `Traspaso [${codigo}] hacia ${sucursalDestino.nombre}${lotesResumen ? ' [Lotes: ' + lotesResumen + ']' : ''}. ${obsItem}`.trim().substring(0, 255);
                if (movsOrig.length > 0) {
                    const primary = movsOrig[0];
                    primary.cantidad = -g.totalQty;
                    primary.motivo = motivoOrig;
                    primary.numeroDocumento = codigo;
                    primary.observaciones = obsKardex;
                    await manager.save(primary);
                    keptMovIds.add(primary.id);
                } else {
                    const costoTraspaso = Number(invOrigen.precioCompra) || Number(g.producto.precioCompra) || 0;
                    const created = manager.create(MovimientoInventario, {
                        inventario: invOrigen,
                        tipo: 'TRASPASO_SALIDA',
                        cantidad: -g.totalQty,
                        motivo: motivoOrig,
                        numeroDocumento: codigo,
                        observaciones: obsKardex,
                        costoUnitario: costoTraspaso,
                        usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                    });
                    const saved = await manager.save(created);
                    keptMovIds.add(saved.id);
                }
            }

            if (invDestino) {
                const movsDest = existingMovs.filter(
                    m => m.inventario?.id === invDestino.id && m.tipo === 'TRASPASO_ENTRADA',
                );
                const motivoDest = `Traspaso [${codigo}] desde ${sucursalOrigen.nombre}${lotesResumen ? ' [Lotes: ' + lotesResumen + ']' : ''}. ${obsItem}`.trim().substring(0, 255);
                if (movsDest.length > 0) {
                    const primary = movsDest[0];
                    primary.cantidad = g.totalQty;
                    primary.motivo = motivoDest;
                    primary.numeroDocumento = codigo;
                    primary.observaciones = obsKardex;
                    await manager.save(primary);
                    keptMovIds.add(primary.id);
                } else {
                    const costoTraspaso = Number(invOrigen?.precioCompra) || Number(invDestino.precioCompra) || Number(g.producto.precioCompra) || 0;
                    const created = manager.create(MovimientoInventario, {
                        inventario: invDestino,
                        tipo: 'TRASPASO_ENTRADA',
                        cantidad: g.totalQty,
                        motivo: motivoDest,
                        numeroDocumento: codigo,
                        observaciones: obsKardex,
                        costoUnitario: costoTraspaso,
                        usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                    });
                    const saved = await manager.save(created);
                    keptMovIds.add(saved.id);
                }
            }
        }

        const idsToDelete = existingMovs.filter(m => !keptMovIds.has(m.id)).map(m => m.id);
        if (idsToDelete.length > 0) {
            await manager.delete(MovimientoInventario, { id: In(idsToDelete) });
        }
    }

    private getSucursalCode(sucursal?: Sucursal | null): string {
        if (!sucursal) return '';
        const ciudad = (sucursal.ciudad?.nombre || '').toUpperCase().trim();
        const nombre = (sucursal.nombre || '').toUpperCase().trim();

        if (ciudad.includes('COCHABAMBA') || nombre.includes('COCHABAMBA') || nombre.includes('CBBA')) return 'CBBA';
        if (ciudad.includes('LA PAZ') || nombre.includes('LA PAZ') || nombre.includes('LPZ') || nombre.includes('LP')) return 'LP';
        if (ciudad.includes('SANTA CRUZ') || nombre.includes('SANTA CRUZ') || nombre.includes('SCZ') || nombre.includes('SC')) return 'SCZ';
        if (ciudad.includes('ORURO') || nombre.includes('ORURO')) return 'ORU';
        if (ciudad.includes('POTOSI') || ciudad.includes('POTOSÍ') || nombre.includes('POTOSI')) return 'PTS';
        if (ciudad.includes('TARIJA') || nombre.includes('TARIJA')) return 'TJA';
        if (ciudad.includes('CHUQUISACA') || ciudad.includes('SUCRE') || nombre.includes('SUCRE')) return 'CHQ';
        if (ciudad.includes('BENI') || nombre.includes('BENI')) return 'BEN';
        if (ciudad.includes('PANDO') || nombre.includes('PANDO')) return 'PAN';

        const clean = (ciudad || nombre).replace(/[^A-Z0-9]/g, '');
        return clean ? clean.substring(0, 4) : `SUC${sucursal.id}`;
    }

    private async generateCodigo(sucursalOrigen?: Sucursal | null): Promise<string> {
        let sucursal = sucursalOrigen;
        if (sucursal?.id && !sucursal.ciudad) {
            sucursal = await this.sucursalRepo.findOne({ where: { id: sucursal.id }, relations: ['ciudad'] });
        }

        const sucCode = this.getSucursalCode(sucursal);
        const prefix = sucCode ? `TRASP-${sucCode}` : 'TRASP';

        const traspasos = await this.traspasoRepo
            .createQueryBuilder('traspaso')
            .where('traspaso.codigo LIKE :prefix', { prefix: `${prefix}-%` })
            .select(['traspaso.codigo'])
            .getMany();

        let maxNum = 0;
        for (const t of traspasos) {
            if (t.codigo) {
                const parts = t.codigo.split('-');
                const lastPart = parts[parts.length - 1];
                const parsed = parseInt(lastPart, 10);
                if (!isNaN(parsed) && parsed > maxNum) {
                    maxNum = parsed;
                }
            }
        }

        let next = maxNum + 1;
        let candidate = `${prefix}-${String(next).padStart(4, '0')}`;
        while (await this.traspasoRepo.findOne({ where: { codigo: candidate } })) {
            next++;
            candidate = `${prefix}-${String(next).padStart(4, '0')}`;
        }

        return candidate;
    }

    async create(data: {
        codigo?: string;
        fecha?: string;
        sucursalOrigenId?: number;
        sucursalDestinoId?: number;
        sucursalGastoId?: number;
        almacenOrigenId?: number; // legacy compatibility
        almacenDestinoId?: number; // legacy compatibility
        costoTransporte?: number;
        sucursalCargoCosto?: CargoCostoTraspaso;
        motivo?: string;
        observaciones?: string;
        usuarioId?: number;
        detalles: {
            productoId: number;
            cantidad: number;
            numeroLote?: string;
            observacion?: string;
        }[];
    }): Promise<Traspaso> {
        const sucursalOrigenId = data.sucursalOrigenId || data.almacenOrigenId;
        const sucursalDestinoId = data.sucursalDestinoId || data.almacenDestinoId;
        const {
            costoTransporte = 0,
            sucursalCargoCosto = CargoCostoTraspaso.ORIGEN,
            motivo = '',
            observaciones = '',
            usuarioId,
            detalles = [],
        } = data;

        if (!sucursalOrigenId || !sucursalDestinoId) {
            throw new BadRequestException('Debe seleccionar la sucursal de origen y de destino');
        }

        if (Number(sucursalOrigenId) === Number(sucursalDestinoId)) {
            throw new BadRequestException('La sucursal de origen y destino deben ser diferentes');
        }

        if (!detalles || detalles.length === 0) {
            throw new BadRequestException('Debe incluir al menos un producto en el traspaso');
        }

        const sucursalOrigen = await this.sucursalRepo.findOne({ where: { id: Number(sucursalOrigenId) }, relations: ['ciudad'] });
        if (!sucursalOrigen) throw new NotFoundException('Sucursal de origen no encontrada');

        const sucursalDestino = await this.sucursalRepo.findOne({ where: { id: Number(sucursalDestinoId) }, relations: ['ciudad'] });
        if (!sucursalDestino) throw new NotFoundException('Sucursal de destino no encontrada');

        let sucursalGasto: Sucursal | null = null;
        if (data.sucursalGastoId) {
            sucursalGasto = await this.sucursalRepo.findOne({ where: { id: Number(data.sucursalGastoId) }, relations: ['ciudad'] });
        }
        if (!sucursalGasto) {
            sucursalGasto = sucursalCargoCosto === CargoCostoTraspaso.DESTINO ? sucursalDestino : sucursalOrigen;
        }
        const effectiveCargoCosto = sucursalGasto.id === sucursalDestino.id ? CargoCostoTraspaso.DESTINO : CargoCostoTraspaso.ORIGEN;

        const codigo = data.codigo?.trim() || (await this.generateCodigo(sucursalOrigen));
        const fecha = data.fecha || new Date().toISOString().substring(0, 10);

        return await this.dataSource.transaction(async (manager) => {
            const detallesToSave: DetalleTraspaso[] = [];

            for (const item of detalles) {
                const cantidad = Number(item.cantidad);
                if (isNaN(cantidad) || cantidad <= 0) {
                    throw new BadRequestException('La cantidad de cada producto debe ser mayor a 0');
                }

                const producto = await manager.findOne(Producto, { where: { id: Number(item.productoId) } });
                if (!producto) {
                    throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);
                }

                const { lotesTransferidos } = await this.applyTransferForward(manager, {
                    codigo,
                    sucursalOrigen,
                    sucursalDestino,
                    producto,
                    cantidad,
                    numeroLote: item.numeroLote,
                    observacion: item.observacion,
                    observacionesHeader: observaciones,
                    usuarioId,
                });

                const mainLote = lotesTransferidos[0];
                const detalle = manager.create(DetalleTraspaso, {
                    producto,
                    cantidad,
                    numeroLote: mainLote?.numeroLote || item.numeroLote || undefined,
                    fechaVencimiento: mainLote?.fechaVencimiento || undefined,
                    lotesDetalle: lotesTransferidos.length > 0 ? JSON.stringify(lotesTransferidos) : undefined,
                    observacion: item.observacion || '',
                });
                detallesToSave.push(detalle);
            }

            // 3. Crear cabecera de Traspaso
            const traspaso = manager.create(Traspaso, {
                codigo,
                fecha,
                sucursalOrigen,
                sucursalDestino,
                sucursalGasto,
                costoTransporte: Number(costoTransporte) || 0,
                sucursalCargoCosto: effectiveCargoCosto,
                motivo,
                observaciones,
                estado: EstadoTraspaso.COMPLETADO,
                usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                detalles: detallesToSave,
                activo: true,
            });

            return await manager.save(traspaso);
        });
    }

    async anular(id: number, usuarioId?: number): Promise<Traspaso> {
        return await this.dataSource.transaction(async (manager) => {
            const traspaso = await manager.findOne(Traspaso, {
                where: { id },
                relations: ['sucursalOrigen', 'sucursalDestino', 'detalles', 'detalles.producto'],
            });

            if (!traspaso) {
                throw new NotFoundException(`Traspaso #${id} no encontrado`);
            }

            if (traspaso.estado === EstadoTraspaso.ANULADO || !traspaso.activo) {
                throw new BadRequestException('El traspaso ya ha sido anulado previamente');
            }

            // Validar que la sucursal destino tenga el stock y lotes completos para revertir
            for (const det of traspaso.detalles) {
                const status = await this.getDetalleDestinoStatus(manager, traspaso, det);
                if (status.tieneVentasDestino) {
                    throw new BadRequestException(
                        `No se puede anular el traspaso: La sucursal destino "${traspaso.sucursalDestino.nombre}" ya vendió o utilizó ${status.cantidadVendidaDestino} unidad(es) de "${det.producto.nombre}" (solo quedan ${status.cantidadRevertible} revertibles de ${det.cantidad} traspasadas).`,
                    );
                }
            }

            // Revertir inventarios y lotes
            for (const det of traspaso.detalles) {
                const cantidad = Number(det.cantidad);

                // Descontar de Destino
                const invDestino = await manager.findOne(Inventario, {
                    where: {
                        producto: { id: det.producto.id },
                        sucursal: { id: traspaso.sucursalDestino.id },
                    },
                });
                if (invDestino) {
                    invDestino.stockActual = Math.max(0, Number(invDestino.stockActual) - cantidad);
                    await manager.save(invDestino);

                    const movRevDestino = manager.create(MovimientoInventario, {
                        inventario: invDestino,
                        tipo: 'ANULACION_TRASPASO_SALIDA',
                        cantidad: -cantidad,
                        motivo: `Anulación de Traspaso [${traspaso.codigo}] revertido a ${traspaso.sucursalOrigen.nombre}`,
                        usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                    });
                    await manager.save(movRevDestino);
                }

                // Devolver a Origen
                let invOrigen = await manager.findOne(Inventario, {
                    where: {
                        producto: { id: det.producto.id },
                        sucursal: { id: traspaso.sucursalOrigen.id },
                    },
                });
                if (invOrigen) {
                    invOrigen.stockActual = Number(invOrigen.stockActual) + cantidad;
                    await manager.save(invOrigen);

                    const movRevOrigen = manager.create(MovimientoInventario, {
                        inventario: invOrigen,
                        tipo: 'ANULACION_TRASPASO_ENTRADA',
                        cantidad: cantidad,
                        motivo: `Anulación de Traspaso [${traspaso.codigo}] devuelto desde ${traspaso.sucursalDestino.nombre}`,
                        usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                    });
                    await manager.save(movRevOrigen);
                }

                // Revertir lotes si existen
                if (det.lotesDetalle) {
                    try {
                        const lotesTransf: Array<{ numeroLote: string; cantidad: number; fechaVencimiento: string }> = JSON.parse(det.lotesDetalle);
                        for (const lt of lotesTransf) {
                            const lotDest = await manager.findOne(Lote, {
                                where: {
                                    producto: { id: det.producto.id },
                                    sucursal: { id: traspaso.sucursalDestino.id },
                                    numeroLote: lt.numeroLote,
                                },
                            });
                            if (lotDest) {
                                lotDest.cantidadActual = Math.max(0, Number(lotDest.cantidadActual) - Number(lt.cantidad));
                                await manager.save(lotDest);
                            }

                            const lotOrig = await manager.findOne(Lote, {
                                where: {
                                    producto: { id: det.producto.id },
                                    sucursal: { id: traspaso.sucursalOrigen.id },
                                    numeroLote: lt.numeroLote,
                                },
                            });
                            if (lotOrig) {
                                lotOrig.cantidadActual = Number(lotOrig.cantidadActual) + Number(lt.cantidad);
                                await manager.save(lotOrig);
                            } else {
                                const newLotOrig = manager.create(Lote, {
                                    numeroLote: lt.numeroLote,
                                    producto: det.producto,
                                    sucursal: traspaso.sucursalOrigen,
                                    cantidadInicial: Number(lt.cantidad),
                                    cantidadActual: Number(lt.cantidad),
                                    costoUnitario: Number(det.producto.precioCompra) || 0,
                                    fechaIngreso: new Date(),
                                    fechaVencimiento: lt.fechaVencimiento ? new Date(lt.fechaVencimiento) : undefined,
                                });
                                await manager.save(newLotOrig);
                            }
                        }
                    } catch (e) {
                        console.error('Error al revertir lotes de traspaso:', e);
                    }
                }
            }

            traspaso.estado = EstadoTraspaso.ANULADO;
            traspaso.activo = false;
            return await manager.save(traspaso);
        });
    }

    private mergeLotesDetalle(
        existing: Array<{ numeroLote: string; cantidad: number; fechaVencimiento?: any }>,
        added: Array<{ numeroLote: string; cantidad: number; fechaVencimiento?: any }>,
    ): Array<{ numeroLote: string; cantidad: number; fechaVencimiento?: any }> {
        const result = existing.map(l => ({ ...l, cantidad: Number(l.cantidad) || 0 }));
        for (const add of added) {
            const addCant = Number(add.cantidad) || 0;
            if (addCant <= 0) continue;
            const match = result.find(r => (r.numeroLote || '') === (add.numeroLote || ''));
            if (match) {
                match.cantidad += addCant;
                if (!match.fechaVencimiento && add.fechaVencimiento) {
                    match.fechaVencimiento = add.fechaVencimiento;
                }
            } else {
                result.push({
                    numeroLote: add.numeroLote,
                    cantidad: addCant,
                    fechaVencimiento: add.fechaVencimiento || null,
                });
            }
        }
        return result.filter(l => l.cantidad > 0);
    }

    async update(id: number, data: {
        codigo?: string;
        fecha?: string;
        sucursalOrigenId?: number;
        sucursalDestinoId?: number;
        sucursalGastoId?: number;
        almacenOrigenId?: number;
        almacenDestinoId?: number;
        costoTransporte?: number;
        sucursalCargoCosto?: CargoCostoTraspaso;
        motivo?: string;
        observaciones?: string;
        usuarioId?: number;
        detalles: {
            detalleId?: number;
            productoId: number;
            cantidad: number;
            numeroLote?: string;
            observacion?: string;
        }[];
    }): Promise<Traspaso> {
        return await this.dataSource.transaction(async (manager) => {
            const traspaso = await manager.findOne(Traspaso, {
                where: { id },
                relations: ['sucursalOrigen', 'sucursalDestino', 'sucursalGasto', 'detalles', 'detalles.producto'],
            });

            if (!traspaso) {
                throw new NotFoundException(`Traspaso #${id} no encontrado`);
            }

            if (traspaso.estado === EstadoTraspaso.ANULADO || !traspaso.activo) {
                throw new BadRequestException('No se puede editar un traspaso que ha sido anulado');
            }

            const sucursalOrigenId = data.sucursalOrigenId || data.almacenOrigenId || traspaso.sucursalOrigen?.id;
            const sucursalDestinoId = data.sucursalDestinoId || data.almacenDestinoId || traspaso.sucursalDestino?.id;
            const {
                costoTransporte = data.costoTransporte !== undefined ? Number(data.costoTransporte) : traspaso.costoTransporte,
                sucursalCargoCosto = data.sucursalCargoCosto || traspaso.sucursalCargoCosto || CargoCostoTraspaso.ORIGEN,
                motivo = data.motivo !== undefined ? data.motivo : traspaso.motivo,
                observaciones = data.observaciones !== undefined ? data.observaciones : traspaso.observaciones,
                usuarioId = data.usuarioId,
                detalles = [],
            } = data;

            if (!sucursalOrigenId || !sucursalDestinoId) {
                throw new BadRequestException('Debe seleccionar la sucursal de origen y de destino');
            }

            if (Number(sucursalOrigenId) === Number(sucursalDestinoId)) {
                throw new BadRequestException('La sucursal de origen y destino deben ser diferentes');
            }

            if (!detalles || detalles.length === 0) {
                throw new BadRequestException('Debe incluir al menos un producto en el traspaso');
            }

            let sucursalGasto: Sucursal | null = null;
            const targetGastoId = data.sucursalGastoId !== undefined ? data.sucursalGastoId : traspaso.sucursalGasto?.id;
            if (targetGastoId) {
                sucursalGasto = await manager.findOne(Sucursal, { where: { id: Number(targetGastoId) }, relations: ['ciudad'] });
            }
            if (!sucursalGasto) {
                sucursalGasto = sucursalCargoCosto === CargoCostoTraspaso.DESTINO
                    ? (traspaso.sucursalDestino || await manager.findOne(Sucursal, { where: { id: Number(sucursalDestinoId) } }))
                    : (traspaso.sucursalOrigen || await manager.findOne(Sucursal, { where: { id: Number(sucursalOrigenId) } }));
            }
            const effectiveCargoCosto = sucursalGasto?.id === Number(sucursalDestinoId) ? CargoCostoTraspaso.DESTINO : CargoCostoTraspaso.ORIGEN;
            const fecha = data.fecha || (traspaso.fecha ? String(traspaso.fecha).substring(0, 10) : new Date().toISOString().substring(0, 10));

            const existingDetalles = traspaso.detalles || [];
            const statusMap = new Map<number, Awaited<ReturnType<TraspasosService['getDetalleDestinoStatus']>>>();
            let anySoldInDestino = false;

            for (const det of existingDetalles) {
                const st = await this.getDetalleDestinoStatus(manager, traspaso, det);
                statusMap.set(det.id, st);
                if (st.tieneVentasDestino) {
                    anySoldInDestino = true;
                }
            }

            const sameSucursales =
                Number(sucursalOrigenId) === Number(traspaso.sucursalOrigen?.id) &&
                Number(sucursalDestinoId) === Number(traspaso.sucursalDestino?.id);

            if (!sameSucursales && anySoldInDestino) {
                throw new BadRequestException(
                    'No se pueden cambiar las sucursales de origen o destino porque la sucursal destino ya vendió o utilizó unidades de este traspaso.',
                );
            }

            const oldCodigo = traspaso.codigo;
            const sucursalOrigen = await manager.findOne(Sucursal, { where: { id: Number(sucursalOrigenId) }, relations: ['ciudad'] });
            if (!sucursalOrigen) throw new NotFoundException('Sucursal de origen no encontrada');

            const sucursalDestino = await manager.findOne(Sucursal, { where: { id: Number(sucursalDestinoId) }, relations: ['ciudad'] });
            if (!sucursalDestino) throw new NotFoundException('Sucursal de destino no encontrada');

            let codigo = data.codigo?.trim() || traspaso.codigo;
            if (!sameSucursales && Number(sucursalOrigenId) !== Number(traspaso.sucursalOrigen?.id) && (!data.codigo || data.codigo.trim() === oldCodigo)) {
                codigo = await this.generateCodigo(sucursalOrigen);
            } else if (data.codigo?.trim() && data.codigo.trim() !== oldCodigo) {
                codigo = data.codigo.trim();
            }

            if (codigo !== oldCodigo) {
                traspaso.codigo = codigo;
            }

            const detallesToSave: DetalleTraspaso[] = [];

            if (!sameSucursales) {
                // Ningún ítem se ha vendido en destino: revertir todo de las sucursales anteriores y aplicar en las nuevas
                for (const det of existingDetalles) {
                    const st = statusMap.get(det.id)!;
                    await this.revertTransferPartial(manager, {
                        codigo: oldCodigo,
                        sucursalOrigen: traspaso.sucursalOrigen,
                        sucursalDestino: traspaso.sucursalDestino,
                        producto: det.producto,
                        cantidadARevertir: Number(det.cantidad),
                        lotesTransf: st.lotesTransf,
                        observacion: det.observacion,
                        usuarioId,
                        skipKardex: true,
                    });
                }
                await manager.delete(DetalleTraspaso, { traspaso: { id: traspaso.id } });

                for (const item of detalles) {
                    const cantidad = Number(item.cantidad);
                    if (isNaN(cantidad) || cantidad <= 0) {
                        throw new BadRequestException('La cantidad de cada producto debe ser mayor a 0');
                    }
                    const producto = await manager.findOne(Producto, { where: { id: Number(item.productoId) } });
                    if (!producto) throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);

                    const { lotesTransferidos } = await this.applyTransferForward(manager, {
                        codigo,
                        sucursalOrigen,
                        sucursalDestino,
                        producto,
                        cantidad,
                        numeroLote: item.numeroLote,
                        observacion: item.observacion,
                        observacionesHeader: observaciones,
                        usuarioId,
                        skipKardex: true,
                    });

                    const mainLote = lotesTransferidos[0];
                    const nuevoDet = manager.create(DetalleTraspaso, {
                        traspaso,
                        producto,
                        cantidad,
                        numeroLote: mainLote?.numeroLote || item.numeroLote || undefined,
                        fechaVencimiento: mainLote?.fechaVencimiento || undefined,
                        lotesDetalle: lotesTransferidos.length > 0 ? JSON.stringify(lotesTransferidos) : undefined,
                        observacion: item.observacion || '',
                    });
                    detallesToSave.push(nuevoDet);
                }

                await manager.save(detallesToSave);
            } else {
                // Mismas sucursales: procesar ítem por ítem de forma independiente (soporta aumentos/ajustes incluso con ventas previas)
                const matchedDetalleByItemIdx = new Map<number, DetalleTraspaso>();
                const usedDetalleIds = new Set<number>();

                // Paso 1: Match por detalleId explícito
                detalles.forEach((item, idx) => {
                    if (item.detalleId) {
                        const found = existingDetalles.find(d => d.id === Number(item.detalleId) && !usedDetalleIds.has(d.id));
                        if (found) {
                            matchedDetalleByItemIdx.set(idx, found);
                            usedDetalleIds.add(found.id);
                        }
                    }
                });

                // Paso 2: Match por productoId + numeroLote (para payloads sin detalleId)
                detalles.forEach((item, idx) => {
                    if (matchedDetalleByItemIdx.has(idx)) return;
                    const normItemLote = (item.numeroLote || '').trim().toLowerCase();
                    const found = existingDetalles.find(d =>
                        !usedDetalleIds.has(d.id) &&
                        Number(d.producto.id) === Number(item.productoId) &&
                        (d.numeroLote || '').trim().toLowerCase() === normItemLote,
                    );
                    if (found) {
                        matchedDetalleByItemIdx.set(idx, found);
                        usedDetalleIds.add(found.id);
                    }
                });

                // Paso 3: Fallback por productoId (útil para ítems multi-lote Auto donde el lote vino vacío, o ítems sin ventas donde cambió el lote)
                detalles.forEach((item, idx) => {
                    if (matchedDetalleByItemIdx.has(idx)) return;
                    const found = existingDetalles.find(d => !usedDetalleIds.has(d.id) && Number(d.producto.id) === Number(item.productoId));
                    if (found) {
                        matchedDetalleByItemIdx.set(idx, found);
                        usedDetalleIds.add(found.id);
                    }
                });

                // A. Procesar ítems eliminados (presentes antes, ausentes ahora)
                for (const det of existingDetalles) {
                    if (usedDetalleIds.has(det.id)) continue;
                    const st = statusMap.get(det.id)!;
                    if (st.tieneVentasDestino) {
                        throw new BadRequestException(
                            `No se puede eliminar "${det.producto.nombre}" porque la sucursal destino "${traspaso.sucursalDestino.nombre}" ya vendió o utilizó ${st.cantidadVendidaDestino} unidad(es) de este lote.`,
                        );
                    }
                    await this.revertTransferPartial(manager, {
                        codigo,
                        sucursalOrigen,
                        sucursalDestino,
                        producto: det.producto,
                        cantidadARevertir: Number(det.cantidad),
                        lotesTransf: st.lotesTransf,
                        observacion: det.observacion,
                        usuarioId,
                        skipKardex: true,
                    });
                    await manager.delete(DetalleTraspaso, { id: det.id });
                }

                // B. Procesar ítems mantenidos, modificados o nuevos
                for (let idx = 0; idx < detalles.length; idx++) {
                    const item = detalles[idx];
                    const newQty = Number(item.cantidad);
                    if (isNaN(newQty) || newQty <= 0) {
                        throw new BadRequestException('La cantidad de cada producto debe ser mayor a 0');
                    }

                    const existingDet = matchedDetalleByItemIdx.get(idx);

                    if (!existingDet) {
                        // Ítem completamente nuevo agregado al traspaso
                        const producto = await manager.findOne(Producto, { where: { id: Number(item.productoId) } });
                        if (!producto) throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);

                        const { lotesTransferidos } = await this.applyTransferForward(manager, {
                            codigo,
                            sucursalOrigen,
                            sucursalDestino,
                            producto,
                            cantidad: newQty,
                            numeroLote: item.numeroLote,
                            observacion: item.observacion,
                            observacionesHeader: observaciones,
                            usuarioId,
                            skipKardex: true,
                        });

                        const mainLote = lotesTransferidos[0];
                        const nuevoDet = manager.create(DetalleTraspaso, {
                            traspaso,
                            producto,
                            cantidad: newQty,
                            numeroLote: mainLote?.numeroLote || item.numeroLote || undefined,
                            fechaVencimiento: mainLote?.fechaVencimiento || undefined,
                            lotesDetalle: lotesTransferidos.length > 0 ? JSON.stringify(lotesTransferidos) : undefined,
                            observacion: item.observacion || '',
                        });
                        await manager.save(nuevoDet);
                        detallesToSave.push(nuevoDet);
                        continue;
                    }

                    const st = statusMap.get(existingDet.id)!;
                    const oldQty = Number(existingDet.cantidad);
                    const normItemLote = (item.numeroLote || '').trim().toLowerCase();
                    const normDetLote = (existingDet.numeroLote || '').trim().toLowerCase();

                    // Determinar si cambió el producto o cambió el lote seleccionado
                    const isMultiLoteAuto = st.lotesTransf.length > 1;
                    const loteChanged = isMultiLoteAuto
                        ? (normItemLote !== '' && normItemLote !== normDetLote)
                        : (normItemLote !== normDetLote && !(normItemLote === '' && normDetLote.startsWith('trasp-')));
                    const productChanged = Number(item.productoId) !== Number(existingDet.producto.id);

                    if (productChanged || loteChanged) {
                        if (st.tieneVentasDestino) {
                            throw new BadRequestException(
                                `No se puede cambiar el producto o lote de "${existingDet.producto.nombre}" porque la sucursal destino ya vendió o utilizó ${st.cantidadVendidaDestino} unidad(es).`,
                            );
                        }

                        // Revertir el ítem anterior y aplicar el nuevo
                        await this.revertTransferPartial(manager, {
                            codigo,
                            sucursalOrigen,
                            sucursalDestino,
                            producto: existingDet.producto,
                            cantidadARevertir: oldQty,
                            lotesTransf: st.lotesTransf,
                            observacion: existingDet.observacion,
                            usuarioId,
                            skipKardex: true,
                        });
                        await manager.delete(DetalleTraspaso, { id: existingDet.id });

                        const producto = await manager.findOne(Producto, { where: { id: Number(item.productoId) } });
                        if (!producto) throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);

                        const { lotesTransferidos } = await this.applyTransferForward(manager, {
                            codigo,
                            sucursalOrigen,
                            sucursalDestino,
                            producto,
                            cantidad: newQty,
                            numeroLote: item.numeroLote,
                            observacion: item.observacion,
                            observacionesHeader: observaciones,
                            usuarioId,
                            skipKardex: true,
                        });

                        const mainLote = lotesTransferidos[0];
                        const nuevoDet = manager.create(DetalleTraspaso, {
                            traspaso,
                            producto,
                            cantidad: newQty,
                            numeroLote: mainLote?.numeroLote || item.numeroLote || undefined,
                            fechaVencimiento: mainLote?.fechaVencimiento || undefined,
                            lotesDetalle: lotesTransferidos.length > 0 ? JSON.stringify(lotesTransferidos) : undefined,
                            observacion: item.observacion || '',
                        });
                        await manager.save(nuevoDet);
                        detallesToSave.push(nuevoDet);
                        continue;
                    }

                    // Mismo producto y lote: calcular diferencia (delta)
                    const diff = Number((newQty - oldQty).toFixed(2));

                    if (diff === 0) {
                        if (item.observacion !== undefined && existingDet.observacion !== item.observacion) {
                            existingDet.observacion = item.observacion;
                            await manager.save(existingDet);
                        }
                        detallesToSave.push(existingDet);
                    } else if (diff > 0) {
                        // AUMENTO de cantidad (permitido incluso si ya hubo ventas en destino!)
                        const loteForDelta = item.numeroLote || (st.lotesTransf.length === 1 ? existingDet.numeroLote : undefined);
                        const { lotesTransferidos: addedLotes } = await this.applyTransferForward(manager, {
                            codigo,
                            sucursalOrigen,
                            sucursalDestino,
                            producto: existingDet.producto,
                            cantidad: diff,
                            numeroLote: loteForDelta,
                            observacion: item.observacion,
                            observacionesHeader: observaciones,
                            usuarioId,
                            skipKardex: true,
                        });

                        const mergedLotes = this.mergeLotesDetalle(st.lotesTransf, addedLotes);
                        existingDet.cantidad = newQty;
                        existingDet.lotesDetalle = mergedLotes.length > 0 ? JSON.stringify(mergedLotes) : existingDet.lotesDetalle;
                        existingDet.numeroLote = mergedLotes[0]?.numeroLote || existingDet.numeroLote;
                        if (item.observacion !== undefined) {
                            existingDet.observacion = item.observacion;
                        }
                        await manager.save(existingDet);
                        detallesToSave.push(existingDet);
                    } else {
                        // REDUCCIÓN de cantidad (diff < 0)
                        if (newQty < st.cantidadVendidaDestino) {
                            throw new BadRequestException(
                                `No se puede reducir "${existingDet.producto.nombre}" a ${newQty} un.: la sucursal destino ya vendió o utilizó ${st.cantidadVendidaDestino} unidad(es) de este lote (cantidad mínima permitida: ${st.cantidadVendidaDestino}).`,
                            );
                        }

                        const cantidadAReducir = Math.abs(diff);
                        const remainingLotes = await this.revertTransferPartial(manager, {
                            codigo,
                            sucursalOrigen,
                            sucursalDestino,
                            producto: existingDet.producto,
                            cantidadARevertir: cantidadAReducir,
                            lotesTransf: st.lotesTransf,
                            observacion: item.observacion ?? existingDet.observacion,
                            usuarioId,
                            skipKardex: true,
                        });

                        existingDet.cantidad = newQty;
                        existingDet.lotesDetalle = remainingLotes.length > 0 ? JSON.stringify(remainingLotes) : (null as any);
                        existingDet.numeroLote = remainingLotes[0]?.numeroLote || existingDet.numeroLote;
                        if (item.observacion !== undefined) {
                            existingDet.observacion = item.observacion;
                        }
                        await manager.save(existingDet);
                        detallesToSave.push(existingDet);
                    }
                }
            }

            // Sincronizar Kardex actualizando los registros originales del traspaso (sin duplicar líneas)
            await this.syncKardexMovementsForTraspaso(manager, {
                oldCodigo,
                codigo,
                sucursalOrigen,
                sucursalDestino,
                detallesActuales: detallesToSave,
                observacionesHeader: observaciones,
                usuarioId,
            });

            // Actualizar campos cabecera
            traspaso.fecha = fecha;
            traspaso.sucursalOrigen = sucursalOrigen;
            traspaso.sucursalDestino = sucursalDestino;
            traspaso.sucursalGasto = sucursalGasto;
            traspaso.costoTransporte = Number(costoTransporte) || 0;
            traspaso.sucursalCargoCosto = effectiveCargoCosto;
            traspaso.motivo = motivo;
            traspaso.observaciones = observaciones;
            traspaso.detalles = detallesToSave;

            return await manager.save(traspaso);
        });
    }
}
