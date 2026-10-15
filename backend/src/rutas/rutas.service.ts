import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ruta } from './ruta.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Personal } from '../personal/personal.entity';
import { Cliente } from '../clientes/cliente.entity';

@Injectable()
export class RutasService {
    constructor(
        @InjectRepository(Ruta) private repo: Repository<Ruta>,
        @InjectRepository(Sucursal) private sucursalRepo: Repository<Sucursal>,
        @InjectRepository(Personal) private personalRepo: Repository<Personal>,
        @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>
    ) {}

    findAll() {
        return this.repo.find({ 
            relations: ['vendedor', 'sucursal', 'sucursal.ciudad', 'clientes', 'clientes.persona'],
            order: { id: 'DESC' }
        });
    }

    async findOne(id: number) {
        const ruta = await this.repo.findOne({ 
            where: { id },
            relations: ['vendedor', 'sucursal', 'sucursal.ciudad', 'clientes', 'clientes.persona'] 
        });
        if (!ruta) throw new NotFoundException('Ruta no encontrada');
        return ruta;
    }

    async validarNombreUnico(nombre?: string, sucursalId?: number, excludeId?: number) {
        if (!nombre || !nombre.trim()) return;
        const nombreLimpio = nombre.trim();
        const qb = this.repo
            .createQueryBuilder('r')
            .where('LOWER(TRIM(r.nombre)) = LOWER(:nombre)', { nombre: nombreLimpio })
            .andWhere('r.eliminadoEn IS NULL');

        if (sucursalId) {
            qb.andWhere('r.sucursalId = :sucursalId', { sucursalId });
        } else {
            qb.andWhere('r.sucursalId IS NULL');
        }

        const existing = await qb.getOne();

        if (existing && (!excludeId || existing.id !== Number(excludeId))) {
            const mensajeSucursal = sucursalId ? ' en esta sucursal' : '';
            throw new BadRequestException(`Ya existe una ruta de ventas registrada con el nombre "${existing.nombre}"${mensajeSucursal}.`);
        }
    }

    async create(data: any) {
        const clienteIds = data.clienteIds;
        delete data.clienteIds;

        const nombreLimpio = data.nombre?.trim();
        const sucursalId = typeof data.sucursal === 'object' ? data.sucursal?.id : data.sucursal;
        const parsedSucursalId = sucursalId ? Number(sucursalId) : undefined;

        if (nombreLimpio) {
            await this.validarNombreUnico(nombreLimpio, parsedSucursalId);
            data.nombre = nombreLimpio;
        }

        let sucursalEntity: Sucursal | null = null;
        if (parsedSucursalId) {
            sucursalEntity = await this.sucursalRepo.findOne({ where: { id: parsedSucursalId } });
        }

        let vendedorEntity: Personal | null = null;
        const vendedorId = typeof data.vendedor === 'object' ? data.vendedor?.id : data.vendedor;
        if (vendedorId) {
            vendedorEntity = await this.personalRepo.findOne({ where: { id: Number(vendedorId) } });
        }

        const ruta = this.repo.create({
            ...data,
            sucursal: sucursalEntity as any,
            vendedor: vendedorEntity as any
        } as Partial<Ruta>);
        const savedRuta = await this.repo.save(ruta);

        if (Array.isArray(clienteIds) && clienteIds.length > 0) {
            const clientsToAssign = await this.clienteRepo.find({
                where: { id: In(clienteIds.map(Number)) }
            });
            for (const client of clientsToAssign) {
                client.ruta = savedRuta as any;
                await this.clienteRepo.save(client);
            }
        }

        return this.findOne(savedRuta.id);
    }

    async update(id: number, data: any) {
        const entity = await this.findOne(id);
        const clienteIds = data.clienteIds;
        delete data.clienteIds;

        const nuevoNombre = data.nombre !== undefined ? data.nombre?.trim() : entity.nombre;
        let nuevoSucursalId: number | undefined;

        if (data.sucursal !== undefined) {
            const sucursalId = typeof data.sucursal === 'object' ? data.sucursal?.id : data.sucursal;
            nuevoSucursalId = sucursalId ? Number(sucursalId) : undefined;
            if (nuevoSucursalId) {
                entity.sucursal = (await this.sucursalRepo.findOne({ where: { id: nuevoSucursalId } })) as any;
            } else {
                entity.sucursal = null as any;
            }
            delete data.sucursal;
        } else {
            nuevoSucursalId = entity.sucursal?.id;
        }

        if (data.nombre !== undefined) {
            data.nombre = nuevoNombre;
        }

        await this.validarNombreUnico(nuevoNombre, nuevoSucursalId, id);

        if (data.vendedor !== undefined) {
            const vendedorId = typeof data.vendedor === 'object' ? data.vendedor?.id : data.vendedor;
            if (vendedorId) {
                entity.vendedor = (await this.personalRepo.findOne({ where: { id: Number(vendedorId) } })) as any;
            } else {
                entity.vendedor = null as any;
            }
            delete data.vendedor;
        }

        const merged = this.repo.merge(entity, data);
        await this.repo.save(merged);

        if (Array.isArray(clienteIds)) {
            // Find all clients currently assigned to this ruta
            const currentClients = await this.clienteRepo.find({
                where: { ruta: { id } },
                relations: ['ruta']
            });

            const targetIds = clienteIds.map(Number);

            // Unassign clients not in targetIds
            for (const client of currentClients) {
                if (!targetIds.includes(client.id)) {
                    client.ruta = null as any;
                    await this.clienteRepo.save(client);
                }
            }

            // Assign new clients
            if (targetIds.length > 0) {
                const clientsToAssign = await this.clienteRepo.find({
                    where: { id: In(targetIds) }
                });
                for (const client of clientsToAssign) {
                    client.ruta = merged as any;
                    await this.clienteRepo.save(client);
                }
            }
        }

        return this.findOne(id);
    }

    async remove(id: number) {
        const p = await this.findOne(id);
        p.activo = false;
        return this.repo.save(p);
    }
}
