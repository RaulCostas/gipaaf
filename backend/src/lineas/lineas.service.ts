import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Linea } from './linea.entity';

@Injectable()
export class LineasService {
    constructor(@InjectRepository(Linea) private repo: Repository<Linea>) { }

    findAll() { return this.repo.find({ relations: ['sublineas'], order: { nombre: 'ASC' } }); }

    async findOne(id: number) {
        const l = await this.repo.findOne({ where: { id }, relations: ['padre', 'sublineas'] });
        if (!l) throw new NotFoundException(`Línea ${id} no encontrada`);
        return l;
    }

    private async validarNombreUnico(nombre?: string | null, excludeId?: number): Promise<void> {
        if (!nombre || !nombre.trim()) {
            throw new BadRequestException('El nombre de la línea es obligatorio.');
        }

        const nombreLimpio = nombre.trim();
        const qb = this.repo.createQueryBuilder('linea')
            .where('LOWER(TRIM(linea.nombre)) = LOWER(:nombre)', { nombre: nombreLimpio });

        if (excludeId) {
            qb.andWhere('linea.id != :excludeId', { excludeId });
        }

        const duplicado = await qb.select(['linea.id', 'linea.nombre']).getOne();
        if (duplicado) {
            throw new BadRequestException(`Ya existe una línea registrada con el nombre "${nombreLimpio}".`);
        }
    }

    async create(data: Partial<Linea>) {
        const nombre = data.nombre ? String(data.nombre).trim() : null;
        await this.validarNombreUnico(nombre);

        return this.repo.save(this.repo.create({ ...data, nombre: nombre! }));
    }

    async update(id: number, data: Partial<Linea>) {
        const l = await this.findOne(id);
        const { nombre, descripcion, activo, padre } = data;
        if (nombre !== undefined) {
            const nuevoNombre = nombre ? String(nombre).trim() : null;
            await this.validarNombreUnico(nuevoNombre, id);
            l.nombre = nuevoNombre!;
        }
        if (descripcion !== undefined) l.descripcion = descripcion;
        if (activo !== undefined) l.activo = activo;
        if (padre !== undefined) l.padre = padre;
        return this.repo.save(l);
    }

    async remove(id: number) { 
        const l = await this.findOne(id); 
        l.activo = false; 
        return this.repo.save(l); 
    }
}
