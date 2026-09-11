import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('dashboard/stats')
    getStats(@Query('ciudadId') ciudadId?: string, @Query('sucursalId') sucursalId?: string) {
        return this.reportsService.getDashboardStats(ciudadId, sucursalId);
    }

    @Get('dashboard/trend')
    getTrend(@Query('ciudadId') ciudadId?: string, @Query('sucursalId') sucursalId?: string) {
        return this.reportsService.getSalesTrend(ciudadId, sucursalId);
    }

    @Get('dashboard/top-products')
    getTopProducts(@Query('ciudadId') ciudadId?: string, @Query('sucursalId') sucursalId?: string) {
        return this.reportsService.getTopProducts(ciudadId, sucursalId);
    }

    @Get('dashboard/low-stock')
    getLowStock(@Query('ciudadId') ciudadId?: string, @Query('sucursalId') sucursalId?: string) {
        return this.reportsService.getLowStockProducts(ciudadId, sucursalId);
    }
}
