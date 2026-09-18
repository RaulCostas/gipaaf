import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { MovimientoInventario } from './movimiento_inventario.entity';
import { Nota, TipoNota, EstadoNota } from '../notas/nota.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Injectable()
export class MovimientosInventarioService implements OnModuleInit {
    constructor(
        @InjectRepository(MovimientoInventario)
        private repo: Repository<MovimientoInventario>,
        @InjectRepository(Nota)
        private notaRepo: Repository<Nota>,
        @InjectRepository(Inventario)
        private inventarioRepo: Repository<Inventario>,
        @InjectRepository(Sucursal)
        private sucursalRepo: Repository<Sucursal>,
    ) {}

    async onModuleInit() {
        await this.syncHistoricalNotas();
    }

    async syncHistoricalNotas() {
        try {
            const confirmedNotas = await this.notaRepo.find({
                where: { estado: EstadoNota.CONFIRMADA },
                relations: ['detalles', 'detalles.producto', 'sucursal', 'cliente', 'proveedor', 'usuario', 'costoImportacion']
            });

            for (const nota of confirmedNotas) {
                if (nota.tipo !== TipoNota.COMPRA && nota.tipo !== TipoNota.VENTA && nota.tipo !== TipoNota.DEVOLUCION) {
                    continue;
                }

                // Check if any MovimientoInventario already exists for this nota number
                const count = await this.repo.count({
                    where: { motivo: Like(`%[${nota.numero}]%`) }
                });

                if (count > 0) continue; // Already synced

                let targetSucursal: Sucursal | null = nota.sucursal || null;
                if (!targetSucursal) {
                    targetSucursal = await this.sucursalRepo.findOne({ where: { activo: true } });
                }

                for (const det of (nota.detalles || [])) {
                    if (!det.producto) continue;

                    let inv: Inventario | null = null;
                    if (targetSucursal) {
                        inv = await this.inventarioRepo.findOne({
                            where: { producto: { id: det.producto.id }, sucursal: { id: targetSucursal.id } }
                        });
                    } else {
                        inv = await this.inventarioRepo.findOne({
                            where: { producto: { id: det.producto.id } }
                        });
                    }

                    if (!inv && targetSucursal) {
                        inv = await this.inventarioRepo.save(this.inventarioRepo.create({
                            producto: det.producto,
                            sucursal: targetSucursal,
                            stockActual: 0,
                            stockMinimo: 0,
                            stockMaximo: 0,
                            precioCompra: Number(det.precioUnitario) || 0,
                            precioVenta: Number(det.producto.precioVenta) || 0
                        }));
                    }

                    if (!inv) continue;

                    let unitPriceBob = Number(det.precioUnitario) || 0;
                    if (nota.moneda === 'USD') {
                        unitPriceBob = unitPriceBob * (Number(nota.tipoCambio) || 6.96);
                    }
                    let factorIncremento = 1;
                    if (nota.costoImportacion) {
                        const pct = Number(nota.costoImportacion.porcentajeGastos) || 0;
                        factorIncremento = 1 + (pct / 100);
                    }
                    const costoUnitCompra = Number((unitPriceBob * factorIncremento).toFixed(2));
                    const obs = nota.observaciones || '';

                    if (nota.tipo === TipoNota.COMPRA) {
                        const provPersona = nota.proveedor?.persona;
                        const provName = nota.proveedor?.empresa || (provPersona ? `${provPersona.nombres || ''} ${provPersona.apellidos || ''}`.trim() : '');
                        const motivo = `Compra [${nota.numero}]${provName ? ' - ' + provName : ''}`;
                        await this.repo.save(this.repo.create({
                            inventario: inv,
                            tipo: 'COMPRA',
                            cantidad: Number(det.cantidad),
                            motivo: motivo.trim(),
                            numeroDocumento: nota.numero,
                            observaciones: obs,
                            costoUnitario: costoUnitCompra,
                            usuario: nota.usuario || undefined,
                            creadoEn: nota.fecha ? new Date(nota.fecha + 'T12:00:00') : (nota.creadoEn || new Date()),
                        }));
                    } else if (nota.tipo === TipoNota.VENTA) {
                        const cliPersona = nota.cliente?.persona;
                        const cliName = cliPersona ? `${cliPersona.nombres || ''} ${cliPersona.apellidos || ''}`.trim() : '';
                        const motivo = `Venta [${nota.numero}]${cliName ? ' - ' + cliName : ''}`;
                        await this.repo.save(this.repo.create({
                            inventario: inv,
                            tipo: 'VENTA',
                            cantidad: -Number(det.cantidad),
                            motivo: motivo.trim(),
                            numeroDocumento: nota.numero,
                            observaciones: obs,
                            costoUnitario: Number(inv.precioCompra) || Number(det.producto?.precioCompra) || 0,
                            usuario: nota.usuario || undefined,
                            creadoEn: nota.fecha ? new Date(nota.fecha + 'T12:00:00') : (nota.creadoEn || new Date()),
                        }));
                    } else if (nota.tipo === TipoNota.DEVOLUCION) {
                        const motivo = `Devolución [${nota.numero}]`;
                        await this.repo.save(this.repo.create({
                            inventario: inv,
                            tipo: 'DEVOLUCION',
                            cantidad: Number(det.cantidad),
                            motivo: motivo.trim(),
                            numeroDocumento: nota.numero,
                            observaciones: obs,
                            costoUnitario: Number(inv.precioCompra) || Number(det.producto?.precioCompra) || 0,
                            usuario: nota.usuario || undefined,
                            creadoEn: nota.fecha ? new Date(nota.fecha + 'T12:00:00') : (nota.creadoEn || new Date()),
                        }));
                    }
                }
            }

            // Also backfill existing records that have null numeroDocumento, observaciones, or un-converted costoUnitario
            const allMovs = await this.repo.find({ relations: ['inventario', 'inventario.producto'] });
            for (const mov of allMovs) {
                let updated = false;
                const match = mov.motivo?.match(/\[(.*?)\]/);
                const docNum = mov.numeroDocumento || (match && match[1]);

                if (docNum) {
                    if (!mov.numeroDocumento) {
                        mov.numeroDocumento = docNum;
                        updated = true;
                    }
                    const matchedNota = confirmedNotas.find(n => n.numero === docNum);
                    if (matchedNota) {
                        if (!mov.observaciones && matchedNota.observaciones) {
                            mov.observaciones = matchedNota.observaciones;
                            updated = true;
                        }
                        if (mov.tipo === 'COMPRA') {
                            const det = matchedNota.detalles?.find(d => d.producto?.id === mov.inventario?.producto?.id);
                            if (det) {
                                let unitPriceBob = Number(det.precioUnitario) || 0;
                                if (matchedNota.moneda === 'USD') {
                                    unitPriceBob = unitPriceBob * (Number(matchedNota.tipoCambio) || 6.96);
                                }
                                let factorIncremento = 1;
                                if (matchedNota.costoImportacion) {
                                    const pct = Number(matchedNota.costoImportacion.porcentajeGastos) || 0;
                                    factorIncremento = 1 + (pct / 100);
                                }
                                const correctCosto = Number((unitPriceBob * factorIncremento).toFixed(2));
                                if (correctCosto > 0 && Number(mov.costoUnitario) !== correctCosto) {
                                    mov.costoUnitario = correctCosto;
                                    updated = true;
                                }
                            }
                        }
                    }
                }

                // If movement is a sale, ensure its costoUnitario is the purchase cost rather than the sale price
                if (mov.tipo === 'VENTA' || mov.tipo === 'ANULACION_VENTA') {
                    const prodCost = Number(mov.inventario?.precioCompra) || Number(mov.inventario?.producto?.precioCompra) || 0;
                    if (prodCost > 0 && Number(mov.costoUnitario) !== prodCost) {
                        mov.costoUnitario = prodCost;
                        updated = true;
                    }
                }

                if (updated) {
                    await this.repo.save(mov);
                }
            }
        } catch (error) {
            console.error('Error sincronizando notas históricas a movimientos:', error);
        }
    }

    async findAll() {
        return this.repo.createQueryBuilder('mov')
            .leftJoinAndSelect('mov.inventario', 'inventario')
            .leftJoinAndSelect('inventario.producto', 'producto')
            .leftJoinAndSelect('producto.categoria', 'categoria')
            .leftJoinAndSelect('producto.marca', 'marca')
            .leftJoinAndSelect('producto.grupo', 'grupo')
            .leftJoinAndSelect('inventario.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .leftJoinAndSelect('mov.usuario', 'usuario')
            .leftJoinAndSelect('usuario.persona', 'persona')
            .orderBy('mov.creadoEn', 'DESC')
            .addOrderBy('mov.id', 'DESC')
            .getMany();
    }

    findByInventario(inventarioId: number) {
        return this.repo.createQueryBuilder('mov')
            .leftJoinAndSelect('mov.inventario', 'inventario')
            .leftJoinAndSelect('inventario.producto', 'producto')
            .leftJoinAndSelect('producto.categoria', 'categoria')
            .leftJoinAndSelect('producto.marca', 'marca')
            .leftJoinAndSelect('producto.grupo', 'grupo')
            .leftJoinAndSelect('inventario.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .leftJoinAndSelect('mov.usuario', 'usuario')
            .leftJoinAndSelect('usuario.persona', 'persona')
            .where('inventario.id = :inventarioId', { inventarioId })
            .orderBy('mov.creadoEn', 'DESC')
            .addOrderBy('mov.id', 'DESC')
            .getMany();
    }

    create(data: Partial<MovimientoInventario>) {
        return this.repo.save(this.repo.create(data));
    }
}
