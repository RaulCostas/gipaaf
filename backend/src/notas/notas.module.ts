import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotasService } from './notas.service';
import { NotasController } from './notas.controller';
import { Nota } from './nota.entity';
import { DetalleNota } from './detalle-nota.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Producto } from '../productos/producto.entity';

import { CostoImportacion } from './costo-importacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Nota, DetalleNota, Inventario, Producto, CostoImportacion])],
  providers: [NotasService],
  controllers: [NotasController],
  exports: [NotasService],
})
export class NotasModule { }
