import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Traspaso, EstadoTraspaso, CargoCostoTraspaso } from './traspaso.entity';
import { DetalleTraspaso } from './detalle-traspaso.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Producto } from '../productos/producto.entity';
import { Lote } from '../inventario/lote.entity';
import { Egreso, MonedaEgreso } from '../egresos/egreso.entity';
import { MovimientoInventario } from '../movimientos-inventario/movimiento_inventario.entity';

@Injectable()
export class TraspasosService {
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
        @InjectRepository(Egreso)
        private egresoRepo: Repository<Egreso>,
        private dataSource: DataSource,
    ) {}

    async findAll(): Promise<Traspaso[]> {
        return this.traspasoRepo.createQueryBuilder('traspaso')
            .leftJoinAndSelect('traspaso.sucursalOrigen', 'sucursalOrigen')
            .leftJoinAndSelect('sucursalOrigen.ciudad', 'origenCiudad')
            .leftJoinAndSelect('traspaso.sucursalDestino', 'sucursalDestino')
            .leftJoinAndSelect('sucursalDestino.ciudad', 'destinoCiudad')
            .leftJoinAndSelect('traspaso.usuario', 'usuario')
            .leftJoinAndSelect('traspaso.egreso', 'egreso')
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
            .leftJoinAndSelect('traspaso.usuario', 'usuario')
            .leftJoinAndSelect('traspaso.egreso', 'egreso')
            .leftJoinAndSelect('traspaso.detalles', 'detalles')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .where('traspaso.id = :id', { id })
            .getOne();

        if (!traspaso) {
            throw new NotFoundException(`Traspaso #${id} no encontrado`);
        }
        return traspaso;
    }

    private async generateCodigo(): Promise<string> {
        const count = await this.traspasoRepo.count();
        const nextNum = count + 1;
        const formatted = nextNum.toString().padStart(4, '0');
        let code = `TRASP-${formatted}`;

        const existing = await this.traspasoRepo.findOne({ where: { codigo: code } });
        if (existing) {
            code = `TRASP-${Date.now().toString().slice(-6)}`;
        }
        return code;
    }

    async create(data: {
        codigo?: string;
        fecha?: string;
        sucursalOrigenId?: number;
        sucursalDestinoId?: number;
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

        const sucursalOrigen = await this.sucursalRepo.findOne({ where: { id: Number(sucursalOrigenId) } });
        if (!sucursalOrigen) throw new NotFoundException('Sucursal de origen no encontrada');

        const sucursalDestino = await this.sucursalRepo.findOne({ where: { id: Number(sucursalDestinoId) } });
        if (!sucursalDestino) throw new NotFoundException('Sucursal de destino no encontrada');

        const codigo = data.codigo?.trim() || (await this.generateCodigo());
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

                // 1. Validar y descontar stock en Sucursal Origen
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

                // 1.1 Descontar y transferir Lotes desde Origen hacia Destino
                const lotesWhere: any = {
                    producto: { id: producto.id },
                    sucursal: { id: sucursalOrigen.id },
                    cantidadActual: MoreThan(0),
                };
                if (item.numeroLote) {
                    lotesWhere.numeroLote = item.numeroLote;
                }

                const lotesOrigen = await manager.find(Lote, {
                    where: lotesWhere,
                    order: {
                        fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                        fechaIngreso: 'ASC',
                    },
                });

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

                        // Incrementar o crear lote en sucursal destino
                        let loteDestino = await manager.findOne(Lote, {
                            where: {
                                producto: { id: producto.id },
                                sucursal: { id: sucursalDestino.id },
                                numeroLote: loteOrigen.numeroLote || `TRASP-${codigo}`,
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
                                numeroLote: loteOrigen.numeroLote || `TRASP-${codigo}`,
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
                            fechaIngreso: new Date()
                        });
                        await manager.save(loteDestino);
                    }

                    lotesTransferidos.push({
                        numeroLote: `TRASP-${codigo}`,
                        cantidad: cantidadPorDescontar,
                        fechaVencimiento: null
                    });
                    cantidadPorDescontar = 0;
                }

                const lotesResumen = lotesTransferidos.map(l => `${l.numeroLote} (${l.cantidad} u.)`).join(', ');
                const costoTraspaso = Number(invOrigen.precioCompra) || Number(producto.precioCompra) || 0;
                const obsTraspaso = item.observacion || observaciones || '';
                const movOrigen = manager.create(MovimientoInventario, {
                    inventario: invOrigen,
                    tipo: 'TRASPASO_SALIDA',
                    cantidad: -cantidad,
                    motivo: `Traspaso [${codigo}] hacia ${sucursalDestino.nombre}${lotesResumen ? ' [Lotes: ' + lotesResumen + ']' : ''}. ${item.observacion || ''}`.trim(),
                    numeroDocumento: codigo,
                    observaciones: obsTraspaso,
                    costoUnitario: costoTraspaso,
                    usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                });
                await manager.save(movOrigen);

                // 2. Incrementar o crear stock en Sucursal Destino
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

                // Registrar Kardex Destino
                const movDestino = manager.create(MovimientoInventario, {
                    inventario: invDestino,
                    tipo: 'TRASPASO_ENTRADA',
                    cantidad: cantidad,
                    motivo: `Traspaso [${codigo}] desde ${sucursalOrigen.nombre}${lotesResumen ? ' [Lotes: ' + lotesResumen + ']' : ''}. ${item.observacion || ''}`.trim(),
                    numeroDocumento: codigo,
                    observaciones: obsTraspaso,
                    costoUnitario: costoTraspaso,
                    usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                });
                await manager.save(movDestino);

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

            // 2.5 Registrar Egreso automático si existe costo de transporte
            const sucursalCargo = sucursalCargoCosto === CargoCostoTraspaso.DESTINO ? sucursalDestino : sucursalOrigen;
            let egresoSaved: Egreso | undefined;

            if (Number(costoTransporte) > 0) {
                const egreso = manager.create(Egreso, {
                    codigo: `EGR-TRASP-${Date.now().toString().slice(-6)}`,
                    fecha,
                    detalle: `Costo de transporte por Traspaso [${codigo}] (${sucursalOrigen.nombre} -> ${sucursalDestino.nombre})`,
                    monto: Number(costoTransporte),
                    moneda: MonedaEgreso.BOB,
                    tipoCambio: 6.96,
                    montoEquivalente: Number((Number(costoTransporte) / 6.96).toFixed(2)),
                    formaPago: 'Efectivo',
                    nroComprobante: codigo,
                    observaciones: `Gasto de transporte asumido por ${sucursalCargo.nombre}`,
                    sucursal: sucursalCargo,
                    usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                });
                egresoSaved = await manager.save(egreso);
            }

            // 3. Crear cabecera de Traspaso
            const traspaso = manager.create(Traspaso, {
                codigo,
                fecha,
                sucursalOrigen,
                sucursalDestino,
                costoTransporte: Number(costoTransporte) || 0,
                sucursalCargoCosto,
                egreso: egresoSaved,
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
                relations: ['sucursalOrigen', 'sucursalDestino', 'egreso', 'detalles', 'detalles.producto'],
            });

            if (!traspaso) {
                throw new NotFoundException(`Traspaso #${id} no encontrado`);
            }

            if (traspaso.estado === EstadoTraspaso.ANULADO || !traspaso.activo) {
                throw new BadRequestException('El traspaso ya ha sido anulado previamente');
            }

            // Validar que la sucursal destino tenga el stock para revertir
            for (const det of traspaso.detalles) {
                const invDestino = await manager.findOne(Inventario, {
                    where: {
                        producto: { id: det.producto.id },
                        sucursal: { id: traspaso.sucursalDestino.id },
                    },
                });

                const stockDestino = invDestino ? Number(invDestino.stockActual) : 0;
                if (stockDestino < Number(det.cantidad)) {
                    throw new BadRequestException(
                        `No se puede anular el traspaso: La sucursal de destino "${traspaso.sucursalDestino.nombre}" solo dispone de ${stockDestino} unidades de "${det.producto.nombre}" (se requieren ${det.cantidad} para la reversión).`,
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

            // Anular Egreso asociado si existe
            if (traspaso.egreso) {
                const egreso = await manager.findOne(Egreso, { where: { id: traspaso.egreso.id } });
                if (egreso) {
                    egreso.activo = false;
                    egreso.observaciones = `${egreso.observaciones || ''} [ANULADO por anulación del Traspaso ${traspaso.codigo}]`.trim();
                    await manager.save(egreso);
                }
            }

            traspaso.estado = EstadoTraspaso.ANULADO;
            traspaso.activo = false;
            return await manager.save(traspaso);
        });
    }

    async update(id: number, data: {
        codigo?: string;
        fecha?: string;
        sucursalOrigenId?: number;
        sucursalDestinoId?: number;
        almacenOrigenId?: number;
        almacenDestinoId?: number;
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
        return await this.dataSource.transaction(async (manager) => {
            const traspaso = await manager.findOne(Traspaso, {
                where: { id },
                relations: ['sucursalOrigen', 'sucursalDestino', 'egreso', 'detalles', 'detalles.producto'],
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

            // 1. Validar que la sucursal de destino anterior tenga stock suficiente para revertir el traspaso anterior
            for (const det of traspaso.detalles) {
                const invDestino = await manager.findOne(Inventario, {
                    where: {
                        producto: { id: det.producto.id },
                        sucursal: { id: traspaso.sucursalDestino.id },
                    },
                });
                const stockDestino = invDestino ? Number(invDestino.stockActual) : 0;
                if (stockDestino < Number(det.cantidad)) {
                    throw new BadRequestException(
                        `No se puede editar el traspaso: La sucursal destino "${traspaso.sucursalDestino.nombre}" solo dispone de ${stockDestino} unidades de "${det.producto.nombre}" (se requieren ${det.cantidad} para revertir antes de aplicar los cambios).`,
                    );
                }
            }

            // 2. Revertir inventarios y lotes anteriores
            for (const det of traspaso.detalles) {
                const cantidad = Number(det.cantidad);

                // Descontar de destino anterior
                const invDestino = await manager.findOne(Inventario, {
                    where: {
                        producto: { id: det.producto.id },
                        sucursal: { id: traspaso.sucursalDestino.id },
                    },
                });
                if (invDestino) {
                    invDestino.stockActual = Math.max(0, Number(invDestino.stockActual) - cantidad);
                    await manager.save(invDestino);
                }

                // Devolver a origen anterior
                let invOrigen = await manager.findOne(Inventario, {
                    where: {
                        producto: { id: det.producto.id },
                        sucursal: { id: traspaso.sucursalOrigen.id },
                    },
                });
                if (invOrigen) {
                    invOrigen.stockActual = Number(invOrigen.stockActual) + cantidad;
                    await manager.save(invOrigen);
                }

                // Revertir lotes anteriores si existen
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
                        console.error('Error al revertir lotes en edición de traspaso:', e);
                    }
                }
            }

            // 3. Eliminar movimientos y detalles anteriores
            await manager.delete(MovimientoInventario, { numeroDocumento: traspaso.codigo });
            await manager.delete(DetalleTraspaso, { traspaso: { id: traspaso.id } });

            // 4. Buscar nuevas sucursales
            const sucursalOrigen = await manager.findOne(Sucursal, { where: { id: Number(sucursalOrigenId) } });
            if (!sucursalOrigen) throw new NotFoundException('Sucursal de origen no encontrada');

            const sucursalDestino = await manager.findOne(Sucursal, { where: { id: Number(sucursalDestinoId) } });
            if (!sucursalDestino) throw new NotFoundException('Sucursal de destino no encontrada');

            const codigo = traspaso.codigo;
            const fecha = data.fecha || (traspaso.fecha ? String(traspaso.fecha).substring(0, 10) : new Date().toISOString().substring(0, 10));

            // 5. Aplicar nuevos productos y cantidades
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

                // 5.1 Validar y descontar stock en Sucursal Origen
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

                // 5.2 Descontar y transferir Lotes
                const lotesWhere: any = {
                    producto: { id: producto.id },
                    sucursal: { id: sucursalOrigen.id },
                    cantidadActual: MoreThan(0),
                };
                if (item.numeroLote) {
                    lotesWhere.numeroLote = item.numeroLote;
                }

                const lotesOrigen = await manager.find(Lote, {
                    where: lotesWhere,
                    order: {
                        fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                        fechaIngreso: 'ASC',
                    },
                });

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

                        let loteDestino = await manager.findOne(Lote, {
                            where: {
                                producto: { id: producto.id },
                                sucursal: { id: sucursalDestino.id },
                                numeroLote: loteOrigen.numeroLote || `TRASP-${codigo}`,
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
                                numeroLote: loteOrigen.numeroLote || `TRASP-${codigo}`,
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
                            fechaIngreso: new Date()
                        });
                        await manager.save(loteDestino);
                    }

                    lotesTransferidos.push({
                        numeroLote: `TRASP-${codigo}`,
                        cantidad: cantidadPorDescontar,
                        fechaVencimiento: null
                    });
                    cantidadPorDescontar = 0;
                }

                const lotesResumen = lotesTransferidos.map(l => `${l.numeroLote} (${l.cantidad} u.)`).join(', ');
                const costoTraspaso = Number(invOrigen.precioCompra) || Number(producto.precioCompra) || 0;
                const obsTraspaso = item.observacion || observaciones || '';

                // Kardex Origen
                const movOrigen = manager.create(MovimientoInventario, {
                    inventario: invOrigen,
                    tipo: 'TRASPASO_SALIDA',
                    cantidad: -cantidad,
                    motivo: `Traspaso [${codigo}] hacia ${sucursalDestino.nombre}${lotesResumen ? ' [Lotes: ' + lotesResumen + ']' : ''}. ${item.observacion || ''}`.trim(),
                    numeroDocumento: codigo,
                    observaciones: obsTraspaso,
                    costoUnitario: costoTraspaso,
                    usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                });
                await manager.save(movOrigen);

                // 5.3 Incrementar o crear stock en Destino
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

                // Kardex Destino
                const movDestino = manager.create(MovimientoInventario, {
                    inventario: invDestino,
                    tipo: 'TRASPASO_ENTRADA',
                    cantidad: cantidad,
                    motivo: `Traspaso [${codigo}] desde ${sucursalOrigen.nombre}${lotesResumen ? ' [Lotes: ' + lotesResumen + ']' : ''}. ${item.observacion || ''}`.trim(),
                    numeroDocumento: codigo,
                    observaciones: obsTraspaso,
                    costoUnitario: costoTraspaso,
                    usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                });
                await manager.save(movDestino);

                const mainLote = lotesTransferidos[0];
                const detalle = manager.create(DetalleTraspaso, {
                    traspaso,
                    producto,
                    cantidad,
                    numeroLote: mainLote?.numeroLote || item.numeroLote || undefined,
                    fechaVencimiento: mainLote?.fechaVencimiento || undefined,
                    lotesDetalle: lotesTransferidos.length > 0 ? JSON.stringify(lotesTransferidos) : undefined,
                    observacion: item.observacion || '',
                });
                detallesToSave.push(detalle);
            }

            await manager.save(detallesToSave);

            // 6. Manejo de Egreso por Costo de Transporte
            const sucursalCargo = sucursalCargoCosto === CargoCostoTraspaso.DESTINO ? sucursalDestino : sucursalOrigen;
            let egresoSaved: Egreso | null = traspaso.egreso || null;

            if (Number(costoTransporte) > 0) {
                if (egresoSaved) {
                    egresoSaved.fecha = fecha;
                    egresoSaved.detalle = `Costo de transporte por Traspaso [${codigo}] (${sucursalOrigen.nombre} -> ${sucursalDestino.nombre})`;
                    egresoSaved.monto = Number(costoTransporte);
                    egresoSaved.montoEquivalente = Number((Number(costoTransporte) / 6.96).toFixed(2));
                    egresoSaved.sucursal = sucursalCargo;
                    egresoSaved.observaciones = `Gasto de transporte asumido por ${sucursalCargo.nombre}`;
                    egresoSaved.activo = true;
                    egresoSaved = await manager.save(egresoSaved);
                } else {
                    const egreso = manager.create(Egreso, {
                        codigo: `EGR-TRASP-${Date.now().toString().slice(-6)}`,
                        fecha,
                        detalle: `Costo de transporte por Traspaso [${codigo}] (${sucursalOrigen.nombre} -> ${sucursalDestino.nombre})`,
                        monto: Number(costoTransporte),
                        moneda: MonedaEgreso.BOB,
                        tipoCambio: 6.96,
                        montoEquivalente: Number((Number(costoTransporte) / 6.96).toFixed(2)),
                        formaPago: 'Efectivo',
                        nroComprobante: codigo,
                        observaciones: `Gasto de transporte asumido por ${sucursalCargo.nombre}`,
                        sucursal: sucursalCargo,
                        usuario: usuarioId ? ({ id: usuarioId } as any) : undefined,
                    });
                    egresoSaved = await manager.save(egreso);
                }
            } else if (egresoSaved) {
                egresoSaved.activo = false;
                await manager.save(egresoSaved);
                egresoSaved = null;
            }

            // 7. Actualizar campos cabecera
            traspaso.fecha = fecha;
            traspaso.sucursalOrigen = sucursalOrigen;
            traspaso.sucursalDestino = sucursalDestino;
            traspaso.costoTransporte = Number(costoTransporte) || 0;
            traspaso.sucursalCargoCosto = sucursalCargoCosto;
            traspaso.egreso = egresoSaved as any;
            traspaso.motivo = motivo;
            traspaso.observaciones = observaciones;
            traspaso.detalles = detallesToSave;

            return await manager.save(traspaso);
        });
    }
}
