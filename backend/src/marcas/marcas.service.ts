import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marca } from './marca.entity';

@Injectable()
export class MarcasService {
  constructor(
    @InjectRepository(Marca)
    private readonly repo: Repository<Marca>,
  ) {}

  async findAll() {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Marca no encontrada');
    return entity;
  }

  async create(data: Partial<Marca>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Marca>) {
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
