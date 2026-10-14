import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { MovimientoInventario } from './movimiento_inventario.entity';
import { Nota, TipoNota, EstadoNota } from '../notas/nota.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Lote } from '../inventario/lote.entity';

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
        @InjectRepository(Lote)
        private loteRepo: Repository<Lote>,
    ) {}

    async onModuleInit() {
        await this.syncHistoricalNotas();
        await this.syncInitialStock();
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

                // Check existing MovimientoInventario for this nota number
                const existingMovs = await this.repo.find({
                    where: [
                        { numeroDocumento: nota.numero },
                        { motivo: Like(`%[${nota.numero}]%`) }
                    ],
                    relations: ['inventario', 'inventario.producto']
                });

                let needsResync = false;
                if (existingMovs.length === 0) {
                    needsResync = true;
                } else if (existingMovs.length !== (nota.detalles || []).length) {
                    needsResync = true;
                } else {
                    for (const det of (nota.detalles || [])) {
                        const matchingMov = existingMovs.find(m => m.inventario?.producto?.id === det.producto?.id);
                        if (!matchingMov) {
                            needsResync = true;
                            break;
                        }
                        const expectedCant = nota.tipo === TipoNota.COMPRA 
                            ? Number(det.cantidad) 
                            : (nota.tipo === TipoNota.VENTA ? -Number(det.cantidad) : Number(det.cantidad));
                        if (Math.abs(Number(matchingMov.cantidad) - expectedCant) > 0.001) {
                            needsResync = true;
                            break;
                        }
                    }
                }

                if (!needsResync) {
                    continue; // Already in sync with nota details
                }

                if (existingMovs.length > 0) {
                    console.log(`[syncHistoricalNotas] Reconciliando movimientos para nota ${nota.numero} (detectada discrepancia en cantidad/detalles)...`);
                    await this.repo.remove(existingMovs);
                }

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
                        const isSalidaReposicion = det.tipoMovimiento === 'SALIDA_REPOSICION';
                        if (isSalidaReposicion) {
                            await this.repo.save(this.repo.create({
                                inventario: inv,
                                tipo: 'SALIDA_REPOSICION',
                                cantidad: -Number(det.cantidad),
                                motivo: `Reposición / Cambio por Devolución [${nota.numero}]`.trim(),
                                numeroDocumento: nota.numero,
                                observaciones: obs,
                                costoUnitario: Number(inv?.precioCompra) || Number(det.producto?.precioCompra) || 0,
                                usuario: nota.usuario || undefined,
                                creadoEn: nota.fecha ? new Date(nota.fecha + 'T12:00:00') : (nota.creadoEn || new Date()),
                            }));
                        } else {
                            const destino = det.destinoProducto || 'REINGRESO_STOCK';
                            let movTipo = 'DEVOLUCION';
                            let motivo = `Devolución de Cliente [${nota.numero}] - Reingreso a Stock`;
                            if (destino === 'DESCARTE_MERMA') {
                                movTipo = 'MERMA_DESCARTE';
                                motivo = `Devolución [${nota.numero}] - Descarte/Merma (Defecto: ${det.motivoDefecto || 'Dañado'})`;
                            } else if (destino === 'RECLAMO_PROVEEDOR') {
                                movTipo = 'RECLAMO_PROVEEDOR';
                                motivo = `Devolución [${nota.numero}] - Custodia para Reclamo a Proveedor (Defecto: ${det.motivoDefecto || 'Dañado'})`;
                            }

                            await this.repo.save(this.repo.create({
                                inventario: inv,
                                tipo: movTipo,
                                cantidad: Number(det.cantidad),
                                motivo: motivo.trim(),
                                numeroDocumento: nota.numero,
                                observaciones: obs,
                                costoUnitario: Number(det.precioUnitario) || Number(inv?.precioCompra) || Number(det.producto?.precioCompra) || 0,
                                usuario: nota.usuario || undefined,
                                creadoEn: nota.fecha ? new Date(nota.fecha + 'T12:00:00') : (nota.creadoEn || new Date()),
                            }));
                        }
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

    async syncInitialStock() {
        try {
            // Buscar lotes de saldo inicial ('L-INI%')
            const initialLotes = await this.loteRepo.find({
                where: { numeroLote: Like('L-INI%') },
                relations: ['producto', 'sucursal']
            });

            if (!initialLotes || initialLotes.length === 0) return;

            // Verificar qué lotes o inventarios ya tienen su movimiento INVENTARIO_INICIAL
            const existingInitialMovs = await this.repo.find({
                where: { tipo: 'INVENTARIO_INICIAL' },
                select: ['id', 'numeroDocumento']
            });
            const existingDocs = new Set(existingInitialMovs.map(m => m.numeroDocumento).filter(Boolean));

            const lotesToSync = initialLotes.filter(l => !existingDocs.has(l.numeroLote));
            
            // Buscar todos los inventarios para relacionar rápido
            const allInventarios = await this.inventarioRepo.find({
                relations: ['producto', 'sucursal']
            });
            const invMap = new Map<string, Inventario>();
            for (const inv of allInventarios) {
                if (inv.producto?.id && inv.sucursal?.id) {
                    invMap.set(`${inv.producto.id}_${inv.sucursal.id}`, inv);
                }
            }

            const rawRowsToInsert: any[] = [];
            for (const lote of lotesToSync) {
                const prodId = lote.producto?.id;
                const sucId = lote.sucursal?.id;
                if (!prodId || !sucId) continue;

                let inv = invMap.get(`${prodId}_${sucId}`);
                if (!inv) {
                    inv = await this.inventarioRepo.save(this.inventarioRepo.create({
                        producto: lote.producto,
                        sucursal: lote.sucursal,
                        stockActual: Number(lote.cantidadActual) || Number(lote.cantidadInicial) || 0,
                        stockMinimo: 0,
                        stockMaximo: 0,
                        precioCompra: Number(lote.costoUnitario) || 0,
                        precioVenta: Number(lote.producto?.precioVenta) || 0
                    }));
                    invMap.set(`${prodId}_${sucId}`, inv);
                }

                const cant = Number(lote.cantidadInicial) || 0;
                if (cant <= 0) continue;

                const baseDate = lote.fechaIngreso 
                    ? new Date(lote.fechaIngreso).toISOString() 
                    : '2026-09-30 00:00:00';

                rawRowsToInsert.push([
                    inv.id,
                    'INVENTARIO_INICIAL',
                    cant,
                    `Inventario Inicial [${lote.numeroLote}]`,
                    lote.numeroLote,
                    'Carga inicial de inventario al 30/09/2026',
                    Number(lote.costoUnitario) || Number(inv.precioCompra) || 0,
                    baseDate
                ]);
            }

            // También verificar inventarios que tengan stockActual > 0 y no hayan tenido lote L-INI
            for (const inv of allInventarios) {
                const docId = `INI-INV-${inv.id}`;
                const hasIniMov = existingDocs.has(docId);
                const hasLoteForInv = initialLotes.some(l => l.producto?.id === inv.producto?.id && l.sucursal?.id === inv.sucursal?.id);
                if (!hasIniMov && !hasLoteForInv && Number(inv.stockActual) > 0) {
                    rawRowsToInsert.push([
                        inv.id,
                        'INVENTARIO_INICIAL',
                        Number(inv.stockActual),
                        `Inventario Inicial [${docId}]`,
                        docId,
                        'Stock inicial registrado en inventario al 30/09/2026',
                        Number(inv.precioCompra) || 0,
                        '2026-09-30 00:00:00'
                    ]);
                }
            }

            if (rawRowsToInsert.length === 0) {
                return;
            }

            console.log(`[syncInitialStock] Insertando ${rawRowsToInsert.length} movimientos de inventario inicial...`);

            // Insertar por lotes de 100
            const batchSize = 100;
            for (let i = 0; i < rawRowsToInsert.length; i += batchSize) {
                const batch = rawRowsToInsert.slice(i, i + batchSize);
                const valuePlaceholders: string[] = [];
                const flatParams: any[] = [];
                let paramIndex = 1;

                for (const row of batch) {
                    const rowPlaceholders: string[] = [];
                    for (const val of row) {
                        rowPlaceholders.push(`$${paramIndex++}`);
                        flatParams.push(val);
                    }
                    valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
                }

                const sql = `
                    INSERT INTO movimientos_inventario ("inventarioId", tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "creadoEn")
                    VALUES ${valuePlaceholders.join(', ')}
                `;
                await this.repo.query(sql, flatParams);
            }

            console.log(`[syncInitialStock] Se crearon exitosamente ${rawRowsToInsert.length} movimientos de inventario inicial.`);
        } catch (error) {
            console.error('Error sincronizando inventario inicial a movimientos:', error);
        }
    }

    async findAll(tipo?: string, sucursalId?: number, ciudadId?: number) {
        const qb = this.repo.createQueryBuilder('mov')
            .leftJoinAndSelect('mov.inventario', 'inventario')
            .leftJoinAndSelect('inventario.producto', 'producto')
            .leftJoinAndSelect('producto.linea', 'linea')
            .leftJoinAndSelect('producto.marca', 'marca')
            .leftJoinAndSelect('producto.grupo', 'grupo')
            .leftJoinAndSelect('inventario.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .leftJoinAndSelect('mov.usuario', 'usuario')
            .leftJoinAndSelect('usuario.persona', 'persona');

        if (tipo) {
            if (tipo === 'MERMA') {
                qb.andWhere('(mov.tipo = :tipo OR mov.tipo = :tipoDescarte)', { tipo: 'MERMA', tipoDescarte: 'MERMA_DESCARTE' });
            } else {
                qb.andWhere('mov.tipo = :tipo', { tipo });
            }
        }
        if (sucursalId) {
            qb.andWhere('inventario.sucursalId = :sucursalId', { sucursalId });
        } else if (ciudadId) {
            qb.andWhere('sucursal.ciudadId = :ciudadId', { ciudadId });
        }

        return qb.orderBy('mov.creadoEn', 'DESC')
            .addOrderBy('mov.id', 'DESC')
            .getMany();
    }

    findByInventario(inventarioId: number) {
        return this.repo.createQueryBuilder('mov')
            .leftJoinAndSelect('mov.inventario', 'inventario')
            .leftJoinAndSelect('inventario.producto', 'producto')
            .leftJoinAndSelect('producto.linea', 'linea')
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

    async update(id: number, data: { motivo?: string; observaciones?: string }) {
        const mov = await this.repo.findOne({ where: { id } });
        if (!mov) {
            throw new NotFoundException('Movimiento no encontrado');
        }
        if (data.motivo !== undefined) mov.motivo = data.motivo;
        if (data.observaciones !== undefined) mov.observaciones = data.observaciones;
        return this.repo.save(mov);
    }

    async remove(id: number) {
        const mov = await this.repo.findOne({
            where: { id },
            relations: ['inventario', 'inventario.producto', 'inventario.sucursal']
        });
        if (!mov) {
            throw new NotFoundException('Movimiento no encontrado');
        }

        // Si es una MERMA, restaurar el stock al inventario y a los lotes
        if (mov.tipo === 'MERMA' && mov.inventario) {
            const cantRevertir = Math.abs(Number(mov.cantidad) || 0);
            if (cantRevertir > 0) {
                mov.inventario.stockActual = Number(mov.inventario.stockActual || 0) + cantRevertir;
                await this.inventarioRepo.save(mov.inventario);

                const lote = await this.loteRepo.findOne({
                    where: {
                        producto: { id: mov.inventario.producto?.id },
                        sucursal: mov.inventario.sucursal ? { id: mov.inventario.sucursal.id } : undefined
                    },
                    order: { fechaIngreso: 'DESC' }
                });
                if (lote) {
                    lote.cantidadActual = Number(lote.cantidadActual || 0) + cantRevertir;
                    await this.loteRepo.save(lote);
                }
            }
        }

        return this.repo.remove(mov);
    }
}
