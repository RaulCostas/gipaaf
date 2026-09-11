import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EgresosService } from './egresos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Egresos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('egresos')
export class EgresosController {
    constructor(private readonly service: EgresosService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() body: any, @Req() req: any) {
        if (!body.usuarioId && req.user?.id) {
            body.usuarioId = req.user.id;
        }
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

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
