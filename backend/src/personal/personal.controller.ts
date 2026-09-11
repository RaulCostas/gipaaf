import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PersonalService } from './personal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Personal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('personal')
export class PersonalController {
    constructor(private readonly service: PersonalService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() body: any) {
        return this.service.create(body);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Body() body?: { fechaBaja?: string; motivoBaja?: string }) {
        return this.service.remove(id, body);
    }

    @Post(':id/dar-de-baja')
    darDeBaja(@Param('id', ParseIntPipe) id: number, @Body() body: { fechaBaja?: string; motivoBaja?: string }) {
        return this.service.remove(id, body);
    }
}
