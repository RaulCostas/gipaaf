import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personal } from './personal.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Injectable()
export class PersonalService {
    constructor(
        @InjectRepository(Personal) private repo: Repository<Personal>,
        @InjectRepository(Sucursal) private sucursalRepo: Repository<Sucursal>
    ) {}
    
    findAll() {
        return this.repo.find({ relations: ['sucursal', 'sucursal.ciudad'] });
    }
    
    async findOne(id: number) {
        const personal = await this.repo.findOne({ 
            where: { id },
            relations: ['sucursal', 'sucursal.ciudad'] 
        });
        if (!personal) throw new NotFoundException('Personal no encontrado');
        return personal;
    }
    
    async create(data: any) {
        let sucursalEntity: Sucursal | null = null;
        const sucursalId = typeof data.sucursal === 'object' ? data.sucursal?.id : data.sucursal;
        if (sucursalId) {
            sucursalEntity = await this.sucursalRepo.findOne({ where: { id: Number(sucursalId) } });
        }
        
        const personal = this.repo.create({
            ...data,
            sucursal: sucursalEntity as any
        });
        return this.repo.save(personal);
    }
    
    async update(id: number, data: any) {
        const entity = await this.findOne(id);
        
        if (data.sucursal !== undefined) {
            const sucursalId = typeof data.sucursal === 'object' ? data.sucursal?.id : data.sucursal;
            if (sucursalId) {
                entity.sucursal = (await this.sucursalRepo.findOne({ where: { id: Number(sucursalId) } })) as any;
            } else {
                entity.sucursal = null as any;
            }
            delete data.sucursal;
        }
        
        const merged = this.repo.merge(entity, data);
        return this.repo.save(merged);
    }
    
    async remove(id: number, data?: { fechaBaja?: any; motivoBaja?: string }) {
        const p = await this.findOne(id);
        p.activo = false;
        if (data?.fechaBaja) {
            p.fechaBaja = data.fechaBaja;
        } else if (!p.fechaBaja) {
            p.fechaBaja = new Date();
        }
        if (data?.motivoBaja) {
            p.motivoBaja = data.motivoBaja;
        }
        return this.repo.save(p);
    }
}
