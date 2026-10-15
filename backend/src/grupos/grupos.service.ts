import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  private async validarNombreUnico(nombre?: string | null, excludeId?: number): Promise<void> {
    if (!nombre || !nombre.trim()) {
      throw new BadRequestException('El nombre del grupo es obligatorio.');
    }

    const nombreLimpio = nombre.trim();
    const qb = this.repo.createQueryBuilder('grupo')
      .where('LOWER(TRIM(grupo.nombre)) = LOWER(:nombre)', { nombre: nombreLimpio });

    if (excludeId) {
      qb.andWhere('grupo.id != :excludeId', { excludeId });
    }

    const duplicado = await qb.select(['grupo.id', 'grupo.nombre']).getOne();
    if (duplicado) {
      throw new BadRequestException(`Ya existe un grupo registrado con el nombre "${nombreLimpio}".`);
    }
  }

  async create(data: Partial<Grupo>) {
    const nombre = data.nombre ? String(data.nombre).trim() : null;
    await this.validarNombreUnico(nombre);

    const entity = this.repo.create({
      ...data,
      nombre: nombre!
    });
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Grupo>) {
    const entity = await this.findOne(id);
    const { nombre, descripcion, activo } = data;
    if (nombre !== undefined) {
      const nuevoNombre = nombre ? String(nombre).trim() : null;
      await this.validarNombreUnico(nuevoNombre, id);
      entity.nombre = nuevoNombre!;
    }
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
