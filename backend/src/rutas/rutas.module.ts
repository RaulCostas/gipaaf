import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutasController } from './rutas.controller';
import { RutasService } from './rutas.service';
import { Ruta } from './ruta.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Personal } from '../personal/personal.entity';
import { Cliente } from '../clientes/cliente.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ruta, Sucursal, Personal, Cliente])],
    controllers: [RutasController],
    providers: [RutasService],
    exports: [RutasService]
})
export class RutasModule {}
