import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Cliente } from './cliente.entity';
import { Persona } from '../personas/persona.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Ruta } from '../rutas/ruta.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Cliente, Persona, Sucursal, Ruta])],
    providers: [ClientesService],
    controllers: [ClientesController],
    exports: [ClientesService],
})
export class ClientesModule {}
