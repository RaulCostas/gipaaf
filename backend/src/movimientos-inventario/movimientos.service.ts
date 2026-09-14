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
                relations: ['detalles', 'detalles.producto', 'sucursal', 'cliente', 'proveedor', 'usuario']
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

                    const costoUnit = Number(det.precioUnitario) || Number(det.producto?.precioCompra) || 0;
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
                            costoUnitario: costoUnit,
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
                            costoUnitario: costoUnit,
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
                            costoUnitario: costoUnit,
                            usuario: nota.usuario || undefined,
                            creadoEn: nota.fecha ? new Date(nota.fecha + 'T12:00:00') : (nota.creadoEn || new Date()),
                        }));
                    }
                }
            }

            // Also backfill existing records that have null numeroDocumento or observaciones
            const existingWithoutDocs = await this.repo.createQueryBuilder('m')
                .where('m.numeroDocumento IS NULL')
                .getMany();

            for (const mov of existingWithoutDocs) {
                const match = mov.motivo.match(/\[(.*?)\]/);
                if (match && match[1]) {
                    mov.numeroDocumento = match[1];
                    const matchedNota = confirmedNotas.find(n => n.numero === match[1]);
                    if (matchedNota) {
                        if (matchedNota.observaciones) mov.observaciones = matchedNota.observaciones;
                        if (!mov.costoUnitario && matchedNota.detalles && matchedNota.detalles.length > 0) {
                            const detMatch = matchedNota.detalles.find(d => d.producto?.id === mov.inventario?.producto?.id);
                            if (detMatch) {
                                mov.costoUnitario = Number(detMatch.precioUnitario) || Number(detMatch.producto?.precioCompra) || 0;
                            }
                        }
                    }
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
