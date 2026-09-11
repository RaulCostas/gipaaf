import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MuestrasService } from './muestras.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Muestras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('muestras')
export class MuestrasController {
    constructor(private readonly service: MuestrasService) { }

    @Get()
    findAll(@Query() query: any) {
        return this.service.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() body: any, @Req() req: any) {
        const usuarioId = req.user?.id || req.user?.usuario?.id;
        return this.service.create(body, usuarioId);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Put(':id/devolucion')
    registrarDevolucion(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
    ) {
        return this.service.registrarDevolucion(id, body);
    }

    @Put(':id/anular')
    anular(@Param('id', ParseIntPipe) id: number) {
        return this.service.anular(id);
    }
}
