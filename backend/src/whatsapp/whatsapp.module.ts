import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';

// Entities
import { Producto } from '../productos/producto.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Nota } from '../notas/nota.entity';
import { Personal } from '../personal/personal.entity';
import { Ruta } from '../rutas/ruta.entity';
import { PagoCobranza } from '../cobranzas/pago.entity';
import { Egreso } from '../egresos/egreso.entity';
import { CuentaBancariaBot } from './cuenta-bancaria-bot.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { PagoProveedor } from '../pagos-proveedores/pago-proveedor.entity';
import { CostoImportacion } from '../notas/costo-importacion.entity';
import { Traspaso } from '../traspasos/traspaso.entity';
import { Muestra } from '../muestras/muestra.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Producto,
            Inventario,
            Cliente,
            Nota,
            Personal,
            Ruta,
            PagoCobranza,
            Egreso,
            CuentaBancariaBot,
            Sucursal,
            PagoProveedor,
            CostoImportacion,
            Traspaso,
            Muestra,
        ]),
    ],
    controllers: [WhatsAppController],
    providers: [WhatsAppService],
    exports: [WhatsAppService],
})
export class WhatsAppModule {}
