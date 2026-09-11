import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosProveedoresController } from './pagos-proveedores.controller';
import { PagosProveedoresService } from './pagos-proveedores.service';
import { PagoProveedor } from './pago-proveedor.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PagoProveedor])],
    controllers: [PagosProveedoresController],
    providers: [PagosProveedoresService],
    exports: [PagosProveedoresService]
})
export class PagosProveedoresModule { }
