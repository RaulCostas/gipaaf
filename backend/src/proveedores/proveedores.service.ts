import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

    private async validarUnicidad(ruc?: string | null, empresa?: string | null, excludeProveedorId?: number): Promise<void> {
        if (ruc && ruc.trim()) {
            const rucLimpio = ruc.trim();
            const qb = this.repo.createQueryBuilder('proveedor')
                .where('LOWER(TRIM(proveedor.ruc)) = LOWER(:ruc)', { ruc: rucLimpio });

            if (excludeProveedorId) {
                qb.andWhere('proveedor.id != :excludeProveedorId', { excludeProveedorId });
            }

            const duplicado = await qb.select(['proveedor.id', 'proveedor.ruc', 'proveedor.empresa']).getOne();
            if (duplicado) {
                const nombreEmpresa = duplicado.empresa ? ` (Empresa: "${duplicado.empresa}")` : '';
                throw new BadRequestException(
                    `Ya existe un proveedor registrado con el NIT/RUC "${rucLimpio}"${nombreEmpresa}.`
                );
            }
        }

        if (empresa && empresa.trim()) {
            const empresaLimpia = empresa.trim();
            const qb = this.repo.createQueryBuilder('proveedor')
                .where('LOWER(TRIM(proveedor.empresa)) = LOWER(:empresa)', { empresa: empresaLimpia });

            if (excludeProveedorId) {
                qb.andWhere('proveedor.id != :excludeProveedorId', { excludeProveedorId });
            }

            const duplicado = await qb.select(['proveedor.id', 'proveedor.ruc', 'proveedor.empresa']).getOne();
            if (duplicado) {
                throw new BadRequestException(
                    `Ya existe un proveedor registrado con la empresa/razón social "${empresaLimpia}".`
                );
            }
        }
    }

    async create(data: any) {
        const ruc = data.ruc ? String(data.ruc).trim() : null;
        const empresa = data.empresa ? String(data.empresa).trim() : null;
        await this.validarUnicidad(ruc, empresa);

        const entity = this.repo.create({
            ...data,
            ruc,
            empresa
        } as any);
        return this.repo.save(entity);
    }

    async update(id: number, data: any) {
        const entity = await this.findOne(id);

        const nuevoRuc = data.ruc !== undefined ? (data.ruc ? String(data.ruc).trim() : null) : entity.ruc;
        const nuevaEmpresa = data.empresa !== undefined ? (data.empresa ? String(data.empresa).trim() : null) : entity.empresa;

        await this.validarUnicidad(nuevoRuc, nuevaEmpresa, id);

        if (data.ruc !== undefined) data.ruc = nuevoRuc;
        if (data.empresa !== undefined) data.empresa = nuevaEmpresa;

        const merged = this.repo.merge(entity, data as any);
        return this.repo.save(merged);
    }

    async remove(id: number) { const p = await this.findOne(id); return this.repo.softRemove(p); }
}
