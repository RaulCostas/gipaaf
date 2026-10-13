import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { Inventario } from './inventario.entity';
import { Lote } from './lote.entity';
import { MovimientosInventarioService } from '../movimientos-inventario/movimientos.service';

@Injectable()
export class InventarioService implements OnModuleInit {
    constructor(
        @InjectRepository(Inventario) private repo: Repository<Inventario>,
        @InjectRepository(Lote) private loteRepo: Repository<Lote>,
        private movimientosService: MovimientosInventarioService
    ) { }

    async onModuleInit() {
        try {
            // Migración automática de datos existentes desde almacenes a sucursales
            await this.repo.query(`
                DO $$
                BEGIN
                    -- 1. Migrar inventario si existe columna almacenId
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario' AND column_name='almacenId') THEN
                        UPDATE inventario i
                        SET "sucursalId" = a."sucursalId"
                        FROM almacenes a
                        WHERE i."almacenId" = a.id AND i."sucursalId" IS NULL;
                    END IF;

                    -- 2. Migrar lotes si existe columna almacenId
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lotes' AND column_name='almacenId') THEN
                        UPDATE lotes l
                        SET "sucursalId" = a."sucursalId"
                        FROM almacenes a
                        WHERE l."almacenId" = a.id AND l."sucursalId" IS NULL;
                    END IF;

                    -- 3. Migrar traspasos si existen columnas almacenOrigenId / almacenDestinoId
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='traspasos' AND column_name='almacenOrigenId') THEN
                        UPDATE traspasos t
                        SET "sucursalOrigenId" = COALESCE(a1."sucursalId", t."sucursalOrigenId"),
                            "sucursalDestinoId" = COALESCE(a2."sucursalId", t."sucursalDestinoId")
                        FROM almacenes a1, almacenes a2
                        WHERE t."almacenOrigenId" = a1.id AND t."almacenDestinoId" = a2.id;
                    END IF;
                END $$;
            `);
        } catch (error) {
            console.error('Error during schema/data migration from almacenes to sucursales:', error);
        }

        // 4. Auto-reconciliación: Asegurar que todo stock en inventario tenga lotes disponibles
        try {
            const inventariosConStock = await this.repo.find({
                where: { stockActual: MoreThan(0) },
                relations: ['producto', 'sucursal']
            });

            for (const inv of inventariosConStock) {
                if (!inv.producto || !inv.sucursal) continue;

                // Primero asignar lotes sin sucursal de este producto si existen
                const lotesSinSucursal = await this.loteRepo.find({
                    where: { producto: { id: inv.producto.id }, sucursal: IsNull(), cantidadActual: MoreThan(0) }
                });
                for (const lss of lotesSinSucursal) {
                    lss.sucursal = inv.sucursal;
                    await this.loteRepo.save(lss);
                }

                const totalLotesRes = await this.loteRepo.createQueryBuilder('l')
                    .select('COALESCE(SUM(l.cantidadActual), 0)', 'total')
                    .where('l.productoId = :prodId', { prodId: inv.producto.id })
                    .andWhere('(l.sucursalId = :sucId OR l.sucursalId IS NULL)', { sucId: inv.sucursal.id })
                    .getRawOne();
                const totalLotes = Number(totalLotesRes?.total || 0);
                const faltante = Number(inv.stockActual) - totalLotes;

                if (faltante > 0) {
                    const nuevoLote = this.loteRepo.create({
                        numeroLote: `L-INICIAL-${inv.producto.codigo || inv.producto.id}`,
                        producto: inv.producto,
                        sucursal: inv.sucursal,
                        cantidadInicial: faltante,
                        cantidadActual: faltante,
                        costoUnitario: Number(inv.precioCompra) || Number(inv.producto.precioCompra) || 0,
                        fechaIngreso: new Date()
                    });
                    await this.loteRepo.save(nuevoLote);
                }
            }

            // 5. Sincronización de costos: Asignar precioCompra del producto a lotes que no tengan costoUnitario asignado
            await this.loteRepo.query(`
                UPDATE lotes l 
                SET "costoUnitario" = p."precioCompra" 
                FROM productos p 
                WHERE l."productoId" = p.id 
                  AND (l."costoUnitario" IS NULL OR l."costoUnitario" = 0)
                  AND p."precioCompra" > 0;
            `);
        } catch (error) {
            console.error('Error reconciliando lotes con inventario:', error);
        }
    }

    async findAll() { 
        const inventarios = await this.repo.find({ 
            relations: ['producto', 'producto.linea', 'producto.marca', 'producto.grupo', 'sucursal', 'sucursal.ciudad'] 
        }); 

        const lotes = await this.loteRepo.find({
            where: { cantidadActual: MoreThan(0) },
            relations: ['producto', 'sucursal'],
            order: { 
                fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                fechaIngreso: 'ASC' 
            }
        });

        return inventarios
            .filter(inv => inv.producto != null)
            .map(inv => {
                const itemLotes = lotes.filter(l => 
                    l.producto?.id === inv.producto?.id && 
                    (!inv.sucursal || !l.sucursal || l.sucursal.id === inv.sucursal.id)
                );
                return {
                    ...inv,
                    lotes: itemLotes
                };
            });
    }

    async findBySucursal(sucursalId: number) {
        const inventarios = await this.repo.find({ 
            where: { sucursal: { id: sucursalId } },
            relations: ['producto', 'producto.linea', 'producto.marca', 'producto.grupo', 'sucursal', 'sucursal.ciudad']
        });
        const lotes = await this.loteRepo.find({
            where: { sucursal: { id: sucursalId }, cantidadActual: MoreThan(0) },
            relations: ['producto', 'sucursal'],
            order: { 
                fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                fechaIngreso: 'ASC' 
            }
        });
        return inventarios
            .filter(inv => inv.producto != null)
            .map(inv => {
                const itemLotes = lotes.filter(l => l.producto?.id === inv.producto?.id);
                return {
                    ...inv,
                    lotes: itemLotes
                };
            });
    }

    findByAlmacen(id: number) {
        return this.findBySucursal(id);
    }

    async findByProducto(productoId: number) {
        const inventarios = await this.repo.find({ 
            where: { producto: { id: productoId } },
            relations: ['producto', 'producto.linea', 'producto.marca', 'producto.grupo', 'sucursal', 'sucursal.ciudad']
        });
        const lotes = await this.loteRepo.find({
            where: { producto: { id: productoId }, cantidadActual: MoreThan(0) },
            relations: ['producto', 'sucursal'],
            order: { 
                fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                fechaIngreso: 'ASC' 
            }
        });
        return inventarios.map(inv => {
            const itemLotes = lotes.filter(l => !inv.sucursal || !l.sucursal || l.sucursal.id === inv.sucursal.id);
            return {
                ...inv,
                lotes: itemLotes
            };
        });
    }

    async findLotes(productoId?: number, sucursalId?: number) {
        const where: any = { cantidadActual: MoreThan(0) };
        if (productoId) where.producto = { id: productoId };
        if (sucursalId) where.sucursal = { id: sucursalId };
        return this.loteRepo.find({
            where,
            relations: ['producto', 'sucursal'],
            order: { 
                fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                fechaIngreso: 'ASC' 
            }
        });
    }

    async findOne(id: number) {
        const inv = await this.repo.findOne({ 
            where: { id },
            relations: ['producto', 'producto.linea', 'producto.marca', 'producto.grupo', 'sucursal', 'sucursal.ciudad']
        });
        if (!inv) throw new NotFoundException(`Inventario ${id} no encontrado`);
        const lotes = await this.loteRepo.find({
            where: { 
                producto: { id: inv.producto?.id },
                sucursal: inv.sucursal ? { id: inv.sucursal.id } : undefined,
                cantidadActual: MoreThan(0)
            },
            relations: ['producto', 'sucursal'],
            order: { 
                fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any,
                fechaIngreso: 'ASC' 
            }
        });
        return {
            ...inv,
            lotes
        };
    }

    create(data: Partial<Inventario>) { return this.repo.save(this.repo.create(data)); }

    async update(id: number, data: Partial<Inventario>) {
        await this.findOne(id);
        const { stockMinimo, stockMaximo, stockActual, precioCompra, precioVenta } = data as any;
        const updateData: any = {};
        if (stockMinimo !== undefined) updateData.stockMinimo = Number(stockMinimo);
        if (stockMaximo !== undefined) updateData.stockMaximo = Number(stockMaximo);
        if (stockActual !== undefined) updateData.stockActual = Number(stockActual);
        if (precioCompra !== undefined) updateData.precioCompra = Number(precioCompra);
        if (precioVenta !== undefined) updateData.precioVenta = Number(precioVenta);

        await this.repo.update(id, updateData);
        return this.findOne(id);
    }

    async ajustarStock(id: number, cantidad: number, usuarioId?: number, observaciones?: string) {
        const inv = await this.findOne(id);
        inv.stockActual = Number(inv.stockActual) + cantidad;
        const saved = await this.repo.save(inv);

        // Si se agregó stock positivo, registrar lote de ajuste
        if (cantidad > 0) {
            const autoLote = this.loteRepo.create({
                numeroLote: `L-AJUSTE-${inv.producto?.codigo || inv.producto?.id || 'GEN'}`,
                producto: inv.producto,
                sucursal: inv.sucursal,
                cantidadInicial: cantidad,
                cantidadActual: cantidad,
                costoUnitario: Number(inv.precioCompra) || Number(inv.producto?.precioCompra) || 0,
                fechaIngreso: new Date()
            });
            await this.loteRepo.save(autoLote);
        } else if (cantidad < 0) {
            // Descontar de lotes existentes
            let porDescontar = Math.abs(cantidad);
            const lotes = await this.loteRepo.find({
                where: { producto: { id: inv.producto?.id }, sucursal: inv.sucursal ? { id: inv.sucursal.id } : undefined, cantidadActual: MoreThan(0) },
                order: { fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any, fechaIngreso: 'ASC' }
            });
            for (const l of lotes) {
                if (porDescontar <= 0) break;
                const disp = Number(l.cantidadActual);
                const desc = Math.min(disp, porDescontar);
                l.cantidadActual = disp - desc;
                await this.loteRepo.save(l);
                porDescontar -= desc;
            }
        }

        // Registrar movimiento
        await this.movimientosService.create({
            inventario: saved,
            tipo: 'AJUSTE',
            cantidad: cantidad,
            motivo: observaciones || 'Ajuste Manual',
            usuario: usuarioId ? { id: usuarioId } as any : undefined
        });

        return saved;
    }

    async registrarMerma(id: number, cantidad: number, usuarioId?: number, motivo?: string, observaciones?: string) {
        const inv = await this.findOne(id);
        const cantMerma = Math.abs(Number(cantidad));
        if (cantMerma <= 0) {
            throw new BadRequestException('La cantidad de merma debe ser mayor a 0');
        }

        const stockDisponible = Number(inv.stockActual);
        if (cantMerma > stockDisponible) {
            throw new BadRequestException(`La cantidad de merma (${cantMerma}) supera el stock actual disponible (${stockDisponible})`);
        }

        inv.stockActual = Math.max(0, stockDisponible - cantMerma);
        const saved = await this.repo.save(inv);

        // Descontar de lotes existentes (FIFO)
        let porDescontar = cantMerma;
        const lotes = await this.loteRepo.find({
            where: { producto: { id: inv.producto?.id }, sucursal: inv.sucursal ? { id: inv.sucursal.id } : undefined, cantidadActual: MoreThan(0) },
            order: { fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any, fechaIngreso: 'ASC' }
        });
        for (const l of lotes) {
            if (porDescontar <= 0) break;
            const disp = Number(l.cantidadActual);
            const desc = Math.min(disp, porDescontar);
            l.cantidadActual = disp - desc;
            await this.loteRepo.save(l);
            porDescontar -= desc;
        }

        const costo = Number(inv.precioCompra) || Number(inv.producto?.precioCompra) || 0;

        // Registrar movimiento con tipo 'MERMA'
        await this.movimientosService.create({
            inventario: saved,
            tipo: 'MERMA',
            cantidad: -cantMerma,
            motivo: motivo || 'Merma de Producto',
            observaciones: observaciones || undefined,
            costoUnitario: costo,
            usuario: usuarioId ? { id: usuarioId } as any : undefined
        });

        return saved;
    }

    async remove(id: number) { const i = await this.findOne(id); return this.repo.remove(i); }

    async getInventarioAlmacen(sucursalId?: number, ciudadId?: number, fechaCorte?: string) {
        // Local today date string (YYYY-MM-DD)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const isPast = Boolean(fechaCorte && fechaCorte.trim() < todayStr);
        // If fechaCorte is in the past, subtract movements that occurred after that day's 23:59:59.
        // If fechaCorte is today or future, do not subtract any movements (stockActual is already live).
        const cutoffTimestamp = isPast ? `${fechaCorte!.trim()} 23:59:59.999` : '2099-12-31 23:59:59.999';

        let query = '';
        let params: any[] = [];

        if (sucursalId) {
            query = `
                SELECT 
                    p.id as "productoId",
                    p.codigo,
                    p.nombre,
                    p."unidadMedida",
                    p."precioVenta",
                    p."precioCompra",
                    COALESCE(m.nombre, '-') as marca,
                    COALESCE(l.nombre, '-') as linea,
                    COALESCE(g.nombre, '-') as grupo,
                    COALESCE(SUM(i."stockActual"), 0) as "stockActualHoy",
                    COALESCE(SUM(mov.total_movs), 0) as "movimientosDespues",
                    (COALESCE(SUM(i."stockActual"), 0) - COALESCE(SUM(mov.total_movs), 0)) as "stockCorte"
                FROM productos p
                LEFT JOIN marcas m ON p."marcaId" = m.id
                LEFT JOIN lineas l ON p."lineaId" = l.id
                LEFT JOIN grupos g ON p."grupoId" = g.id
                LEFT JOIN inventario i ON i."productoId" = p.id AND i."sucursalId" = $2
                LEFT JOIN (
                    SELECT "inventarioId", SUM(cantidad) as total_movs
                    FROM movimientos_inventario
                    WHERE "creadoEn" > $1::timestamp
                    GROUP BY "inventarioId"
                ) mov ON mov."inventarioId" = i.id
                WHERE p.activo = true AND p."eliminadoEn" IS NULL
                GROUP BY p.id, p.codigo, p.nombre, p."unidadMedida", p."precioVenta", p."precioCompra", m.nombre, l.nombre, g.nombre
                ORDER BY p.nombre ASC
            `;
            params = [cutoffTimestamp, sucursalId];
        } else if (ciudadId) {
            query = `
                SELECT 
                    p.id as "productoId",
                    p.codigo,
                    p.nombre,
                    p."unidadMedida",
                    p."precioVenta",
                    p."precioCompra",
                    COALESCE(m.nombre, '-') as marca,
                    COALESCE(l.nombre, '-') as linea,
                    COALESCE(g.nombre, '-') as grupo,
                    COALESCE(SUM(i."stockActual"), 0) as "stockActualHoy",
                    COALESCE(SUM(mov.total_movs), 0) as "movimientosDespues",
                    (COALESCE(SUM(i."stockActual"), 0) - COALESCE(SUM(mov.total_movs), 0)) as "stockCorte"
                FROM productos p
                LEFT JOIN marcas m ON p."marcaId" = m.id
                LEFT JOIN lineas l ON p."lineaId" = l.id
                LEFT JOIN grupos g ON p."grupoId" = g.id
                LEFT JOIN (
                    SELECT inv.* 
                    FROM inventario inv 
                    INNER JOIN sucursales suc ON inv."sucursalId" = suc.id 
                    WHERE suc."ciudadId" = $2
                ) i ON i."productoId" = p.id
                LEFT JOIN (
                    SELECT "inventarioId", SUM(cantidad) as total_movs
                    FROM movimientos_inventario
                    WHERE "creadoEn" > $1::timestamp
                    GROUP BY "inventarioId"
                ) mov ON mov."inventarioId" = i.id
                WHERE p.activo = true AND p."eliminadoEn" IS NULL
                GROUP BY p.id, p.codigo, p.nombre, p."unidadMedida", p."precioVenta", p."precioCompra", m.nombre, l.nombre, g.nombre
                ORDER BY p.nombre ASC
            `;
            params = [cutoffTimestamp, ciudadId];
        } else {
            query = `
                SELECT 
                    p.id as "productoId",
                    p.codigo,
                    p.nombre,
                    p."unidadMedida",
                    p."precioVenta",
                    p."precioCompra",
                    COALESCE(m.nombre, '-') as marca,
                    COALESCE(l.nombre, '-') as linea,
                    COALESCE(g.nombre, '-') as grupo,
                    COALESCE(SUM(i."stockActual"), 0) as "stockActualHoy",
                    COALESCE(SUM(mov.total_movs), 0) as "movimientosDespues",
                    (COALESCE(SUM(i."stockActual"), 0) - COALESCE(SUM(mov.total_movs), 0)) as "stockCorte"
                FROM productos p
                LEFT JOIN marcas m ON p."marcaId" = m.id
                LEFT JOIN lineas l ON p."lineaId" = l.id
                LEFT JOIN grupos g ON p."grupoId" = g.id
                LEFT JOIN inventario i ON i."productoId" = p.id
                LEFT JOIN (
                    SELECT "inventarioId", SUM(cantidad) as total_movs
                    FROM movimientos_inventario
                    WHERE "creadoEn" > $1::timestamp
                    GROUP BY "inventarioId"
                ) mov ON mov."inventarioId" = i.id
                WHERE p.activo = true AND p."eliminadoEn" IS NULL
                GROUP BY p.id, p.codigo, p.nombre, p."unidadMedida", p."precioVenta", p."precioCompra", m.nombre, l.nombre, g.nombre
                ORDER BY p.nombre ASC
            `;
            params = [cutoffTimestamp];
        }

        const rawRows = await this.repo.query(query, params);

        const lotesWhere: any = { cantidadActual: MoreThan(0) };
        if (sucursalId) {
            lotesWhere.sucursal = { id: sucursalId };
        }
        const activeLotes = await this.loteRepo.find({
            where: lotesWhere,
            relations: ['producto', 'sucursal'],
            order: { fechaVencimiento: { direction: 'ASC', nulls: 'NULLS LAST' } as any, fechaIngreso: 'ASC' }
        });

        const lotesByProduct = new Map<number, any[]>();
        activeLotes.forEach(l => {
            if (!l.producto?.id) return;
            if (!lotesByProduct.has(l.producto.id)) {
                lotesByProduct.set(l.producto.id, []);
            }
            lotesByProduct.get(l.producto.id)!.push({
                numeroLote: l.numeroLote,
                cantidadActual: Number(l.cantidadActual || 0),
                fechaVencimiento: l.fechaVencimiento ? String(l.fechaVencimiento).substring(0, 10) : null
            });
        });

        return rawRows.map((r: any) => {
            const stockCorteNum = Number(r.stockCorte || 0);
            const stockActualNum = Number(r.stockActualHoy || 0);
            const itemLotes = lotesByProduct.get(Number(r.productoId)) || [];

            return {
                productoId: Number(r.productoId),
                codigo: r.codigo || '-',
                nombre: r.nombre || '-',
                marca: r.marca || '-',
                linea: r.linea || '-',
                grupo: r.grupo || '-',
                unidadMedida: r.unidadMedida || 'UNIDAD',
                precioVenta: Number(r.precioVenta || 0),
                precioCompra: Number(r.precioCompra || 0),
                stockActualHoy: stockActualNum,
                movimientosDespues: Number(r.movimientosDespues || 0),
                stockCorte: stockCorteNum,
                lotes: itemLotes
            };
        });
    }
}
