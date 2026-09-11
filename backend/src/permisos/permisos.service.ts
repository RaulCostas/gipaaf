import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from './permiso.entity';

@Injectable()
export class PermisosService {
    constructor(@InjectRepository(Permiso) private repo: Repository<Permiso>) { }
    findAll() { return this.repo.find({ order: { id: 'ASC' } }); }
    async findOne(id: number) {
        const p = await this.repo.findOne({ where: { id } });
        if (!p) throw new NotFoundException(`Permiso ${id} no encontrado`);
        return p;
    }
    create(data: Partial<Permiso>) { return this.repo.save(this.repo.create(data)); }
    async update(id: number, data: Partial<Permiso>) { await this.findOne(id); await this.repo.update(id, data); return this.findOne(id); }
    async remove(id: number) { const p = await this.findOne(id); return this.repo.remove(p); }
}
