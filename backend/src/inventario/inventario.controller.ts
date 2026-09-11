import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventario')
export class InventarioController {
    constructor(private readonly service: InventarioService) { }

    @Get()
    @ApiQuery({ name: 'sucursalId', required: false })
    @ApiQuery({ name: 'almacenId', required: false })
    @ApiQuery({ name: 'productoId', required: false })
    findAll(@Query('sucursalId') sucursalId?: number, @Query('almacenId') almacenId?: number, @Query('productoId') productoId?: number) {
        const targetSucursalId = sucursalId || almacenId;
        if (targetSucursalId) return this.service.findBySucursal(targetSucursalId);
        if (productoId) return this.service.findByProducto(productoId);
        return this.service.findAll();
    }

    @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
    @Post() create(@Body() body: any) { return this.service.create(body); }
    @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }
    
    @Put(':id/ajustar') 
    ajustar(@Param('id', ParseIntPipe) id: number, @Body('cantidad') cantidad: number, @Body('observaciones') observaciones: string, @Request() req: any) { 
        return this.service.ajustarStock(id, cantidad, req.user?.id, observaciones); 
    }

    @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}