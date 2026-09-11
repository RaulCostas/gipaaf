import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Egreso, MonedaEgreso } from './egreso.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Injectable()
export class EgresosService {
    constructor(
        @InjectRepository(Egreso)
        private repo: Repository<Egreso>,
        @InjectRepository(Sucursal)
        private sucursalRepo: Repository<Sucursal>,
    ) {}

    async findAll(): Promise<Egreso[]> {
        return this.repo.find({
            relations: ['sucursal', 'sucursal.ciudad', 'usuario'],
            order: { fecha: 'DESC', id: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Egreso> {
        const item = await this.repo.findOne({
            where: { id },
            relations: ['sucursal', 'sucursal.ciudad', 'usuario'],
        });
        if (!item) throw new NotFoundException(`Egreso #${id} no encontrado`);
        return item;
    }

    private async generateCodigo(): Promise<string> {
        const count = await this.repo.count();
        const nextNum = count + 1;
        const formatted = nextNum.toString().padStart(5, '0');
        let code = `EGR-${formatted}`;

        const existing = await this.repo.findOne({ where: { codigo: code } });
        if (existing) {
            code = `EGR-${Date.now().toString().slice(-6)}`;
        }
        return code;
    }

    async create(data: Partial<Egreso>): Promise<Egreso> {
        if (!data.codigo) {
            data.codigo = await this.generateCodigo();
        }
        if (!data.fecha) {
            data.fecha = new Date().toISOString().substring(0, 10);
        }

        const monto = Number(data.monto || 0);
        const tipoCambio = Number(data.tipoCambio || 6.96);
        const moneda = data.moneda || MonedaEgreso.BOB;

        if (moneda === MonedaEgreso.USD) {
            data.montoEquivalente = Number((monto * tipoCambio).toFixed(2));
        } else {
            data.montoEquivalente = Number((monto / (tipoCambio || 6.96)).toFixed(2));
        }

        const sucursalId = (data as any).sucursalId;
        if (sucursalId && !data.sucursal) {
            data.sucursal = (await this.sucursalRepo.findOne({ where: { id: sucursalId } })) || undefined;
        }

        const egreso = this.repo.create(data);
        return this.repo.save(egreso);
    }

    async update(id: number, data: Partial<Egreso>): Promise<Egreso> {
        const existing = await this.findOne(id);

        if (data.monto !== undefined || data.tipoCambio !== undefined || data.moneda !== undefined) {
            const monto = Number(data.monto !== undefined ? data.monto : existing.monto);
            const tipoCambio = Number(data.tipoCambio !== undefined ? data.tipoCambio : existing.tipoCambio);
            const moneda = data.moneda || existing.moneda;

            if (moneda === MonedaEgreso.USD) {
                data.montoEquivalente = Number((monto * tipoCambio).toFixed(2));
            } else {
                data.montoEquivalente = Number((monto / (tipoCambio || 6.96)).toFixed(2));
            }
        }

        const sucursalId = (data as any).sucursalId;
        if (sucursalId) {
            data.sucursal = (await this.sucursalRepo.findOne({ where: { id: sucursalId } })) || undefined;
        }

        await this.repo.save({ ...existing, ...data });
        return this.findOne(id);
    }

    async anular(id: number): Promise<Egreso> {
        const item = await this.findOne(id);
        item.activo = false;
        return this.repo.save(item);
    }

    async remove(id: number): Promise<Egreso> {
        const item = await this.findOne(id);
        item.activo = false;
        return this.repo.save(item);
    }
}
