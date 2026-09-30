import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Linea } from './linea.entity';

@Injectable()
export class LineasService {
    constructor(@InjectRepository(Linea) private repo: Repository<Linea>) { }
    findAll() { return this.repo.find({ relations: ['sublineas'], order: { nombre: 'ASC' } }); }
    async findOne(id: number) {
        const l = await this.repo.findOne({ where: { id }, relations: ['padre', 'sublineas'] });
        if (!l) throw new NotFoundException(`Línea ${id} no encontrada`);
        return l;
    }
    create(data: Partial<Linea>) { return this.repo.save(this.repo.create(data)); }
    async update(id: number, data: Partial<Linea>) {
        const l = await this.findOne(id);
        const { nombre, descripcion, activo, padre } = data;
        if (nombre !== undefined) l.nombre = nombre;
        if (descripcion !== undefined) l.descripcion = descripcion;
        if (activo !== undefined) l.activo = activo;
        if (padre !== undefined) l.padre = padre;
        return this.repo.save(l);
    }
    async remove(id: number) { 
        const l = await this.findOne(id); 
        l.activo = false; 
        return this.repo.save(l); 
    }
}
