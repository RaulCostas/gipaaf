import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Nota, TipoNota, EstadoNota } from './nota.entity';
import { DetalleNota } from './detalle-nota.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Lote } from '../inventario/lote.entity';
import { MovimientoLote } from '../inventario/movimiento-lote.entity';
import { Producto } from '../productos/producto.entity';
import { MovimientoInventario } from '../movimientos-inventario/movimiento_inventario.entity';
import { PagoCobranza } from '../cobranzas/pago.entity';
import { PagoProveedor } from '../pagos-proveedores/pago-proveedor.entity';
import { Egreso } from '../egresos/egreso.entity';
import { Traspaso } from '../traspasos/traspaso.entity';

import { CostoImportacion } from './costo-importacion.entity';
import { Moneda } from './nota.entity';

@Injectable()
export class NotasService {
    constructor(
        @InjectRepository(Nota) private notaRepo: Repository<Nota>,
        @InjectRepository(DetalleNota) private detalleRepo: Repository<DetalleNota>,
        @InjectRepository(Inventario) private inventarioRepo: Repository<Inventario>,
        @InjectRepository(CostoImportacion) private costoImportacionRepo: Repository<CostoImportacion>,
        private dataSource: DataSource,
    ) { }

    async generarSiguienteNumero(manager: EntityManager, tipo: TipoNota): Promise<string> {
        const prefix = (tipo || 'NOT').substring(0, 3).toUpperCase();
        const todasNotas = await manager
            .createQueryBuilder(Nota, 'nota')
            .withDeleted()
            .where('nota.numero LIKE :prefix', { prefix: `${prefix}-%` })
            .select(['nota.numero'])
            .getMany();

        let maxNum = 0;
        for (const n of todasNotas) {
            if (n.numero) {
                const parts = n.numero.split('-');
                if (parts.length === 2) {
                    const parsed = parseInt(parts[1], 10);
                    if (!isNaN(parsed) && parsed > maxNum) {
                        maxNum = parsed;
                    }
                }
            }
        }

        let next = maxNum + 1;
        let candidate = `${prefix}-${String(next).padStart(6, '0')}`;
        while (await manager.findOne(Nota, { where: { numero: candidate }, withDeleted: true })) {
            next++;
            candidate = `${prefix}-${String(next).padStart(6, '0')}`;
        }

        return candidate;
    }

    async findAll(tipo?: TipoNota, vendedorId?: number) {
        const qb = this.notaRepo.createQueryBuilder('nota')
            .leftJoinAndSelect('nota.proveedor', 'proveedor')
            .leftJoinAndSelect('proveedor.persona', 'provPersona')
            .leftJoinAndSelect('nota.cliente', 'cliente')
            .leftJoinAndSelect('cliente.persona', 'cliPersona')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'sucursalCiudad')
            .leftJoinAndSelect('nota.vendedor', 'vendedor')
            .leftJoinAndSelect('nota.usuario', 'usuario')
            .leftJoinAndSelect('nota.detalles', 'detalles')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .leftJoinAndSelect('nota.costoImportacion', 'costoImportacion')
            .orderBy('nota.fecha', 'DESC')
            .addOrderBy('nota.id', 'DESC');

        if (tipo) {
            qb.andWhere('nota.tipo = :tipo', { tipo });
        }
        if (vendedorId) {
            qb.andWhere('vendedor.id = :vendedorId', { vendedorId });
        }

        return qb.getMany();
    }

    async findOne(id: number) {
        const nota = await this.notaRepo.createQueryBuilder('nota')
            .leftJoinAndSelect('nota.proveedor', 'proveedor')
            .leftJoinAndSelect('proveedor.persona', 'provPersona')
            .leftJoinAndSelect('nota.cliente', 'cliente')
            .leftJoinAndSelect('cliente.persona', 'cliPersona')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'sucursalCiudad')
            .leftJoinAndSelect('nota.vendedor', 'vendedor')
            .leftJoinAndSelect('nota.usuario', 'usuario')
            .leftJoinAndSelect('nota.detalles', 'detalles')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .leftJoinAndSelect('nota.costoImportacion', 'costoImportacion')
            .where('nota.id = :id', { id })
            .getOne();

        if (!nota) throw new NotFoundException(`Nota ${id} no encontrada`);
        return nota;
    }

    async create(data: Partial<Nota> & { detalles: Partial<DetalleNota>[] }) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                // Generate unique number
                const numero = await this.generarSiguienteNumero(manager, data.tipo || TipoNota.VENTA);

                                let subtotalGeneral = 0;
                const detallesConSubtotal = (data.detalles || []).map(det => {
                    const subtotal = Number(det.cantidad) * Number(det.precioUnitario);
                    subtotalGeneral += subtotal;
                    return { ...det, subtotal };
                });

                const descPorc1 = Number(data.descuentoPorcentaje || 0);
                const aplicaDescFijo = data.aplicaDescuentoFijo !== undefined ? Boolean(data.aplicaDescuentoFijo) : (Number(data.descuentoFijoPorcentaje || 0) > 0);
                const descPorcFijo = aplicaDescFijo ? (Number(data.descuentoFijoPorcentaje) || 3) : 0;
                const descPorc2 = Number(data.descuentoPromocionPorcentaje || 0);
                
                const descuento1 = (subtotalGeneral * descPorc1) / 100;
                const subtotalDespuesDesc1 = subtotalGeneral - descuento1;
                
                const descuentoFijo = (subtotalDespuesDesc1 * descPorcFijo) / 100;
                const subtotalDespuesDescFijo = subtotalDespuesDesc1 - descuentoFijo;
                
                const descuento2 = (subtotalDespuesDescFijo * descPorc2) / 100;
                
                const total = subtotalDespuesDescFijo - descuento2;

                let fechaVencimiento: Date | null = null;
                if (data.fechaVencimiento) {
                    fechaVencimiento = new Date(data.fechaVencimiento);
                } else if (data.diasCredito && Number(data.diasCredito) > 0) {
                    const baseDate = data.fecha ? new Date(data.fecha + 'T00:00:00') : new Date();
                    const d = new Date(baseDate);
                    d.setDate(d.getDate() + Number(data.diasCredito));
                    fechaVencimiento = d;
                }

                const nota = manager.create(Nota, { 
                    ...data, 
                    numero, 
                    estado: EstadoNota.PENDIENTE,
                    detalles: detallesConSubtotal,
                    subtotal: subtotalGeneral,
                    total: total,
                    saldo: data.saldo !== undefined ? data.saldo : total,
                    descuento: descuento1,
                    descuentoFijo: descuentoFijo,
                    descuentoFijoPorcentaje: descPorcFijo,
                    aplicaDescuentoFijo: aplicaDescFijo,
                    descuentoPromocion: descuento2,
                    descuentoPorcentaje: descPorc1,
                    descuentoPromocionPorcentaje: descPorc2,
                    diasCredito: Number(data.diasCredito || 0),
                    fechaVencimiento: fechaVencimiento as any,
                    tipoPago: data.tipoPago || 'CONTADO'
                });
                
                return await manager.save(nota);
            });
        } catch (error) {
            console.error('ERROR CREATING NOTA:', error);
            require('fs').writeFileSync('last_error.log', error.stack || error.message);
            throw error;
        }
    }

    async update(id: number, data: Partial<Nota> & { detalles?: Partial<DetalleNota>[] }) {
        return this.dataSource.transaction(async (manager) => {
            const nota = await manager.findOne(Nota, { 
                where: { id },
                relations: ['detalles', 'detalles.producto', 'sucursal', 'cliente', 'proveedor', 'usuario']
            });
            if (!nota) throw new NotFoundException(`Nota ${id} no encontrada`);
            if (nota.estado === EstadoNota.ANULADA) throw new BadRequestException('No se pueden editar notas anuladas');

            if (data.diasCredito !== undefined || data.fecha !== undefined) {
                const dias = data.diasCredito !== undefined ? Number(data.diasCredito) : Number(nota.diasCredito || 0);
                if (dias > 0) {
                    const baseDateStr = (data.fecha || nota.fecha) ? String(data.fecha || nota.fecha).split('T')[0] : '';
                    const baseDate = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : new Date();
                    const d = new Date(baseDate);
                    d.setDate(d.getDate() + dias);
                    data.fechaVencimiento = d as any;
                } else {
                    data.fechaVencimiento = null as any;
                }
            }

            let targetSucursal: Sucursal | null = null;
            if (data.sucursal?.id) {
                targetSucursal = await manager.findOne(Sucursal, { where: { id: Number(data.sucursal.id) } });
            } else if (nota.sucursal) {
                targetSucursal = nota.sucursal;
            } else {
                targetSucursal = await manager.findOne(Sucursal, { where: { activo: true } });
            }

            if (nota.estado === EstadoNota.CONFIRMADA) {
                if (!data.detalles) {
                    // Si no se envían detalles, solo actualizar datos administrativos
                    const { detalles, total, subtotal, saldo, descuento, descuentoPromocion, ...adminData } = data;
                    Object.assign(nota, adminData);
                    return manager.save(nota);
                }

                // Si se envían detalles en una nota CONFIRMADA:
                // 1. Validar pagos/cobros ya registrados para no quedar con saldo inconsistente
                const totalAnterior = Number(nota.total) || 0;
                const saldoAnterior = Number(nota.saldo) !== undefined ? Number(nota.saldo) : totalAnterior;
                const montoPagadoOCobrado = Math.max(0, totalAnterior - saldoAnterior);

                // 2. Revertir impacto de inventario y lotes anteriores
                if (nota.tipo === TipoNota.COMPRA) {
                    const oldLotes = await manager.find(Lote, {
                        where: { notaIngreso: { id: nota.id } },
                        relations: ['producto', 'sucursal']
                    });

                    for (const lote of oldLotes) {
                        const cantUsada = Number(lote.cantidadInicial) - Number(lote.cantidadActual);
                        if (cantUsada > 0) {
                            throw new BadRequestException(
                                `No se pueden modificar los productos de esta compra porque ya se vendieron o utilizaron ${cantUsada} unidades del producto "${lote.producto?.nombre}" (Lote: ${lote.numeroLote}).`
                            );
                        }
                    }

                    for (const lote of oldLotes) {
                        const sucId = lote.sucursal?.id || targetSucursal?.id;
                        if (sucId) {
                            const inv = await manager.findOne(Inventario, {
                                where: { producto: { id: lote.producto.id }, sucursal: { id: sucId } }
                            });
                            if (inv) {
                                inv.stockActual = Math.max(0, Number(inv.stockActual) - Number(lote.cantidadActual));
                                await manager.save(inv);
                            }
                        }
                        await manager.remove(Lote, lote);
                    }
                } else if (nota.tipo === TipoNota.VENTA) {
                    for (const det of nota.detalles) {
                        const sucId = targetSucursal?.id;
                        if (sucId) {
                            const inv = await manager.findOne(Inventario, {
                                where: { producto: { id: det.producto.id }, sucursal: { id: sucId } }
                            });
                            if (inv) {
                                inv.stockActual = Number(inv.stockActual) + Number(det.cantidad);
                                await manager.save(inv);
                            }
                        }

                        const movimientos = await manager.find(MovimientoLote, {
                            where: { detalleNota: { id: det.id } },
                            relations: ['lote']
                        });

                        for (const mov of movimientos) {
                            if (mov.lote) {
                                mov.lote.cantidadActual = Number(mov.lote.cantidadActual) + Number(mov.cantidad);
                                await manager.save(mov.lote);
                            }
                            await manager.remove(MovimientoLote, mov);
                        }
                    }
                }

                // 3. Eliminar detalles anteriores
                await manager.delete(DetalleNota, { nota: { id } });

                // 4. Calcular nuevos subtotales y crear nuevos detalles
                let subtotalGeneral = 0;
                const detallesParaCrear: any[] = [];
                for (const det of data.detalles) {
                    const prodId = (det.producto as any)?.id || (det as any).productoId;
                    const prod = await manager.findOne(Producto, { where: { id: prodId } });
                    if (!prod) throw new NotFoundException(`Producto ID ${prodId} no encontrado`);
                    
                    const subtotal = Number(det.cantidad) * Number(det.precioUnitario);
                    subtotalGeneral += subtotal;

                    const nuevoDet = manager.create(DetalleNota, {
                        ...det,
                        producto: prod,
                        subtotal
                    });
                    detallesParaCrear.push(nuevoDet);
                }

                const descPorc1 = Number(data.descuentoPorcentaje !== undefined ? data.descuentoPorcentaje : (nota.descuentoPorcentaje || 0));
                const aplicaDescFijo = data.aplicaDescuentoFijo !== undefined ? Boolean(data.aplicaDescuentoFijo) : (data.descuentoFijoPorcentaje !== undefined ? Number(data.descuentoFijoPorcentaje) > 0 : Boolean(nota.aplicaDescuentoFijo));
                const descPorcFijo = aplicaDescFijo ? (data.descuentoFijoPorcentaje !== undefined ? Number(data.descuentoFijoPorcentaje) : (Number(nota.descuentoFijoPorcentaje) || 3)) : 0;
                const descPorc2 = Number(data.descuentoPromocionPorcentaje !== undefined ? data.descuentoPromocionPorcentaje : (nota.descuentoPromocionPorcentaje || 0));
                
                const descuento1 = (subtotalGeneral * descPorc1) / 100;
                const subtotalDespuesDesc1 = subtotalGeneral - descuento1;
                
                const descuentoFijo = (subtotalDespuesDesc1 * descPorcFijo) / 100;
                const subtotalDespuesDescFijo = subtotalDespuesDesc1 - descuentoFijo;
                
                const descuento2 = (subtotalDespuesDescFijo * descPorc2) / 100;
                const nuevoTotal = subtotalDespuesDescFijo - descuento2;

                if (montoPagadoOCobrado > 0 && nuevoTotal < montoPagadoOCobrado) {
                    throw new BadRequestException(
                        `El nuevo total (Bs. ${nuevoTotal.toFixed(2)}) no puede ser menor a los pagos/cobros ya registrados (Bs. ${montoPagadoOCobrado.toFixed(2)}).`
                    );
                }

                const nuevoSaldo = Math.max(0, nuevoTotal - montoPagadoOCobrado);

                // Guardar los nuevos detalles vinculados a la nota
                const savedDetalles: DetalleNota[] = [];
                for (const d of detallesParaCrear) {
                    d.nota = nota;
                    savedDetalles.push(await manager.save(d));
                }

                // 5. Aplicar nuevo impacto de inventario para la nota confirmada
                if (nota.tipo === TipoNota.COMPRA) {
                    const costoImp = await manager.findOne(CostoImportacion, { where: { notaId: nota.id } });
                    let factorIncremento = 1;

                    if (costoImp) {
                        const tipoCambio = Number(data.tipoCambio) || Number(costoImp.tipoCambio) || Number(nota.tipoCambio) || 6.96;
                        let nuevoFobUsd = 0;
                        let nuevoFobBob = 0;
                        const moneda = data.moneda || nota.moneda;
                        if (moneda === Moneda.USD) {
                            nuevoFobUsd = nuevoTotal;
                            nuevoFobBob = Number((nuevoTotal * tipoCambio).toFixed(2));
                        } else {
                            nuevoFobBob = nuevoTotal;
                            nuevoFobUsd = Number((nuevoTotal / tipoCambio).toFixed(2));
                        }
                        const totalGastosBob = Number(costoImp.totalGastosBob) || 0;
                        const porcentajeGastos = nuevoFobBob > 0 ? (totalGastosBob * 100) / nuevoFobBob : 0;
                        const costoTotalBob = nuevoFobBob + totalGastosBob;

                        costoImp.costoFobUsd = nuevoFobUsd;
                        costoImp.costoFobBob = nuevoFobBob;
                        costoImp.porcentajeGastos = porcentajeGastos;
                        costoImp.costoTotalBob = costoTotalBob;
                        costoImp.tipoCambio = tipoCambio;
                        await manager.save(costoImp);

                        factorIncremento = 1 + (porcentajeGastos / 100);
                    }

                    for (const det of savedDetalles) {
                        let inv: Inventario | null = null;
                        if (targetSucursal) {
                            inv = await manager.findOne(Inventario, { 
                                where: { producto: { id: det.producto.id }, sucursal: { id: targetSucursal.id } } 
                            });
                        }

                        let precioUnitarioBob = Number(det.precioUnitario) || 0;
                        if ((data.moneda || nota.moneda) === Moneda.USD) {
                            const tc = Number(data.tipoCambio) || Number(nota.tipoCambio) || 6.96;
                            precioUnitarioBob = precioUnitarioBob * tc;
                        }
                        const costoUnitarioFinal = Number((precioUnitarioBob * factorIncremento).toFixed(2));

                        const nuevoLote = manager.create(Lote, {
                            numeroLote: det.numeroLote || `L-${nota.numero}-${det.id}`,
                            producto: det.producto,
                            sucursal: targetSucursal || inv?.sucursal || undefined,
                            cantidadInicial: det.cantidad,
                            cantidadActual: det.cantidad,
                            costoUnitario: costoUnitarioFinal,
                            fechaIngreso: new Date(),
                            fechaVencimiento: det.fechaVencimiento,
                            notaIngreso: nota
                        });
                        await manager.save(nuevoLote);

                        if (inv) {
                            inv.stockActual = Number(inv.stockActual) + Number(det.cantidad);
                            inv.precioCompra = costoUnitarioFinal;
                            await manager.save(inv);
                        } else if (targetSucursal) {
                            const nuevoInv = manager.create(Inventario, {
                                producto: det.producto,
                                sucursal: targetSucursal,
                                stockActual: Number(det.cantidad),
                                stockMinimo: 0,
                                stockMaximo: 0,
                                precioCompra: costoUnitarioFinal,
                                precioVenta: Number(det.producto?.precioVenta) || 0
                            });
                            await manager.save(nuevoInv);
                        }

                        if (det.producto?.id) {
                            await manager.update(Producto, det.producto.id, {
                                precioCompra: costoUnitarioFinal,
                                fechaUltimaCompra: data.fecha || nota.fecha || new Date()
                            });
                        }
                    }
                } else if (nota.tipo === TipoNota.VENTA) {
                    for (const det of savedDetalles) {
                        let inv: Inventario | null = null;
                        if (targetSucursal) {
                            inv = await manager.findOne(Inventario, { 
                                where: { producto: { id: det.producto.id }, sucursal: { id: targetSucursal.id } } 
                            });
                        }

                        if (inv && Number(inv.stockActual) < Number(det.cantidad)) {
                            throw new BadRequestException(`Stock insuficiente para ${det.producto.nombre} en la sucursal seleccionada`);
                        }

                        const lotesWhere: any = { producto: { id: det.producto.id } };
                        if (targetSucursal) lotesWhere.sucursal = { id: targetSucursal.id };

                        const lotes = await manager.find(Lote, {
                            where: lotesWhere,
                            order: { 
                                fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                                fechaIngreso: 'ASC' 
                            }
                        });

                        let cantidadPorDescontar = Number(det.cantidad);
                        for (const lote of lotes) {
                            if (cantidadPorDescontar <= 0) break;
                            const cantDisponible = Number(lote.cantidadActual);
                            if (cantDisponible > 0) {
                                const cantidadADescontar = Math.min(cantDisponible, cantidadPorDescontar);
                                lote.cantidadActual = cantDisponible - cantidadADescontar;
                                await manager.save(lote);

                                const movLote = manager.create(MovimientoLote, {
                                    lote: lote,
                                    detalleNota: det,
                                    cantidad: cantidadADescontar
                                });
                                await manager.save(movLote);

                                cantidadPorDescontar -= cantidadADescontar;
                            }
                        }

                        if (cantidadPorDescontar > 0) {
                            throw new BadRequestException(`No hay suficientes lotes con stock para ${det.producto.nombre}`);
                        }

                        if (inv) {
                            inv.stockActual = Number(inv.stockActual) - Number(det.cantidad);
                            await manager.save(inv);
                        }
                    }
                }

                data.detalles = savedDetalles as any;
                data.subtotal = subtotalGeneral;
                data.total = nuevoTotal;
                data.saldo = nuevoSaldo;
                data.descuento = descuento1;
                data.descuentoFijo = descuentoFijo;
                data.descuentoFijoPorcentaje = descPorcFijo;
                data.aplicaDescuentoFijo = aplicaDescFijo;
                data.descuentoPromocion = descuento2;
                data.descuentoPorcentaje = descPorc1;
                data.descuentoPromocionPorcentaje = descPorc2;

                Object.assign(nota, data);
                return manager.save(nota);
            }

            // Para notas PENDIENTES:
            if (data.detalles) {
                await manager.delete(DetalleNota, { nota: { id } });

                let subtotalGeneral = 0;
                const detallesConSubtotal = data.detalles.map(det => {
                    const subtotal = Number(det.cantidad) * Number(det.precioUnitario);
                    subtotalGeneral += subtotal;
                    return manager.create(DetalleNota, { ...det, subtotal });
                });

                const descPorc1 = Number(data.descuentoPorcentaje !== undefined ? data.descuentoPorcentaje : (nota.descuentoPorcentaje || 0));
                const aplicaDescFijo = data.aplicaDescuentoFijo !== undefined ? Boolean(data.aplicaDescuentoFijo) : (data.descuentoFijoPorcentaje !== undefined ? Number(data.descuentoFijoPorcentaje) > 0 : Boolean(nota.aplicaDescuentoFijo));
                const descPorcFijo = aplicaDescFijo ? (data.descuentoFijoPorcentaje !== undefined ? Number(data.descuentoFijoPorcentaje) : (Number(nota.descuentoFijoPorcentaje) || 3)) : 0;
                const descPorc2 = Number(data.descuentoPromocionPorcentaje !== undefined ? data.descuentoPromocionPorcentaje : (nota.descuentoPromocionPorcentaje || 0));
                
                const descuento1 = (subtotalGeneral * descPorc1) / 100;
                const subtotalDespuesDesc1 = subtotalGeneral - descuento1;
                
                const descuentoFijo = (subtotalDespuesDesc1 * descPorcFijo) / 100;
                const subtotalDespuesDescFijo = subtotalDespuesDesc1 - descuentoFijo;
                
                const descuento2 = (subtotalDespuesDescFijo * descPorc2) / 100;
                
                const total = subtotalDespuesDescFijo - descuento2;

                data.detalles = detallesConSubtotal as any;
                data.subtotal = subtotalGeneral;
                data.total = total;
                data.saldo = total;
                data.descuento = descuento1;
                data.descuentoFijo = descuentoFijo;
                data.descuentoFijoPorcentaje = descPorcFijo;
                data.aplicaDescuentoFijo = aplicaDescFijo;
                data.descuentoPromocion = descuento2;
                data.descuentoPorcentaje = descPorc1;
                data.descuentoPromocionPorcentaje = descPorc2;
            }

            Object.assign(nota, data);
            return manager.save(nota);
        });
    }

    async confirmar(id: number) {
        return this.dataSource.transaction(async (manager) => {
            const nota = await manager.findOne(Nota, { 
                where: { id }, 
                relations: ['detalles', 'detalles.producto', 'sucursal', 'cliente', 'proveedor', 'usuario'] 
            });
            if (!nota) throw new NotFoundException(`Nota ${id} no encontrada`);
            if (nota.estado !== EstadoNota.PENDIENTE) throw new BadRequestException('Solo se puede confirmar una nota pendiente');

            // Determinar la sucursal de la nota
            let targetSucursal: Sucursal | null = nota.sucursal || null;
            if (!targetSucursal) {
                targetSucursal = await manager.findOne(Sucursal, { where: { activo: true } });
            }

            for (const det of nota.detalles) {
                // Buscar el registro de inventario específico para este producto y sucursal
                let inv: Inventario | null = null;
                if (targetSucursal) {
                    inv = await manager.findOne(Inventario, { 
                        where: { 
                            producto: { id: det.producto.id }, 
                            sucursal: { id: targetSucursal.id } 
                        } 
                    });
                } else {
                    inv = await manager.findOne(Inventario, { where: { producto: { id: det.producto.id } } });
                }
                
                if (nota.tipo === TipoNota.COMPRA) {
                    const nuevoLote = manager.create(Lote, {
                        numeroLote: det.numeroLote || `L-${nota.numero}-${det.id}`,
                        producto: det.producto,
                        sucursal: targetSucursal || inv?.sucursal || undefined,
                        cantidadInicial: det.cantidad,
                        cantidadActual: det.cantidad,
                        costoUnitario: det.precioUnitario,
                        fechaIngreso: new Date(),
                        fechaVencimiento: det.fechaVencimiento,
                        notaIngreso: nota
                    });
                    await manager.save(nuevoLote);

                    let finalInv = inv;
                    if (inv) {
                        inv.stockActual = Number(inv.stockActual) + Number(det.cantidad);
                        if (det.precioUnitario) {
                            inv.precioCompra = Number(det.precioUnitario);
                        }
                        finalInv = await manager.save(inv);
                    } else if (targetSucursal) {
                        const nuevoInv = manager.create(Inventario, {
                            producto: det.producto,
                            sucursal: targetSucursal,
                            stockActual: Number(det.cantidad),
                            stockMinimo: 0,
                            stockMaximo: 0,
                            precioCompra: Number(det.precioUnitario) || 0,
                            precioVenta: Number(det.producto?.precioVenta) || 0
                        });
                        finalInv = await manager.save(nuevoInv);
                    }

                    // Registrar en Kardex / Movimientos
                    if (finalInv) {
                        const provPersona = nota.proveedor?.persona;
                        const provName = nota.proveedor?.empresa || (provPersona ? `${provPersona.nombres || ''} ${provPersona.apellidos || ''}`.trim() : '');
                        const motivo = `Compra [${nota.numero}]${provName ? ' - ' + provName : ''}`;
                        const mov = manager.create(MovimientoInventario, {
                            inventario: finalInv,
                            tipo: 'COMPRA',
                            cantidad: Number(det.cantidad),
                            motivo: motivo.trim(),
                            numeroDocumento: nota.numero,
                            observaciones: nota.observaciones || '',
                            costoUnitario: Number(det.precioUnitario) || Number(det.producto?.precioCompra) || 0,
                            usuario: nota.usuario || undefined,
                        });
                        await manager.save(mov);
                    }

                    if (det.precioUnitario && det.producto?.id) {
                        await manager.update(Producto, det.producto.id, {
                            precioCompra: Number(det.precioUnitario),
                            fechaUltimaCompra: nota.fecha || new Date()
                        });
                    }
                } else if (nota.tipo === TipoNota.VENTA) {
                    if (inv && Number(inv.stockActual) < Number(det.cantidad)) {
                        throw new BadRequestException(`Stock insuficiente para ${det.producto.nombre} en la sucursal seleccionada`);
                    }
                    
                    const lotesWhere: any = { producto: { id: det.producto.id } };
                    if (targetSucursal) {
                        lotesWhere.sucursal = { id: targetSucursal.id };
                    }

                    const lotes = await manager.find(Lote, {
                        where: lotesWhere,
                        order: { 
                            fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                            fechaIngreso: 'ASC' 
                        }
                    });
                    
                    let cantidadPorDescontar = Number(det.cantidad);
                    for (const lote of lotes) {
                        if (cantidadPorDescontar <= 0) break;
                        const cantDisponible = Number(lote.cantidadActual);
                        if (cantDisponible > 0) {
                            const cantidadADescontar = Math.min(cantDisponible, cantidadPorDescontar);
                            lote.cantidadActual = cantDisponible - cantidadADescontar;
                            await manager.save(lote);
                            
                            const movLote = manager.create(MovimientoLote, {
                                lote: lote,
                                detalleNota: det,
                                cantidad: cantidadADescontar
                            });
                            await manager.save(movLote);
                            
                            cantidadPorDescontar -= cantidadADescontar;
                        }
                    }
                    
                    if (cantidadPorDescontar > 0) {
                        throw new BadRequestException(`No hay suficientes lotes con stock para ${det.producto.nombre} en la sucursal seleccionada. Stock en lotes: ${Number(det.cantidad) - cantidadPorDescontar}`);
                    }

                    if (inv) {
                        inv.stockActual = Number(inv.stockActual) - Number(det.cantidad);
                        await manager.save(inv);

                        // Registrar en Kardex / Movimientos
                        const cliPersona = nota.cliente?.persona;
                        const cliName = cliPersona ? `${cliPersona.nombres || ''} ${cliPersona.apellidos || ''}`.trim() : '';
                        const motivo = `Venta [${nota.numero}]${cliName ? ' - ' + cliName : ''}`;
                        const mov = manager.create(MovimientoInventario, {
                            inventario: inv,
                            tipo: 'VENTA',
                            cantidad: -Number(det.cantidad),
                            motivo: motivo.trim(),
                            numeroDocumento: nota.numero,
                            observaciones: nota.observaciones || '',
                            costoUnitario: Number(det.precioUnitario) || Number(det.producto?.precioCompra) || 0,
                            usuario: nota.usuario || undefined,
                        });
                        await manager.save(mov);
                    }
                } else if (nota.tipo === TipoNota.DEVOLUCION) {
                    const isSalidaReposicion = det.tipoMovimiento === 'SALIDA_REPOSICION';
                    
                    if (isSalidaReposicion) {
                        // EGRESO: Producto entregado de reposición / cambio al cliente
                        if (!inv || Number(inv.stockActual) < Number(det.cantidad)) {
                            throw new BadRequestException(`No hay suficiente stock en inventario para el producto de reposición ${det.producto.nombre}. Stock actual: ${inv ? inv.stockActual : 0}`);
                        }

                        // Consumir lotes
                        const lotes = await manager.find(Lote, {
                            where: {
                                producto: { id: det.producto.id },
                                sucursal: { id: targetSucursal?.id }
                            },
                            order: {
                                fechaVencimiento: 'ASC',
                                fechaIngreso: 'ASC'
                            }
                        });

                        let cantidadPorDescontar = Number(det.cantidad);
                        for (const lote of lotes) {
                            if (cantidadPorDescontar <= 0) break;
                            const cantDisponible = Number(lote.cantidadActual);
                            if (cantDisponible > 0) {
                                const cantidadADescontar = Math.min(cantDisponible, cantidadPorDescontar);
                                lote.cantidadActual = cantDisponible - cantidadADescontar;
                                await manager.save(lote);

                                const movLote = manager.create(MovimientoLote, {
                                    lote: lote,
                                    detalleNota: det,
                                    cantidad: cantidadADescontar
                                });
                                await manager.save(movLote);

                                cantidadPorDescontar -= cantidadADescontar;
                            }
                        }

                        inv.stockActual = Number(inv.stockActual) - Number(det.cantidad);
                        await manager.save(inv);

                        // Registrar en Kardex salida por reposición
                        const mov = manager.create(MovimientoInventario, {
                            inventario: inv,
                            tipo: 'SALIDA_REPOSICION',
                            cantidad: -Number(det.cantidad),
                            motivo: `Reposición / Cambio por Devolución [${nota.numero}]`.trim(),
                            numeroDocumento: nota.numero,
                            observaciones: nota.observaciones || '',
                            costoUnitario: Number(det.precioUnitario) || Number(det.producto?.precioCompra) || 0,
                            usuario: nota.usuario || undefined,
                        });
                        await manager.save(mov);
                    } else {
                        // INGRESO: Producto devuelto por el cliente
                        let finalInv = inv;
                        const destino = det.destinoProducto || 'REINGRESO_STOCK';

                        if (destino === 'REINGRESO_STOCK') {
                            if (inv) {
                                inv.stockActual = Number(inv.stockActual) + Number(det.cantidad);
                                finalInv = await manager.save(inv);
                            } else if (targetSucursal) {
                                const nuevoInv = manager.create(Inventario, {
                                    producto: det.producto,
                                    sucursal: targetSucursal,
                                    stockActual: Number(det.cantidad),
                                    stockMinimo: 0,
                                    stockMaximo: 0,
                                    precioCompra: Number(det.precioUnitario) || 0,
                                    precioVenta: Number(det.producto?.precioVenta) || 0
                                });
                                finalInv = await manager.save(nuevoInv);
                            }

                            const returnLote = manager.create(Lote, {
                                numeroLote: det.numeroLote || `DEV-${nota.numero}-${det.id}`,
                                producto: det.producto,
                                sucursal: targetSucursal || inv?.sucursal || undefined,
                                cantidadInicial: det.cantidad,
                                cantidadActual: det.cantidad,
                                costoUnitario: det.precioUnitario,
                                fechaIngreso: new Date(),
                                fechaVencimiento: det.fechaVencimiento,
                                notaIngreso: nota
                            });
                            await manager.save(returnLote);

                            if (finalInv) {
                                const mov = manager.create(MovimientoInventario, {
                                    inventario: finalInv,
                                    tipo: 'DEVOLUCION',
                                    cantidad: Number(det.cantidad),
                                    motivo: `Devolución de Cliente [${nota.numero}] - Reingreso a Stock`.trim(),
                                    numeroDocumento: nota.numero,
                                    observaciones: det.motivoDefecto ? `Defecto: ${det.motivoDefecto}. ${nota.observaciones || ''}`.trim() : (nota.observaciones || ''),
                                    costoUnitario: Number(det.precioUnitario) || Number(det.producto?.precioCompra) || 0,
                                    usuario: nota.usuario || undefined,
                                });
                                await manager.save(mov);
                            }
                        } else if (destino === 'DESCARTE_MERMA') {
                            // Descarte / Merma: trazabilidad en Kardex sin sumar a inventario vendible
                            if (!finalInv && targetSucursal) {
                                finalInv = await manager.findOne(Inventario, {
                                    where: { producto: { id: det.producto.id }, sucursal: { id: targetSucursal.id } }
                                });
                            }
                            if (finalInv) {
                                const mov = manager.create(MovimientoInventario, {
                                    inventario: finalInv,
                                    tipo: 'MERMA_DESCARTE',
                                    cantidad: Number(det.cantidad),
                                    motivo: `Devolución [${nota.numero}] - Descarte/Merma (Defecto: ${det.motivoDefecto || 'Dañado'})`.trim(),
                                    numeroDocumento: nota.numero,
                                    observaciones: `Producto devuelto no apto para venta. ${nota.observaciones || ''}`.trim(),
                                    costoUnitario: Number(det.precioUnitario) || Number(det.producto?.precioCompra) || 0,
                                    usuario: nota.usuario || undefined,
                                });
                                await manager.save(mov);
                            }
                        } else if (destino === 'RECLAMO_PROVEEDOR') {
                            // Reclamo a Proveedor: trazabilidad en Kardex sin sumar a inventario vendible
                            if (!finalInv && targetSucursal) {
                                finalInv = await manager.findOne(Inventario, {
                                    where: { producto: { id: det.producto.id }, sucursal: { id: targetSucursal.id } }
                                });
                            }
                            if (finalInv) {
                                const mov = manager.create(MovimientoInventario, {
                                    inventario: finalInv,
                                    tipo: 'RECLAMO_PROVEEDOR',
                                    cantidad: Number(det.cantidad),
                                    motivo: `Devolución [${nota.numero}] - Custodia para Reclamo a Proveedor (Defecto: ${det.motivoDefecto || 'Dañado'})`.trim(),
                                    numeroDocumento: nota.numero,
                                    observaciones: `Producto devuelto en custodia para garantía con proveedor. ${nota.observaciones || ''}`.trim(),
                                    costoUnitario: Number(det.precioUnitario) || Number(det.producto?.precioCompra) || 0,
                                    usuario: nota.usuario || undefined,
                                });
                                await manager.save(mov);
                            }
                        }
                    }
                }
            }

            nota.estado = EstadoNota.CONFIRMADA;
            return manager.save(nota);
        });
    }

    async anular(id: number) {
        return this.dataSource.transaction(async (manager) => {
            const nota = await manager.findOne(Nota, { 
                where: { id },
                relations: ['detalles', 'detalles.producto', 'sucursal', 'cliente', 'proveedor', 'usuario']
            });
            if (!nota) throw new NotFoundException(`Nota ${id} no encontrada`);
            if (nota.estado === EstadoNota.ANULADA) throw new BadRequestException('La nota ya está anulada');

            // Validar que no tenga pagos/cobros activos vinculados
            if (nota.tipo === TipoNota.VENTA) {
                const cobroActivo = await manager.findOne(PagoCobranza, {
                    where: { nota: { id: nota.id }, activo: true }
                });
                if (cobroActivo) {
                    throw new BadRequestException(
                        `No se puede anular la venta "${nota.numero}" porque tiene cobros/pagos registrados en el módulo de Cobranzas. Debe anular primero dichos cobros antes de anular la venta.`
                    );
                }
            } else if (nota.tipo === TipoNota.COMPRA) {
                const pagoActivo = await manager.findOne(PagoProveedor, {
                    where: { nota: { id: nota.id }, activo: true }
                });
                if (pagoActivo) {
                    throw new BadRequestException(
                        `No se puede anular la compra "${nota.numero}" porque tiene pagos registrados en el módulo de Pagos a Proveedores. Debe anular primero dichos pagos antes de anular la compra.`
                    );
                }
            }

            // Si la nota ya estaba confirmada, revertir stock y lotes
            if (nota.estado === EstadoNota.CONFIRMADA) {
                let targetSucursal: Sucursal | null = nota.sucursal || null;
                if (!targetSucursal) {
                    targetSucursal = await manager.findOne(Sucursal, { where: { activo: true } });
                }

                if (nota.tipo === TipoNota.COMPRA) {
                    // Buscar los lotes creados por esta compra
                    const lotes = await manager.find(Lote, {
                        where: { notaIngreso: { id: nota.id } },
                        relations: ['producto', 'sucursal']
                    });

                    // Validar si algún lote ya fue utilizado/vendido
                    for (const lote of lotes) {
                        const cantUsada = Number(lote.cantidadInicial) - Number(lote.cantidadActual);
                        if (cantUsada > 0) {
                            throw new BadRequestException(
                                `No se puede anular la compra porque ya se vendieron o utilizaron ${cantUsada} unidades del producto "${lote.producto?.nombre}" (Lote: ${lote.numeroLote}).`
                            );
                        }
                    }

                    // Revertir inventario y eliminar los lotes
                    for (const lote of lotes) {
                        const sucId = lote.sucursal?.id || targetSucursal?.id;
                        if (sucId) {
                            const inv = await manager.findOne(Inventario, {
                                where: { producto: { id: lote.producto.id }, sucursal: { id: sucId } }
                            });
                            if (inv) {
                                inv.stockActual = Math.max(0, Number(inv.stockActual) - Number(lote.cantidadActual));
                                await manager.save(inv);

                                // Registrar anulación en Kardex
                                const mov = manager.create(MovimientoInventario, {
                                    inventario: inv,
                                    tipo: 'ANULACION_COMPRA',
                                    cantidad: -Number(lote.cantidadActual),
                                    motivo: `Anulación Compra [${nota.numero}]`,
                                    numeroDocumento: nota.numero,
                                    observaciones: `Anulación de compra. ${nota.observaciones || ''}`.trim(),
                                    costoUnitario: Number(lote.costoUnitario) || Number(lote.producto?.precioCompra) || 0,
                                    usuario: nota.usuario || undefined,
                                });
                                await manager.save(mov);
                            }
                        }
                        await manager.remove(Lote, lote);
                    }
                } else if (nota.tipo === TipoNota.VENTA) {
                    // Para ventas confirmadas, restaurar el stock a los lotes e inventario
                    for (const det of nota.detalles) {
                        const sucId = targetSucursal?.id;
                        if (sucId) {
                            const inv = await manager.findOne(Inventario, {
                                where: { producto: { id: det.producto.id }, sucursal: { id: sucId } }
                            });
                            if (inv) {
                                inv.stockActual = Number(inv.stockActual) + Number(det.cantidad);
                                await manager.save(inv);

                                // Registrar anulación en Kardex
                                const mov = manager.create(MovimientoInventario, {
                                    inventario: inv,
                                    tipo: 'ANULACION_VENTA',
                                    cantidad: Number(det.cantidad),
                                    motivo: `Anulación Venta [${nota.numero}]`,
                                    numeroDocumento: nota.numero,
                                    observaciones: `Anulación de venta. ${nota.observaciones || ''}`.trim(),
                                    costoUnitario: Number(det.precioUnitario) || Number(det.producto?.precioCompra) || 0,
                                    usuario: nota.usuario || undefined,
                                });
                                await manager.save(mov);
                            }
                        }

                        // Restaurar los movimientos de lotes
                        const movimientos = await manager.find(MovimientoLote, {
                            where: { detalleNota: { id: det.id } },
                            relations: ['lote']
                        });

                        for (const mov of movimientos) {
                            if (mov.lote) {
                                mov.lote.cantidadActual = Number(mov.lote.cantidadActual) + Number(mov.cantidad);
                                await manager.save(mov.lote);
                            }
                            await manager.remove(MovimientoLote, mov);
                        }
                    }
                } else if (nota.tipo === TipoNota.DEVOLUCION) {
                    for (const det of nota.detalles) {
                        const sucId = targetSucursal?.id;
                        if (!sucId) continue;
                        const inv = await manager.findOne(Inventario, {
                            where: { producto: { id: det.producto.id }, sucursal: { id: sucId } }
                        });

                        if (det.tipoMovimiento === 'SALIDA_REPOSICION') {
                            // Revertir salida de reposición sumando al stock
                            if (inv) {
                                inv.stockActual = Number(inv.stockActual) + Number(det.cantidad);
                                await manager.save(inv);
                            }
                            // Restaurar lotes
                            const movimientos = await manager.find(MovimientoLote, {
                                where: { detalleNota: { id: det.id } },
                                relations: ['lote']
                            });
                            for (const mov of movimientos) {
                                if (mov.lote) {
                                    mov.lote.cantidadActual = Number(mov.lote.cantidadActual) + Number(mov.cantidad);
                                    await manager.save(mov.lote);
                                }
                                await manager.remove(MovimientoLote, mov);
                            }
                        } else {
                            // Revertir entrada por devolución si reingresó a stock
                            if (!det.destinoProducto || det.destinoProducto === 'REINGRESO_STOCK') {
                                if (inv) {
                                    inv.stockActual = Math.max(0, Number(inv.stockActual) - Number(det.cantidad));
                                    await manager.save(inv);
                                }
                            }
                        }
                    }
                    const returnLotes = await manager.find(Lote, {
                        where: { notaIngreso: { id: nota.id } }
                    });
                    for (const rLote of returnLotes) {
                        await manager.remove(Lote, rLote);
                    }
                }
            }

            nota.estado = EstadoNota.ANULADA;
            return manager.save(nota);
        });
    }

    async convertirVenta(id: number) {
        return this.dataSource.transaction(async (manager) => {
            const proforma = await manager.findOne(Nota, { 
                where: { id },
                relations: ['detalles', 'detalles.producto', 'sucursal', 'cliente', 'vendedor', 'usuario']
            });
            if (!proforma) throw new NotFoundException(`Nota ${id} no encontrada`);
            if (proforma.tipo !== TipoNota.PROFORMA) throw new BadRequestException('Solo se pueden convertir proformas');
            if (proforma.estado !== EstadoNota.CONFIRMADA) throw new BadRequestException('Solo se pueden convertir a venta las proformas que hayan sido confirmadas previamente');
            
            // Generar nuevo número de venta correlativo y seguro
            const numeroVenta = await this.generarSiguienteNumero(manager, TipoNota.VENTA);
            
            // Crear nueva Nota de tipo VENTA con la fecha actual
            const nuevaVenta = manager.create(Nota, {
                numero: numeroVenta,
                tipo: TipoNota.VENTA,
                estado: EstadoNota.PENDIENTE,
                fecha: new Date(),
                cliente: proforma.cliente || undefined,
                sucursal: proforma.sucursal || undefined,
                vendedor: proforma.vendedor || undefined,
                usuario: proforma.usuario || undefined,
                moneda: proforma.moneda || Moneda.BOB,
                tipoCambio: proforma.tipoCambio || 1,
                conFactura: proforma.conFactura || false,
                tipoPago: proforma.tipoPago || 'CONTADO',
                diasCredito: proforma.diasCredito || 0,
                fechaVencimiento: proforma.fechaVencimiento || undefined,
                subtotal: proforma.subtotal,
                descuento: proforma.descuento,
                descuentoPorcentaje: proforma.descuentoPorcentaje,
                descuentoPromocion: proforma.descuentoPromocion,
                descuentoPromocionPorcentaje: proforma.descuentoPromocionPorcentaje,
                impuesto: proforma.impuesto,
                total: proforma.total,
                saldo: proforma.saldo !== undefined ? proforma.saldo : proforma.total,
                observaciones: proforma.observaciones 
                    ? `${proforma.observaciones} (Generada desde Proforma ${proforma.numero})` 
                    : `Generada desde Proforma ${proforma.numero}`,
                detalles: (proforma.detalles || []).map(d => manager.create(DetalleNota, {
                    producto: d.producto,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario,
                    subtotal: d.subtotal,
                    numeroLote: d.numeroLote || undefined,
                    fechaVencimiento: d.fechaVencimiento || undefined,
                }))
            });

            const savedVenta = await manager.save(nuevaVenta);

            // Actualizar la proforma original a estado CONVERTIDA
            proforma.estado = EstadoNota.CONVERTIDA;
            proforma.observaciones = proforma.observaciones 
                ? `${proforma.observaciones} -> Convertida a Venta [${numeroVenta}]` 
                : `Convertida a Venta [${numeroVenta}]`;
            await manager.save(proforma);

            return savedVenta;
        });
    }

    async getUtilidadesData() {
        const [
            cobranzas,
            pagosProveedores,
            egresos,
            costosImportacion,
            traspasos
        ] = await Promise.all([
            this.dataSource.getRepository(PagoCobranza)
                .createQueryBuilder('pago')
                .leftJoin('pago.nota', 'nota')
                .leftJoin('nota.sucursal', 'notaSucursal')
                .leftJoin('notaSucursal.ciudad', 'notaSucursalCiudad')
                .leftJoin('nota.vendedor', 'vendedor')
                .leftJoin('nota.usuario', 'usuario')
                .leftJoin('usuario.persona', 'usuarioPersona')
                .leftJoin('pago.cliente', 'cliente')
                .leftJoin('cliente.persona', 'clientePersona')
                .leftJoin('cliente.sucursal', 'clienteSucursal')
                .leftJoin('clienteSucursal.ciudad', 'clienteSucursalCiudad')
                .select([
                    'pago.id',
                    'pago.monto',
                    'pago.moneda',
                    'pago.fecha',
                    'pago.metodoPago',
                    'pago.referencia',
                    'pago.observaciones',
                    'pago.comprobanteUrl',
                    'pago.activo',
                    'nota.id',
                    'nota.numero',
                    'nota.observaciones',
                    'notaSucursal.id',
                    'notaSucursal.nombre',
                    'notaSucursalCiudad.id',
                    'vendedor.id',
                    'vendedor.nombres',
                    'vendedor.apellidos',
                    'usuario.id',
                    'usuarioPersona.nombres',
                    'usuarioPersona.apellidos',
                    'cliente.id',
                    'clientePersona.nombres',
                    'clientePersona.apellidos',
                    'clienteSucursal.id',
                    'clienteSucursal.nombre',
                    'clienteSucursalCiudad.id',
                ])
                .where('pago.activo = :activo', { activo: true })
                .orderBy('pago.fecha', 'ASC')
                .addOrderBy('pago.id', 'ASC')
                .getMany(),

            this.dataSource.getRepository(PagoProveedor)
                .createQueryBuilder('pago')
                .leftJoin('pago.nota', 'nota')
                .leftJoin('nota.sucursal', 'notaSucursal')
                .leftJoin('notaSucursal.ciudad', 'notaSucursalCiudad')
                .leftJoin('pago.proveedor', 'proveedor')
                .leftJoin('proveedor.persona', 'proveedorPersona')
                .select([
                    'pago.id',
                    'pago.monto',
                    'pago.moneda',
                    'pago.fecha',
                    'pago.metodoPago',
                    'pago.referencia',
                    'pago.observaciones',
                    'pago.comprobanteUrl',
                    'pago.activo',
                    'nota.id',
                    'nota.numero',
                    'notaSucursal.id',
                    'notaSucursal.nombre',
                    'notaSucursalCiudad.id',
                    'proveedor.id',
                    'proveedor.empresa',
                    'proveedorPersona.nombres',
                    'proveedorPersona.apellidos',
                ])
                .where('pago.activo = :activo', { activo: true })
                .orderBy('pago.fecha', 'ASC')
                .addOrderBy('pago.id', 'ASC')
                .getMany(),

            this.dataSource.getRepository(Egreso)
                .createQueryBuilder('egreso')
                .leftJoin('egreso.sucursal', 'sucursal')
                .leftJoin('sucursal.ciudad', 'ciudad')
                .select([
                    'egreso.id',
                    'egreso.codigo',
                    'egreso.detalle',
                    'egreso.monto',
                    'egreso.moneda',
                    'egreso.formaPago',
                    'egreso.nroComprobante',
                    'egreso.comprobanteUrl',
                    'egreso.fecha',
                    'egreso.activo',
                    'sucursal.id',
                    'sucursal.nombre',
                    'ciudad.id',
                ])
                .where('egreso.activo = :activo', { activo: true })
                .orderBy('egreso.fecha', 'ASC')
                .addOrderBy('egreso.id', 'ASC')
                .getMany(),

            this.dataSource.getRepository(CostoImportacion)
                .createQueryBuilder('costo')
                .leftJoin('costo.nota', 'nota')
                .leftJoin('nota.proveedor', 'proveedor')
                .leftJoin('proveedor.persona', 'proveedorPersona')
                .leftJoin('costo.sucursal', 'sucursal')
                .select([
                    'costo.id',
                    'costo.notaId',
                    'costo.fecha',
                    'costo.tipoCambio',
                    'costo.totalGastosBob',
                    'costo.gastos',
                    'costo.monedaGastos',
                    'costo.metodoPago',
                    'costo.referencia',
                    'costo.comprobanteUrl',
                    'costo.sucursalId',
                    'sucursal.id',
                    'sucursal.nombre',
                    'nota.id',
                    'nota.numero',
                    'nota.fecha',
                    'proveedor.id',
                    'proveedor.empresa',
                    'proveedorPersona.nombres',
                    'proveedorPersona.apellidos',
                ])
                .orderBy('costo.fecha', 'ASC')
                .addOrderBy('costo.id', 'ASC')
                .getMany(),

            this.dataSource.getRepository(Traspaso)
                .createQueryBuilder('traspaso')
                .leftJoin('traspaso.sucursalOrigen', 'sucursalOrigen')
                .leftJoin('sucursalOrigen.ciudad', 'origenCiudad')
                .leftJoin('traspaso.sucursalDestino', 'sucursalDestino')
                .leftJoin('sucursalDestino.ciudad', 'destinoCiudad')
                .select([
                    'traspaso.id',
                    'traspaso.codigo',
                    'traspaso.fecha',
                    'traspaso.costoTransporte',
                    'traspaso.sucursalCargoCosto',
                    'traspaso.motivo',
                    'traspaso.observaciones',
                    'traspaso.estado',
                    'sucursalOrigen.id',
                    'sucursalOrigen.nombre',
                    'origenCiudad.id',
                    'sucursalDestino.id',
                    'sucursalDestino.nombre',
                    'destinoCiudad.id',
                ])
                .where('traspaso.estado != :estado', { estado: 'ANULADO' })
                .andWhere('traspaso.costoTransporte > 0')
                .orderBy('traspaso.fecha', 'ASC')
                .addOrderBy('traspaso.id', 'ASC')
                .getMany()
        ]);

        return {
            cobranzas,
            pagosProveedores,
            egresos,
            costosImportacion,
            traspasos,
        };
    }

    async getAllCostosImportacion() {
        return this.costoImportacionRepo.find({
            relations: ['nota', 'nota.proveedor', 'sucursal', 'usuario'],
            order: { fecha: 'DESC' },
        });
    }

    async getCostoImportacion(notaId: number) {
        return this.costoImportacionRepo.findOne({
            where: { notaId },
            relations: ['sucursal', 'usuario'],
        });
    }

    async guardarCostoImportacion(notaId: number, data: any, usuarioId?: number) {
        return this.dataSource.transaction(async (manager) => {
            const nota = await manager.findOne(Nota, {
                where: { id: notaId },
                relations: ['detalles', 'detalles.producto', 'sucursal'],
            });
            if (!nota) throw new NotFoundException(`Nota ${notaId} no encontrada`);
            if (nota.tipo !== TipoNota.COMPRA) throw new BadRequestException('Solo las compras admiten costo de importación');
            if (nota.estado !== EstadoNota.CONFIRMADA) throw new BadRequestException('Solo se puede registrar costo de importación en compras confirmadas');

            const tipoCambio = Number(data.tipoCambio) || Number(nota.tipoCambio) || 6.96;
            const costoFobUsd = Number(data.costoFobUsd) || 0;
            const costoFobBob = Number(data.costoFobBob) || 0;
            const totalGastosBob = Number(data.totalGastosBob) || 0;
            const costoTotalBob = Number(data.costoTotalBob) || (costoFobBob + totalGastosBob);
            const porcentajeGastos = Number(data.porcentajeGastos) || (costoFobBob > 0 ? (totalGastosBob * 100) / costoFobBob : 0);
            const sucursalId = data.sucursalId ? Number(data.sucursalId) : (nota.sucursal?.id || null);
            const fecha = data.fecha ? new Date(data.fecha) : new Date();

            const monedaGastos = data.monedaGastos || 'BOB';
            const metodoPago = data.metodoPago || 'Transferencia Bancaria';
            const referencia = data.referencia !== undefined ? data.referencia : null;
            const comprobanteUrl = data.comprobanteUrl !== undefined ? data.comprobanteUrl : null;

            let costoImp = await manager.findOne(CostoImportacion, { where: { notaId } });
            if (!costoImp) {
                costoImp = manager.create(CostoImportacion, {
                    notaId,
                    sucursalId: sucursalId || undefined,
                    usuarioId: usuarioId || undefined,
                    fecha,
                    tipoCambio,
                    costoFobUsd,
                    costoFobBob,
                    totalGastosBob,
                    costoTotalBob,
                    porcentajeGastos,
                    gastos: data.gastos || [],
                    monedaGastos,
                    metodoPago,
                    referencia,
                    comprobanteUrl,
                });
            } else {
                costoImp.sucursalId = sucursalId || costoImp.sucursalId;
                if (usuarioId) costoImp.usuarioId = usuarioId;
                costoImp.fecha = fecha;
                costoImp.tipoCambio = tipoCambio;
                costoImp.costoFobUsd = costoFobUsd;
                costoImp.costoFobBob = costoFobBob;
                costoImp.totalGastosBob = totalGastosBob;
                costoImp.costoTotalBob = costoTotalBob;
                costoImp.porcentajeGastos = porcentajeGastos;
                costoImp.gastos = data.gastos || [];
                costoImp.monedaGastos = monedaGastos;
                costoImp.metodoPago = metodoPago;
                costoImp.referencia = referencia;
                costoImp.comprobanteUrl = comprobanteUrl;
            }

            await manager.save(costoImp);

            // Actualizar precio de compra de los productos en la tabla productos, inventario y lotes
            const factorIncremento = 1 + (porcentajeGastos / 100);

            for (const det of nota.detalles) {
                if (!det.producto?.id) continue;

                // Precio base unitario en Bolivianos
                let precioUnitarioBob = Number(det.precioUnitario) || 0;
                if (nota.moneda === Moneda.USD) {
                    precioUnitarioBob = precioUnitarioBob * tipoCambio;
                }

                const nuevoPrecioCompra = Number((precioUnitarioBob * factorIncremento).toFixed(2));

                // 1. Actualizar tabla productos
                await manager.update(Producto, det.producto.id, {
                    precioCompra: nuevoPrecioCompra,
                    fechaUltimaCompra: fecha || nota.fecha || new Date(),
                });

                // 2. Actualizar inventario de la sucursal (si existe)
                if (sucursalId) {
                    const inv = await manager.findOne(Inventario, {
                        where: {
                            producto: { id: det.producto.id },
                            sucursal: { id: sucursalId }
                        }
                    });
                    if (inv) {
                        inv.precioCompra = nuevoPrecioCompra;
                        await manager.save(inv);
                    }
                }

                // 3. Actualizar costo unitario de los lotes creados por esta nota
                const lotes = await manager.find(Lote, {
                    where: {
                        notaIngreso: { id: nota.id },
                        producto: { id: det.producto.id },
                    }
                });
                for (const lote of lotes) {
                    lote.costoUnitario = nuevoPrecioCompra;
                    await manager.save(lote);
                }
            }

            return costoImp;
        });
    }
}
