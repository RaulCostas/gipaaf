import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Nota, TipoNota, EstadoNota } from '../notas/nota.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Producto } from '../productos/producto.entity';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Nota)
        private notaRepo: Repository<Nota>,
        @InjectRepository(Inventario)
        private inventarioRepo: Repository<Inventario>,
        @InjectRepository(Producto)
        private productoRepo: Repository<Producto>,
    ) { }

    async getDashboardStats(ciudadId?: string, sucursalId?: string) {
        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        const applyFilters = (qb: any, prefix: string) => {
            if (sucursalId) {
                qb.andWhere(`${prefix}.sucursalId = :sucursalId`, { sucursalId: Number(sucursalId) });
            } else if (ciudadId) {
                qb.innerJoin(`${prefix}.sucursal`, 'sucursal')
                  .andWhere(`sucursal.ciudadId = :ciudadId`, { ciudadId: Number(ciudadId) });
            }
        };

        // 1. Sales Today
        const salesQb = this.notaRepo.createQueryBuilder('nota')
            .where('nota.tipo = :tipo', { tipo: TipoNota.VENTA })
            .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA })
            .andWhere('nota.fecha BETWEEN :start AND :end', { start, end });
        applyFilters(salesQb, 'nota');
        const salesToday = await salesQb.getMany();
        const totalSalesToday = salesToday.reduce((acc, n) => acc + Number(n.total), 0);

        // 2. Low Stock Count
        const stockQb = this.inventarioRepo.createQueryBuilder('inv')
            .where('inv.stockActual <= inv.stockMinimo');
        if (sucursalId) {
            stockQb.andWhere('inv.sucursalId = :sucursalId', { sucursalId: Number(sucursalId) });
        } else if (ciudadId) {
            stockQb.innerJoin('inv.sucursal', 'sucursal')
                   .andWhere('sucursal.ciudadId = :ciudadId', { ciudadId: Number(ciudadId) });
        }
        const lowStock = await stockQb.getCount();

        // 3. Total Products (Global usually, but kept as is since it doesn't depend on branches)
        const totalProducts = await this.productoRepo.count({ where: { activo: true } });

        // 4. Monthly Progress (Last 30 days)
        const thirtyDaysAgo = subDays(today, 30);
        const monthQb = this.notaRepo.createQueryBuilder('nota')
            .where('nota.tipo = :tipo', { tipo: TipoNota.VENTA })
            .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA })
            .andWhere('nota.fecha BETWEEN :start AND :end', { start: thirtyDaysAgo, end });
        applyFilters(monthQb, 'nota');
        const salesLastMonth = await monthQb.getMany();
        const totalSalesMonth = salesLastMonth.reduce((acc, n) => acc + Number(n.total), 0);

        return {
            totalSalesToday,
            lowStock,
            totalProducts,
            totalSalesMonth,
        };
    }

    async getSalesTrend(ciudadId?: string, sucursalId?: string) {
        const today = new Date();
        const daysMap: { [dateStr: string]: { name: string; total: number } } = {};
        const daysOrder: string[] = [];

        const dayAbbreviations = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayName = dayAbbreviations[date.getDay()];
            daysMap[dateStr] = { name: dayName, total: 0 };
            daysOrder.push(dateStr);
        }

        const start = startOfDay(subDays(today, 6));

        const qb = this.notaRepo.createQueryBuilder('nota')
            .where('nota.tipo = :tipo', { tipo: TipoNota.VENTA })
            .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA })
            .andWhere('nota.fecha >= :start', { start })
            .select("to_char(nota.fecha, 'YYYY-MM-DD')", 'fecha')
            .addSelect('SUM(nota.total)', 'total')
            .groupBy("to_char(nota.fecha, 'YYYY-MM-DD')")
            .orderBy('fecha', 'ASC');

        if (sucursalId) {
            qb.andWhere(`nota.sucursalId = :sucursalId`, { sucursalId: Number(sucursalId) });
        } else if (ciudadId) {
            qb.innerJoin(`nota.sucursal`, 'sucursal')
              .andWhere(`sucursal.ciudadId = :ciudadId`, { ciudadId: Number(ciudadId) });
        }

        const data = await qb.getRawMany();

        for (const item of data) {
            const dateStr = item.fecha;
            if (daysMap[dateStr]) {
                daysMap[dateStr].total = Number(item.total);
            }
        }

        return daysOrder.map(dateStr => daysMap[dateStr]);
    }

    async getTopProducts(ciudadId?: string, sucursalId?: string) {
        const qb = this.notaRepo.createQueryBuilder('nota')
            .innerJoinAndSelect('nota.detalles', 'detalle')
            .innerJoinAndSelect('detalle.producto', 'producto')
            .where('nota.tipo = :tipo', { tipo: TipoNota.VENTA })
            .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA })
            .select('producto.nombre', 'name')
            .addSelect('SUM(detalle.cantidad)', 'value')
            .groupBy('producto.id')
            .addGroupBy('producto.nombre')
            .orderBy('value', 'DESC')
            .limit(5);

        if (sucursalId) {
            qb.andWhere(`nota.sucursalId = :sucursalId`, { sucursalId: Number(sucursalId) });
        } else if (ciudadId) {
            qb.innerJoin(`nota.sucursal`, 'sucursal')
              .andWhere(`sucursal.ciudadId = :ciudadId`, { ciudadId: Number(ciudadId) });
        }

        const data = await qb.getRawMany();
        return data.map(d => ({ name: d.name, value: Number(d.value) }));
    }

    async getLowStockProducts(ciudadId?: string, sucursalId?: string) {
        const stockQb = this.inventarioRepo.createQueryBuilder('inv')
            .leftJoinAndSelect('inv.producto', 'producto')
            .leftJoinAndSelect('producto.categoria', 'categoria')
            .leftJoinAndSelect('producto.marca', 'marca')
            .leftJoinAndSelect('inv.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .where('inv.stockActual <= inv.stockMinimo')
            .andWhere('producto.activo = true');

        if (sucursalId) {
            stockQb.andWhere('inv.sucursalId = :sucursalId', { sucursalId: Number(sucursalId) });
        } else if (ciudadId) {
            stockQb.andWhere('sucursal.ciudadId = :ciudadId', { ciudadId: Number(ciudadId) });
        }

        return stockQb.orderBy('inv.stockActual', 'ASC').getMany();
    }
}
