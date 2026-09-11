import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Usuario } from '../usuarios/usuario.entity';
import { Persona } from '../personas/persona.entity';
import { Rol } from '../roles/rol.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Permiso } from '../permisos/permiso.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Usuario, Persona, Rol, Sucursal, Permiso])],
    providers: [SeedService],
})
export class SeedModule { }
