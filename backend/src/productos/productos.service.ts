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
                UPDATE productos
                SET activo = false, "eliminadoEn" = NULL
                WHERE "eliminadoEn" IS NOT NULL;
            `);
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
                relations: ['linea', 'marca', 'grupo'],
                order: { nombre: 'ASC' }
            });
        }
        return this.repo.find({ 
            relations: ['linea', 'marca', 'grupo'],
            order: { nombre: 'ASC' }
        });
    }

    async findOne(id: number) {
        const p = await this.repo.findOne({ where: { id }, relations: ['linea', 'marca', 'grupo'] });
        if (!p) throw new NotFoundException(`Producto ${id} no encontrado`);
        return p;
    }

    async create(data: Partial<Producto>) {
        const createData: any = {
            codigo: data.codigo,
            nombre: data.nombre,
            descripcion: data.descripcion,
            precioCompra: data.precioCompra !== undefined && data.precioCompra !== null ? Number(data.precioCompra) : 0,
            precioVenta: data.precioVenta !== undefined && data.precioVenta !== null ? Number(data.precioVenta) : 0,
            unidadMedida: data.unidadMedida || 'UNIDAD',
            imagen: data.imagen || null,
            activo: data.activo !== undefined ? Boolean(data.activo) : true,
            lineaId: (data.lineaId || (data as any).categoriaId) ? Number(data.lineaId || (data as any).categoriaId) : null,
            marcaId: data.marcaId ? Number(data.marcaId) : null,
            grupoId: data.grupoId ? Number(data.grupoId) : null,
        };
        return this.repo.save(this.repo.create(createData));
    }

    async update(id: number, data: Partial<Producto>) {
        await this.findOne(id);

        const updateData: any = {};
        if (data.codigo !== undefined) updateData.codigo = data.codigo;
        if (data.nombre !== undefined) updateData.nombre = data.nombre;
        if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
        if (data.precioCompra !== undefined && data.precioCompra !== null) updateData.precioCompra = Number(data.precioCompra) || 0;
        if (data.precioVenta !== undefined && data.precioVenta !== null) updateData.precioVenta = Number(data.precioVenta) || 0;
        if (data.unidadMedida !== undefined) updateData.unidadMedida = data.unidadMedida;
        if (data.imagen !== undefined) updateData.imagen = data.imagen;
        if (data.activo !== undefined) updateData.activo = Boolean(data.activo);

        if (data.lineaId !== undefined || (data as any).categoriaId !== undefined) {
            const lId = data.lineaId || (data as any).categoriaId;
            updateData.lineaId = lId ? Number(lId) : null;
        }
        if (data.marcaId !== undefined) {
            updateData.marcaId = data.marcaId ? Number(data.marcaId) : null;
        }
        if (data.grupoId !== undefined) {
            updateData.grupoId = data.grupoId ? Number(data.grupoId) : null;
        }
        if (data.fechaUltimaCompra !== undefined) {
            updateData.fechaUltimaCompra = data.fechaUltimaCompra;
        }

        await this.repo.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number) {
        const p = await this.findOne(id);
        p.activo = false;
        return this.repo.save(p);
    }
}
