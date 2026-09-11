import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { UploadsController } from './uploads.controller';
import { Producto } from './producto.entity';
import { Categoria } from '../categorias/categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Categoria])],
  providers: [ProductosService],
  controllers: [ProductosController, UploadsController],
  exports: [ProductosService],
})
export class ProductosModule { }
