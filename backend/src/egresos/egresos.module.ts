import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Egreso } from './egreso.entity';
import { EgresosService } from './egresos.service';
import { EgresosController } from './egresos.controller';
import { Sucursal } from '../sucursales/sucursal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Egreso, Sucursal])],
    controllers: [EgresosController],
    providers: [EgresosService],
    exports: [EgresosService],
})
export class EgresosModule {}
