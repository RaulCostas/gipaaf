import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  private async validarNombreUnico(nombre?: string | null, excludeId?: number): Promise<void> {
    if (!nombre || !nombre.trim()) {
      throw new BadRequestException('El nombre de la marca es obligatorio.');
    }

    const nombreLimpio = nombre.trim();
    const qb = this.repo.createQueryBuilder('marca')
      .where('LOWER(TRIM(marca.nombre)) = LOWER(:nombre)', { nombre: nombreLimpio });

    if (excludeId) {
      qb.andWhere('marca.id != :excludeId', { excludeId });
    }

    const duplicado = await qb.select(['marca.id', 'marca.nombre']).getOne();
    if (duplicado) {
      throw new BadRequestException(`Ya existe una marca registrada con el nombre "${nombreLimpio}".`);
    }
  }

  async create(data: Partial<Marca>) {
    const nombre = data.nombre ? String(data.nombre).trim() : null;
    await this.validarNombreUnico(nombre);

    const entity = this.repo.create({
      ...data,
      nombre: nombre!
    });
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Marca>) {
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
