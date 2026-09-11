import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';

@Injectable()
export class CategoriasService {
    constructor(@InjectRepository(Categoria) private repo: Repository<Categoria>) { }
    findAll() { return this.repo.find({ relations: ['subcategorias'], order: { nombre: 'ASC' } }); }
    async findOne(id: number) {
        const c = await this.repo.findOne({ where: { id }, relations: ['padre', 'subcategorias'] });
        if (!c) throw new NotFoundException(`Categoria ${id} no encontrada`);
        return c;
    }
    create(data: Partial<Categoria>) { return this.repo.save(this.repo.create(data)); }
    async update(id: number, data: Partial<Categoria>) {
        const c = await this.findOne(id);
        const { nombre, descripcion, activo, padre } = data;
        if (nombre !== undefined) c.nombre = nombre;
        if (descripcion !== undefined) c.descripcion = descripcion;
        if (activo !== undefined) c.activo = activo;
        if (padre !== undefined) c.padre = padre;
        return this.repo.save(c);
    }
    async remove(id: number) { 
        const c = await this.findOne(id); 
        c.activo = false; 
        return this.repo.save(c); 
    }
}
