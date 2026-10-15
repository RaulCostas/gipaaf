import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './rol.entity';

@Injectable()
export class RolesService {
    constructor(@InjectRepository(Rol) private repo: Repository<Rol>) { }
    findAll() { return this.repo.find(); }
    async findOne(id: number) {
        const r = await this.repo.findOne({ where: { id } });
        if (!r) throw new NotFoundException(`Rol ${id} no encontrado`);
        return r;
    }

    async validarNombreUnico(nombre?: string, excludeId?: number) {
        if (!nombre || !nombre.trim()) return;
        const nombreLimpio = nombre.trim();
        const existing = await this.repo
            .createQueryBuilder('r')
            .where('LOWER(TRIM(r.nombre)) = LOWER(:nombre)', { nombre: nombreLimpio })
            .getOne();

        if (existing && (!excludeId || existing.id !== Number(excludeId))) {
            throw new BadRequestException(`Ya existe un rol de seguridad registrado con el nombre "${existing.nombre}".`);
        }
    }

    async create(data: Partial<Rol>) {
        if (data.nombre) {
            data.nombre = data.nombre.trim().toUpperCase();
            await this.validarNombreUnico(data.nombre);
        }
        return this.repo.save(this.repo.create(data));
    }

    async update(id: number, data: Partial<Rol>) {
        const rol = await this.findOne(id);
        if (data.nombre !== undefined) {
            const nombreLimpio = data.nombre.trim().toUpperCase();
            await this.validarNombreUnico(nombreLimpio, id);
            rol.nombre = nombreLimpio;
        }
        if (data.descripcion !== undefined) rol.descripcion = data.descripcion;
        if (data.activo !== undefined) rol.activo = data.activo;
        if (data.permisos !== undefined) rol.permisos = data.permisos as any;
        return this.repo.save(rol);
    }

    async remove(id: number) { const r = await this.findOne(id); return this.repo.remove(r); }
}
