import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LineasService } from './lineas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Lineas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lineas')
export class LineasController {
    constructor(private readonly service: LineasService) { }
    @Get() findAll() { return this.service.findAll(); }
    @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
    @Post() create(@Body() body: any) { return this.service.create(body); }
    @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }
    @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
