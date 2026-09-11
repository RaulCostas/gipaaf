import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Proveedor } from './proveedor.entity';

@Injectable()
export class ProveedoresService {
    constructor(@InjectRepository(Proveedor) private repo: Repository<Proveedor>) { }

    findAll(search?: string) {
        if (search) {
            return this.repo.find({
                where: [
                    { persona: { nombres: Like(`%${search}%`) } },
                    { empresa: Like(`%${search}%`) },
                    { ruc: Like(`%${search}%`) },
                ],
            });
        }
        return this.repo.find({ where: { activo: true } });
    }

    async findOne(id: number) {
        const p = await this.repo.findOne({ where: { id } });
        if (!p) throw new NotFoundException(`Proveedor ${id} no encontrado`);
        return p;
    }

    create(data: Partial<Proveedor>) { return this.repo.save(this.repo.create(data)); }
    async update(id: number, data: Partial<Proveedor>) { const entity = await this.findOne(id); const merged = this.repo.merge(entity, data as any); return this.repo.save(merged); }
    async remove(id: number) { const p = await this.findOne(id); return this.repo.softRemove(p); }
}
