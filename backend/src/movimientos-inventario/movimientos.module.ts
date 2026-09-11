import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoInventario } from './movimiento_inventario.entity';
import { MovimientosInventarioService } from './movimientos.service';
import { MovimientosInventarioController } from './movimientos.controller';
import { Nota } from '../notas/nota.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MovimientoInventario, Nota, Inventario, Sucursal])],
    providers: [MovimientosInventarioService],
    controllers: [MovimientosInventarioController],
    exports: [MovimientosInventarioService],
})
export class MovimientosInventarioModule {}
