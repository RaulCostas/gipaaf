import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ciudad } from './ciudad.entity';

@Injectable()
export class CiudadesService {
    constructor(@InjectRepository(Ciudad) private repo: Repository<Ciudad>) { }

    findAll() {
        return this.repo.find({ order: { nombre: 'ASC' } });
    }

    async findOne(id: number) {
        const c = await this.repo.findOne({ where: { id } });
        if (!c) throw new NotFoundException(`Ciudad ${id} no encontrada`);
        return c;
    }

    async validarNombreUnico(nombre?: string, excludeId?: number) {
        if (!nombre || !nombre.trim()) return;
        const nombreLimpio = nombre.trim();
        const existing = await this.repo
            .createQueryBuilder('c')
            .where('LOWER(TRIM(c.nombre)) = LOWER(:nombre)', { nombre: nombreLimpio })
            .andWhere('c.eliminadoEn IS NULL')
            .getOne();

        if (existing && (!excludeId || existing.id !== Number(excludeId))) {
            throw new BadRequestException(`Ya existe una ciudad registrada con el nombre "${existing.nombre}".`);
        }
    }

    async create(data: Partial<Ciudad>) {
        if (data.nombre) {
            data.nombre = data.nombre.trim();
            await this.validarNombreUnico(data.nombre);
        }
        return this.repo.save(this.repo.create(data));
    }

    async update(id: number, data: Partial<Ciudad>) {
        await this.findOne(id);
        if (data.nombre) {
            data.nombre = data.nombre.trim();
            await this.validarNombreUnico(data.nombre, id);
        }
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        const c = await this.findOne(id);
        c.activo = false;
        return this.repo.save(c);
    }
}
