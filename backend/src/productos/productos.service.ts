import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Producto } from './producto.entity';

@Injectable()
export class ProductosService implements OnModuleInit {
    constructor(@InjectRepository(Producto) private repo: Repository<Producto>) { }

    async onModuleInit() {
        try {
            await this.repo.query(`
                UPDATE productos p
                SET "fechaUltimaCompra" = sub.max_fecha
                FROM (
                    SELECT dn."productoId", MAX(n.fecha) as max_fecha
                    FROM detalle_notas dn
                    JOIN notas n ON n.id = dn."notaId"
                    WHERE n.tipo = 'COMPRA' AND n.estado = 'CONFIRMADA'
                    GROUP BY dn."productoId"
                ) sub
                WHERE p.id = sub."productoId" AND p."fechaUltimaCompra" IS NULL;
            `);
        } catch (e) {
            // Ignored if column or table not ready during first bootstrap
        }
    }

    findAll(search?: string) {
        if (search) {
            return this.repo.find({
                where: [{ nombre: ILike(`%${search}%`) }, { codigo: ILike(`%${search}%`) }],
                relations: ['categoria', 'marca', 'grupo'],
            });
        }
        return this.repo.find({ relations: ['categoria', 'marca', 'grupo'] });
    }

    async findOne(id: number) {
        const p = await this.repo.findOne({ where: { id }, relations: ['categoria', 'marca', 'grupo'] });
        if (!p) throw new NotFoundException(`Producto ${id} no encontrado`);
        return p;
    }

    async create(data: Partial<Producto>) {
        return this.repo.save(this.repo.create(data));
    }

    async update(id: number, data: Partial<Producto>) {
        await this.findOne(id);
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        const p = await this.findOne(id);
        return this.repo.softRemove(p);
    }
}
