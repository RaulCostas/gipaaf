import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProveedoresService } from './proveedores.service';
import { ProveedoresController } from './proveedores.controller';
import { Proveedor } from './proveedor.entity';
import { Persona } from '../personas/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proveedor, Persona])],
  providers: [ProveedoresService],
  controllers: [ProveedoresController],
  exports: [ProveedoresService],
})
export class ProveedoresModule { }
