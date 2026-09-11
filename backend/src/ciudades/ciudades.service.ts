import { Injectable, NotFoundException } from '@nestjs/common';
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

    create(data: Partial<Ciudad>) {
        return this.repo.save(this.repo.create(data));
    }

    async update(id: number, data: Partial<Ciudad>) {
        await this.findOne(id);
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        const c = await this.findOne(id);
        c.activo = false;
        return this.repo.save(c);
    }
}
