import { Controller, Get, Post, Body, Param, Put, UseGuards, ParseIntPipe, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotasService } from './notas.service';
import { TipoNota } from './nota.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notas')
export class NotasController {
    constructor(private readonly service: NotasService) { }

    @Get()
    @ApiQuery({ name: 'tipo', enum: TipoNota, required: false })
    @ApiQuery({ name: 'vendedorId', type: Number, required: false })
    findAll(
        @Query('tipo') tipo?: TipoNota,
        @Query('vendedorId') vendedorId?: number
    ) { 
        return this.service.findAll(tipo, vendedorId ? Number(vendedorId) : undefined); 
    }

    @Get('utilidades/data')
    getUtilidadesData() {
        return this.service.getUtilidadesData();
    }

    @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

    @Post()
    create(@Body() body: any, @Req() req: any) {
        body.usuario = { id: req.user.id };
        if (req.user.usuario?.sucursal?.id) {
            body.sucursal = { id: req.user.usuario.sucursal.id };
        }
        return this.service.create(body);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Put(':id/confirmar') confirmar(@Param('id', ParseIntPipe) id: number) { return this.service.confirmar(id); }

    @Put(':id/anular') anular(@Param('id', ParseIntPipe) id: number) { return this.service.anular(id); }

    @Put(':id/convertir-venta') convertirVenta(@Param('id', ParseIntPipe) id: number) { return this.service.convertirVenta(id); }

    @Get('costos-importacion/all')
    getAllCostosImportacion() {
        return this.service.getAllCostosImportacion();
    }

    @Get(':id/costo-importacion')
    getCostoImportacion(@Param('id', ParseIntPipe) id: number) {
        return this.service.getCostoImportacion(id);
    }

    @Post(':id/costo-importacion')
    guardarCostoImportacion(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
        const usuarioId = req.user?.id || req.user?.usuario?.id;
        return this.service.guardarCostoImportacion(id, body, usuarioId);
    }
}
