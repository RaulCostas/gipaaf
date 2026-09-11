import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PersonasService } from './personas.service';
import { Persona } from './persona.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Personas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('personas')
export class PersonasController {
    constructor(private readonly service: PersonasService) { }

    @Get()
    findAll() { return this.service.findAll(); }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

    @Post()
    create(@Body() body: Partial<Persona>) { return this.service.create(body); }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<Persona>) { return this.service.update(id, body); }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
