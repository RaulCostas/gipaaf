import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';
import { Sucursal } from './sucursal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal])],
  providers: [SucursalesService],
  controllers: [SucursalesController],
  exports: [SucursalesService],
})
export class SucursalesModule { }
