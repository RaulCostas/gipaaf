import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './persona.entity';

@Injectable()
export class PersonasService {
    constructor(
        @InjectRepository(Persona)
        private repo: Repository<Persona>,
    ) { }

    findAll() {
        return this.repo.find();
    }

    async findOne(id: number) {
        const persona = await this.repo.findOne({ where: { id } });
        if (!persona) throw new NotFoundException(`Persona ${id} no encontrada`);
        return persona;
    }

    create(data: Partial<Persona>) {
        const persona = this.repo.create(data);
        return this.repo.save(persona);
    }

    async update(id: number, data: Partial<Persona>) {
        await this.findOne(id);
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        const persona = await this.findOne(id);
        return this.repo.softRemove(persona);
    }
}
