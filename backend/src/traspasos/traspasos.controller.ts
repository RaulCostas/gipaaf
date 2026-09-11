import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TraspasosService } from './traspasos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Traspasos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('traspasos')
export class TraspasosController {
    constructor(private readonly service: TraspasosService) {}

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

    @Put(':id/anular')
    anular(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.anular(id, req.user?.id);
    }
}
