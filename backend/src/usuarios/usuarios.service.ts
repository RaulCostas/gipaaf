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
        try {
            const existeEmail = await this.repo.findOne({ where: { email: data.email } });
            if (existeEmail) throw new ConflictException('El correo electrónico ya está en uso');

            if (data.username) {
                const existeUsername = await this.repo.findOne({ where: { username: data.username } });
                if (existeUsername) throw new ConflictException('El nombre de usuario ya está en uso');
            }

            let persona = data.persona;
            if (persona) {
                if (persona.ci && String(persona.ci).trim()) {
                    const ciStr = String(persona.ci).trim();
                    const personaExistente = await this.personaRepo.findOne({
                        where: { ci: ciStr },
                        relations: ['usuario']
                    });

                    if (personaExistente) {
                        if (personaExistente.usuario) {
                            throw new ConflictException(`El C.I. ${ciStr} ya pertenece a otro usuario registrado (${personaExistente.usuario.username})`);
                        }
                        Object.assign(personaExistente, {
                            nombres: persona.nombres || personaExistente.nombres,
                            apellidos: persona.apellidos || personaExistente.apellidos,
                            telefono: persona.telefono || personaExistente.telefono,
                            direccion: persona.direccion || personaExistente.direccion,
                        });
                        persona = await this.personaRepo.save(personaExistente);
                    } else {
                        const newPersona = this.personaRepo.create(persona as object);
                        persona = await this.personaRepo.save(newPersona);
                    }
                } else {
                    const newPersona = this.personaRepo.create(persona as object);
                    persona = await this.personaRepo.save(newPersona);
                }
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
            return await this.repo.save(usuario);
        } catch (err: any) {
            if (err instanceof ConflictException || err instanceof NotFoundException) {
                throw err;
            }
            if (err.code === '23505') {
                if (err.detail?.includes('ci') || err.message?.includes('ci')) {
                    throw new ConflictException('El C.I. ingresado ya se encuentra registrado en el sistema');
                }
                if (err.detail?.includes('username') || err.message?.includes('username')) {
                    throw new ConflictException('El nombre de usuario ya está en uso');
                }
                if (err.detail?.includes('email') || err.message?.includes('email')) {
                    throw new ConflictException('El correo electrónico ya está en uso');
                }
                throw new ConflictException('Ya existe un registro con estos datos');
            }
            throw err;
        }
    }

    async update(id: number, data: any) {
        try {
            const usuario = await this.findOne(id);

            if (data.email && data.email !== usuario.email) {
                const existeEmail = await this.repo.findOne({ where: { email: data.email } });
                if (existeEmail && existeEmail.id !== id) {
                    throw new ConflictException('El correo electrónico ya está en uso');
                }
            }

            if (data.username && data.username !== usuario.username) {
                const existeUsername = await this.repo.findOne({ where: { username: data.username } });
                if (existeUsername && existeUsername.id !== id) {
                    throw new ConflictException('El nombre de usuario ya está en uso');
                }
            }

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
            return await this.repo.save(usuario);
        } catch (err: any) {
            if (err instanceof ConflictException || err instanceof NotFoundException) {
                throw err;
            }
            if (err.code === '23505') {
                if (err.detail?.includes('ci') || err.message?.includes('ci')) {
                    throw new ConflictException('El C.I. ingresado ya se encuentra registrado en el sistema');
                }
                if (err.detail?.includes('username') || err.message?.includes('username')) {
                    throw new ConflictException('El nombre de usuario ya está en uso');
                }
                if (err.detail?.includes('email') || err.message?.includes('email')) {
                    throw new ConflictException('El correo electrónico ya está en uso');
                }
                throw new ConflictException('Ya existe un registro con estos datos');
            }
            throw err;
        }
    }

    async remove(id: number) {
        const u = await this.findOne(id);
        return this.repo.softRemove(u);
    }
}
