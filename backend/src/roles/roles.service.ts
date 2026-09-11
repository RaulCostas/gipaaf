import { Injectable, NotFoundException } from '@nestjs/common';
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
    create(data: Partial<Rol>) { return this.repo.save(this.repo.create(data)); }
    async update(id: number, data: Partial<Rol>) {
        const rol = await this.findOne(id);
        Object.assign(rol, data);
        return this.repo.save(rol);
    }
    async remove(id: number) { const r = await this.findOne(id); return this.repo.remove(r); }
}
