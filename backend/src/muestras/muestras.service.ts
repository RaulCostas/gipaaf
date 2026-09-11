import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between, ILike, FindOptionsWhere } from 'typeorm';
import { Muestra, EstadoMuestra } from './muestra.entity';
import { DetalleMuestra } from './detalle-muestra.entity';

@Injectable()
export class MuestrasService {
    constructor(
        @InjectRepository(Muestra) private muestraRepo: Repository<Muestra>,
        @InjectRepository(DetalleMuestra) private detalleRepo: Repository<DetalleMuestra>,
        private dataSource: DataSource,
    ) { }

    async findAll(query?: {
        clienteId?: number;
        sucursalId?: number;
        vendedorId?: number;
        estado?: string;
        fechaDesde?: string;
        fechaHasta?: string;
        search?: string;
    }) {
        const qb = this.muestraRepo.createQueryBuilder('muestra')
            .leftJoinAndSelect('muestra.cliente', 'cliente')
            .leftJoinAndSelect('cliente.persona', 'clientePersona')
            .leftJoinAndSelect('muestra.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .leftJoinAndSelect('muestra.usuario', 'usuario')
            .leftJoinAndSelect('muestra.vendedor', 'vendedor')
            .leftJoinAndSelect('muestra.detalles', 'detalles')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .orderBy('muestra.fecha', 'DESC')
            .addOrderBy('muestra.id', 'DESC');

        if (query?.clienteId) {
            qb.andWhere('muestra.clienteId = :clienteId', { clienteId: query.clienteId });
        }

        if (query?.sucursalId) {
            qb.andWhere('muestra.sucursalId = :sucursalId', { sucursalId: query.sucursalId });
        }

        if (query?.vendedorId) {
            qb.andWhere('muestra.vendedorId = :vendedorId', { vendedorId: query.vendedorId });
        }

        if (query?.estado) {
            qb.andWhere('muestra.estado = :estado', { estado: query.estado });
        }

        if (query?.fechaDesde && query?.fechaHasta) {
            qb.andWhere('muestra.fecha BETWEEN :desde AND :hasta', {
                desde: query.fechaDesde,
                hasta: query.fechaHasta,
            });
        } else if (query?.fechaDesde) {
            qb.andWhere('muestra.fecha >= :desde', { desde: query.fechaDesde });
        } else if (query?.fechaHasta) {
            qb.andWhere('muestra.fecha <= :hasta', { hasta: query.fechaHasta });
        }

        if (query?.search) {
            const term = `%${query.search.toLowerCase()}%`;
            qb.andWhere(
                '(LOWER(muestra.numero) LIKE :term OR LOWER(clientePersona.nombres) LIKE :term OR LOWER(clientePersona.apellidos) LIKE :term OR LOWER(cliente.empresa) LIKE :term OR LOWER(producto.nombre) LIKE :term OR LOWER(producto.codigo) LIKE :term)',
                { term }
            );
        }

        return qb.getMany();
    }

    async findOne(id: number) {
        const muestra = await this.muestraRepo.findOne({
            where: { id },
            relations: ['cliente', 'cliente.persona', 'sucursal', 'sucursal.ciudad', 'usuario', 'vendedor', 'detalles', 'detalles.producto'],
        });
        if (!muestra) throw new NotFoundException(`Muestra ${id} no encontrada`);
        return muestra;
    }

    async create(data: any, usuarioId?: number) {
        return this.dataSource.transaction(async (manager) => {
            const count = await manager.count(Muestra);
            const numero = `MUE-${String(count + 1).padStart(6, '0')}`;

            const today = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local timezone

            const detalles = (data.detalles || []).map((det: any) => {
                const cantEntregada = Number(det.cantidadEntregada || det.cantidad || 1);
                return manager.create(DetalleMuestra, {
                    producto: { id: Number(det.productoId || det.producto?.id) },
                    cantidadEntregada: cantEntregada,
                    cantidadDevuelta: 0,
                    numeroLote: det.numeroLote || null,
                    fechaVencimiento: det.fechaVencimiento ? String(det.fechaVencimiento).substring(0, 10) : undefined,
                    estado: 'ENTREGADO',
                    observaciones: det.observaciones || null,
                });
            });

            const muestra = manager.create(Muestra, {
                numero,
                fecha: data.fecha ? String(data.fecha).substring(0, 10) : today,
                fechaEstimadaDevolucion: data.fechaEstimadaDevolucion ? String(data.fechaEstimadaDevolucion).substring(0, 10) : undefined,
                estado: EstadoMuestra.ENTREGADO,
                cliente: { id: Number(data.clienteId || data.cliente?.id) },
                sucursal: data.sucursalId ? { id: Number(data.sucursalId) } : (data.sucursal?.id ? { id: Number(data.sucursal.id) } : undefined),
                usuario: usuarioId ? { id: usuarioId } : (data.usuario?.id ? { id: Number(data.usuario.id) } : undefined),
                vendedor: data.vendedorId ? { id: Number(data.vendedorId) } : (data.vendedor?.id ? { id: Number(data.vendedor.id) } : undefined),
                observaciones: data.observaciones || undefined,
                detalles,
            });

            return manager.save(muestra);
        });
    }

    async update(id: number, data: any) {
        return this.dataSource.transaction(async (manager) => {
            const muestra = await manager.findOne(Muestra, {
                where: { id },
                relations: ['detalles', 'detalles.producto'],
            });
            if (!muestra) throw new NotFoundException(`Muestra ${id} no encontrada`);
            if (muestra.estado === EstadoMuestra.ANULADO) {
                throw new BadRequestException('No se pueden editar muestras anuladas');
            }

            if (data.fecha) muestra.fecha = String(data.fecha).substring(0, 10);
            if (data.fechaEstimadaDevolucion !== undefined) {
                muestra.fechaEstimadaDevolucion = data.fechaEstimadaDevolucion ? String(data.fechaEstimadaDevolucion).substring(0, 10) : null;
            }
            if (data.clienteId || data.cliente?.id) {
                muestra.cliente = { id: Number(data.clienteId || data.cliente?.id) } as any;
            }
            if (data.sucursalId !== undefined) {
                muestra.sucursal = data.sucursalId ? { id: Number(data.sucursalId) } as any : null;
            }
            if (data.vendedorId !== undefined) {
                muestra.vendedor = data.vendedorId ? { id: Number(data.vendedorId) } as any : null;
            }
            if (data.observaciones !== undefined) {
                muestra.observaciones = data.observaciones;
            }

            // Si se envían nuevos detalles y la muestra sigue en estado entregado
            if (data.detalles && muestra.estado === EstadoMuestra.ENTREGADO) {
                await manager.delete(DetalleMuestra, { muestra: { id } });
                const nuevosDetalles = data.detalles.map((det: any) => {
                    return manager.create(DetalleMuestra, {
                        producto: { id: Number(det.productoId || det.producto?.id) },
                        cantidadEntregada: Number(det.cantidadEntregada || det.cantidad || 1),
                        cantidadDevuelta: Number(det.cantidadDevuelta || 0),
                        numeroLote: det.numeroLote || null,
                        fechaVencimiento: det.fechaVencimiento ? String(det.fechaVencimiento).substring(0, 10) : undefined,
                        estado: det.estado || 'ENTREGADO',
                        observaciones: det.observaciones || null,
                    });
                });
                muestra.detalles = nuevosDetalles;
            }

            return manager.save(muestra);
        });
    }

    async registrarDevolucion(id: number, data: {
        fechaDevolucion?: string;
        items: { id: number; cantidadDevuelta: number; observaciones?: string }[];
        observaciones?: string;
    }) {
        return this.dataSource.transaction(async (manager) => {
            const muestra = await manager.findOne(Muestra, {
                where: { id },
                relations: ['detalles', 'detalles.producto'],
            });
            if (!muestra) throw new NotFoundException(`Muestra ${id} no encontrada`);
            if (muestra.estado === EstadoMuestra.ANULADO) {
                throw new BadRequestException('No se pueden registrar devoluciones en muestras anuladas');
            }

            const today = new Date().toLocaleDateString('en-CA');
            muestra.fechaDevolucion = data.fechaDevolucion ? String(data.fechaDevolucion).substring(0, 10) : today;
            if (data.observaciones) {
                muestra.observaciones = muestra.observaciones 
                    ? `${muestra.observaciones}\n[Devolución]: ${data.observaciones}` 
                    : `[Devolución]: ${data.observaciones}`;
            }

            let totalEntregado = 0;
            let totalDevuelto = 0;

            for (const det of muestra.detalles) {
                const itemDev = data.items?.find((i) => i.id === det.id);
                if (itemDev) {
                    const cantDev = Number(itemDev.cantidadDevuelta) || 0;
                    det.cantidadDevuelta = cantDev;
                    if (itemDev.observaciones) det.observaciones = itemDev.observaciones;

                    if (cantDev >= Number(det.cantidadEntregada)) {
                        det.estado = 'DEVUELTO';
                    } else if (cantDev > 0) {
                        det.estado = 'DEVUELTO_PARCIAL';
                    } else {
                        det.estado = 'ENTREGADO';
                    }
                    await manager.save(det);
                }

                totalEntregado += Number(det.cantidadEntregada);
                totalDevuelto += Number(det.cantidadDevuelta);
            }

            if (totalDevuelto >= totalEntregado && totalEntregado > 0) {
                muestra.estado = EstadoMuestra.DEVUELTO_TOTAL;
            } else if (totalDevuelto > 0) {
                muestra.estado = EstadoMuestra.DEVUELTO_PARCIAL;
            } else {
                muestra.estado = EstadoMuestra.ENTREGADO;
            }

            return manager.save(muestra);
        });
    }

    async anular(id: number) {
        const muestra = await this.findOne(id);
        muestra.estado = EstadoMuestra.ANULADO;
        return this.muestraRepo.save(muestra);
    }
}
