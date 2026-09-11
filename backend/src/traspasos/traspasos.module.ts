import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Traspaso } from './traspaso.entity';
import { DetalleTraspaso } from './detalle-traspaso.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Producto } from '../productos/producto.entity';
import { Lote } from '../inventario/lote.entity';
import { Egreso } from '../egresos/egreso.entity';
import { MovimientoInventario } from '../movimientos-inventario/movimiento_inventario.entity';
import { TraspasosService } from './traspasos.service';
import { TraspasosController } from './traspasos.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Traspaso,
            DetalleTraspaso,
            Inventario,
            Sucursal,
            Producto,
            Lote,
            Egreso,
            MovimientoInventario,
        ]),
    ],
    controllers: [TraspasosController],
    providers: [TraspasosService],
    exports: [TraspasosService],
})
export class TraspasosModule {}
