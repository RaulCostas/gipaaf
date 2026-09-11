import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grupo } from './grupo.entity';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(Grupo)
    private readonly repo: Repository<Grupo>,
  ) {}

  async findAll() {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Grupo no encontrado');
    return entity;
  }

  async create(data: Partial<Grupo>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Grupo>) {
    const entity = await this.findOne(id);
    const { nombre, descripcion, activo } = data;
    if (nombre !== undefined) entity.nombre = nombre;
    if (descripcion !== undefined) entity.descripcion = descripcion;
    if (activo !== undefined) entity.activo = activo;
    return this.repo.save(entity);
  }

  async remove(id: number) {
    const entity = await this.findOne(id);
    entity.activo = false;
    return this.repo.save(entity);
  }
}
