import { Injectable, NotFoundException } from '@nestjs/common';
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
    create(data: Partial<Sucursal>) { return this.repo.save(this.repo.create(data)); }
    async update(id: number, data: Partial<Sucursal>) { await this.findOne(id); await this.repo.update(id, data); return this.findOne(id); }
    async remove(id: number) { 
        const s = await this.findOne(id); 
        s.activo = false; 
        return this.repo.save(s); 
    }
}
