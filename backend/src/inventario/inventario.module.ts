import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { Inventario } from './inventario.entity';
import { Producto } from '../productos/producto.entity';
import { Lote } from './lote.entity';
import { MovimientoLote } from './movimiento-lote.entity';
import { MovimientosInventarioModule } from '../movimientos-inventario/movimientos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario, Producto, Lote, MovimientoLote]),
    MovimientosInventarioModule
  ],
  providers: [InventarioService],
  controllers: [InventarioController],
  exports: [InventarioService],
})
export class InventarioModule { }
