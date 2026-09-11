import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Nota } from '../notas/nota.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Producto } from '../productos/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Nota, Inventario, Producto])],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService]
})
export class ReportsModule { }
