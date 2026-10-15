import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, DataSource } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Ruta } from '../rutas/ruta.entity';
import { Nota, TipoNota, EstadoNota } from '../notas/nota.entity';

@Injectable()
export class ClientesService {
    constructor(
        @InjectRepository(Cliente) private repo: Repository<Cliente>,
        @InjectRepository(Sucursal) private sucursalRepo: Repository<Sucursal>,
        @InjectRepository(Ruta) private rutaRepo: Repository<Ruta>,
        private dataSource: DataSource
    ) {}

    private async attachDeudasYCredito(clientes: Cliente[]): Promise<any[]> {
        if (!clientes || clientes.length === 0) return [];
        
        try {
            const deudas = await this.dataSource.getRepository(Nota)
                .createQueryBuilder('nota')
                .select('nota.cliente.id', 'clienteId')
                .addSelect('SUM(nota.saldo)', 'totalSaldo')
                .where('nota.tipo = :tipo', { tipo: TipoNota.VENTA })
                .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA })
                .andWhere('nota.saldo > 0')
                .groupBy('nota.cliente.id')
                .getRawMany();

            const deudasMap = new Map<number, number>();
            for (const d of deudas) {
                if (d.clienteId) {
                    deudasMap.set(Number(d.clienteId), parseFloat(d.totalSaldo || '0'));
                }
            }

            return clientes.map(c => {
                const deuda = deudasMap.get(c.id) || 0;
                const limite = parseFloat(c.limiteCredito as any || '0');
                const disponible = limite > 0 ? Math.max(0, limite - deuda) : 0;
                return {
                    ...c,
                    deudaActual: deuda,
                    creditoDisponible: disponible,
                    limiteCredito: limite
                };
            });
        } catch (err) {
            return clientes;
        }
    }

    async findAll(search?: string) {
        let clientes: Cliente[];
        if (search) {
            clientes = await this.repo.find({
                where: [
                    { persona: { nombres: Like(`%${search}%`) }, activo: true },
                    { persona: { apellidos: Like(`%${search}%`) }, activo: true },
                    { persona: { ci: Like(`%${search}%`) }, activo: true },
                    { nombreTienda: Like(`%${search}%`), activo: true },
                    { codigo: Like(`%${search}%`), activo: true },
                ],
                relations: ['persona', 'sucursal', 'sucursal.ciudad', 'ruta', 'ruta.vendedor', 'ruta.sucursal', 'ruta.sucursal.ciudad']
            });
        } else {
            clientes = await this.repo.find({ 
                where: { activo: true },
                relations: ['persona', 'sucursal', 'sucursal.ciudad', 'ruta', 'ruta.vendedor', 'ruta.sucursal', 'ruta.sucursal.ciudad']
            });
        }
        return this.attachDeudasYCredito(clientes);
    }

    async findOne(id: number) {
        const c = await this.repo.findOne({ 
            where: { id },
            relations: ['persona', 'sucursal', 'sucursal.ciudad', 'ruta', 'ruta.vendedor', 'ruta.sucursal', 'ruta.sucursal.ciudad']
        });
        if (!c) throw new NotFoundException(`Cliente ${id} no encontrado`);
        const [res] = await this.attachDeudasYCredito([c]);
        return res || c;
    }

    private async validarCodigoUnicoPorSucursal(
        codigo?: string | null,
        sucursalId?: number | null,
        excludeClienteId?: number
    ): Promise<void> {
        if (!codigo || !codigo.trim()) {
            return;
        }

        const codigoLimpio = codigo.trim();
        const qb = this.repo.createQueryBuilder('cliente')
            .leftJoinAndSelect('cliente.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .leftJoinAndSelect('cliente.persona', 'persona')
            .where('LOWER(TRIM(cliente.codigo)) = LOWER(:codigo)', { codigo: codigoLimpio });

        if (sucursalId) {
            qb.andWhere('sucursal.id = :sucursalId', { sucursalId: Number(sucursalId) });
        } else {
            qb.andWhere('sucursal.id IS NULL');
        }

        if (excludeClienteId) {
            qb.andWhere('cliente.id != :excludeClienteId', { excludeClienteId });
        }

        const duplicado = await qb.getOne();

        if (duplicado) {
            const nombreSucursal = duplicado.sucursal
                ? `${duplicado.sucursal.nombre}${duplicado.sucursal.ciudad?.nombre ? ` (${duplicado.sucursal.ciudad.nombre})` : ''}`
                : 'Sin Sucursal';
            const detalleCliente = duplicado.nombreTienda
                ? ` [Tienda: "${duplicado.nombreTienda}"]`
                : duplicado.persona
                    ? ` [Cliente: "${duplicado.persona.nombres} ${duplicado.persona.apellidos}"]`
                    : '';
            throw new BadRequestException(
                `Ya existe un cliente con el código "${codigoLimpio}" en la sucursal "${nombreSucursal}"${detalleCliente}. No se permite repetir el código dentro de la misma sucursal.`
            );
        }
    }

    async create(data: any) {
        const sucursalId = typeof data.sucursal === 'object' ? data.sucursal?.id : data.sucursal;
        const codigo = data.codigo ? String(data.codigo).trim() : null;

        await this.validarCodigoUnicoPorSucursal(codigo, sucursalId ? Number(sucursalId) : null);

        let sucursalEntity: Sucursal | null = null;
        if (sucursalId) {
            sucursalEntity = await this.sucursalRepo.findOne({ where: { id: Number(sucursalId) } });
        }

        let rutaEntity: Ruta | null = null;
        const rutaId = typeof data.ruta === 'object' ? data.ruta?.id : data.ruta;
        if (rutaId) {
            rutaEntity = await this.rutaRepo.findOne({ where: { id: Number(rutaId) } });
        }

        const cliente = this.repo.create({
            ...data,
            codigo,
            sucursal: sucursalEntity as any,
            ruta: rutaEntity as any
        });
        return this.repo.save(cliente);
    }

    async update(id: number, data: any) {
        const entity = await this.findOne(id);

        let nuevoSucursalId = entity.sucursal ? entity.sucursal.id : null;
        if (data.sucursal !== undefined) {
            const sId = typeof data.sucursal === 'object' ? data.sucursal?.id : data.sucursal;
            nuevoSucursalId = sId ? Number(sId) : null;
        }

        let nuevoCodigo = entity.codigo;
        if (data.codigo !== undefined) {
            nuevoCodigo = data.codigo ? String(data.codigo).trim() : null;
        }

        await this.validarCodigoUnicoPorSucursal(nuevoCodigo, nuevoSucursalId, id);

        if (data.sucursal !== undefined) {
            if (nuevoSucursalId) {
                entity.sucursal = (await this.sucursalRepo.findOne({ where: { id: nuevoSucursalId } })) as any;
            } else {
                entity.sucursal = null as any;
            }
            delete data.sucursal;
        }

        if (data.ruta !== undefined) {
            const rutaId = typeof data.ruta === 'object' ? data.ruta?.id : data.ruta;
            if (rutaId) {
                entity.ruta = (await this.rutaRepo.findOne({ where: { id: Number(rutaId) } })) as any;
            } else {
                entity.ruta = null as any;
            }
            delete data.ruta;
        }

        if (data.codigo !== undefined) {
            data.codigo = nuevoCodigo;
        }

        const merged = this.repo.merge(entity, data);
        return this.repo.save(merged);
    }

    async remove(id: number) {
        const c = await this.findOne(id);
        return this.repo.softRemove(c);
    }
}
