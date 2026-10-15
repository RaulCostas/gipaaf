import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from './sucursal.entity';

@Injectable()
export class SucursalesService {
    constructor(@InjectRepository(Sucursal) private repo: Repository<Sucursal>) { }
    findAll() { return this.repo.find({ order: { nombre: 'ASC' } }); }
    async findOne(id: number) {
        const s = await this.repo.findOne({ where: { id } });
        if (!s) throw new NotFoundException(`Sucursal ${id} no encontrada`);
        return s;
    }

    async validarNombreUnico(nombre?: string, excludeId?: number) {
        if (!nombre || !nombre.trim()) return;
        const nombreLimpio = nombre.trim();
        const existing = await this.repo
            .createQueryBuilder('s')
            .where('LOWER(TRIM(s.nombre)) = LOWER(:nombre)', { nombre: nombreLimpio })
            .andWhere('s.eliminadoEn IS NULL')
            .getOne();

        if (existing && (!excludeId || existing.id !== Number(excludeId))) {
            throw new BadRequestException(`Ya existe una sucursal registrada con el nombre "${existing.nombre}".`);
        }
    }

    async create(data: Partial<Sucursal>) {
        if (data.nombre) {
            data.nombre = data.nombre.trim();
            await this.validarNombreUnico(data.nombre);
        }
        return this.repo.save(this.repo.create(data));
    }

    async update(id: number, data: Partial<Sucursal>) {
        await this.findOne(id);
        if (data.nombre) {
            data.nombre = data.nombre.trim();
            await this.validarNombreUnico(data.nombre, id);
        }
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) { 
        const s = await this.findOne(id); 
        s.activo = false; 
        return this.repo.save(s); 
    }
}
