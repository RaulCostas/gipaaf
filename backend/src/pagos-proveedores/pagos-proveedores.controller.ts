import { Controller, Get, Post, Body, Param, Put, UseGuards, ParseIntPipe, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PagosProveedoresService } from './pagos-proveedores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Pagos Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pagos-proveedores')
export class PagosProveedoresController {
    constructor(private readonly service: PagosProveedoresService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get('deudas')
    getDeudas(@Query('proveedorId') proveedorId?: number) {
        return this.service.getDeudas(proveedorId);
    }

    @Get('nota/:notaId')
    getByNota(@Param('notaId', ParseIntPipe) notaId: number) {
        return this.service.getByNota(notaId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() body: any, @Req() req: any) {
        body.usuarioId = req.user?.id;
        return this.service.create(body);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Put(':id/anular')
    anular(@Param('id', ParseIntPipe) id: number) {
        return this.service.anular(id);
    }
}
