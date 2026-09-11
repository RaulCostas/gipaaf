import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProveedoresService } from './proveedores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proveedores')
export class ProveedoresController {
    constructor(private readonly service: ProveedoresService) { }
    @Get()
    @ApiQuery({ name: 'search', required: false })
    findAll(@Query('search') search?: string) { return this.service.findAll(search); }
    @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
    @Post() create(@Body() body: any) { return this.service.create(body); }
    @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }
    @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
