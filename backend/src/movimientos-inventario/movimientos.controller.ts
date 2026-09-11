import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MovimientosInventarioService } from './movimientos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Movimientos de Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('movimientos-inventario')
export class MovimientosInventarioController {
    constructor(private readonly service: MovimientosInventarioService) {}

    @Get()
    @ApiQuery({ name: 'inventarioId', required: false })
    findAll(@Query('inventarioId') inventarioId?: number) {
        if (inventarioId) {
            return this.service.findByInventario(inventarioId);
        }
        return this.service.findAll();
    }
}
