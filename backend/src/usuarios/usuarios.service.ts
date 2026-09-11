import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './usuario.entity';
import { Persona } from '../personas/persona.entity';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private repo: Repository<Usuario>,
        @InjectRepository(Persona)
        private personaRepo: Repository<Persona>,
    ) { }

    findAll() {
        return this.repo.find();
    }

    async findOne(id: number) {
        const u = await this.repo.findOne({ where: { id } });
        if (!u) throw new NotFoundException(`Usuario ${id} no encontrado`);
        return u;
    }

    async create(data: any) {
        const existe = await this.repo.findOne({ where: { email: data.email } });
        if (existe) throw new ConflictException('El email ya está en uso');

        let persona = data.persona;
        if (persona) {
            const newPersona = this.personaRepo.create(persona as object);
            persona = await this.personaRepo.save(newPersona);
        }

        const hash = await bcrypt.hash(data.password, 10);
        let personal: any = null;
        if (data.personal?.id || (typeof data.personal === 'number' && data.personal > 0)) {
            personal = { id: Number(data.personal.id || data.personal) };
        }

        const usuario = this.repo.create({
            ...data,
            persona,
            personal: personal as any,
            password: hash,
        });
        return this.repo.save(usuario);
    }

    async update(id: number, data: any) {
        const usuario = await this.findOne(id);
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        if (data.persona) {
            if (usuario.persona) {
                Object.assign(usuario.persona, data.persona);
                await this.personaRepo.save(usuario.persona);
            } else {
                const newPersona = this.personaRepo.create(data.persona as object);
                usuario.persona = await this.personaRepo.save(newPersona);
            }
        }

        if (data.personal !== undefined) {
            if (data.personal?.id || (typeof data.personal === 'number' && data.personal > 0)) {
                usuario.personal = { id: Number(data.personal.id || data.personal) } as any;
            } else {
                usuario.personal = null as any;
            }
            delete data.personal;
        }

        const { persona, ...safeUserData } = data;
        Object.assign(usuario, safeUserData);
        return this.repo.save(usuario);
    }

    async remove(id: number) {
        const u = await this.findOne(id);
        return this.repo.softRemove(u);
    }
}
