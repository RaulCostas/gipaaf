import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
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
    @ApiQuery({ name: 'tipo', required: false })
    @ApiQuery({ name: 'sucursalId', required: false })
    @ApiQuery({ name: 'ciudadId', required: false })
    findAll(
        @Query('inventarioId') inventarioId?: number,
        @Query('tipo') tipo?: string,
        @Query('sucursalId') sucursalId?: number,
        @Query('ciudadId') ciudadId?: number
    ) {
        if (inventarioId) {
            return this.service.findByInventario(inventarioId);
        }
        return this.service.findAll(tipo, sucursalId ? Number(sucursalId) : undefined, ciudadId ? Number(ciudadId) : undefined);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: { motivo?: string; observaciones?: string }) {
        return this.service.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
