import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './usuario.entity';
import { Persona } from '../personas/persona.entity';
import { Rol } from '../roles/rol.entity';
import { Personal } from '../personal/personal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Persona, Rol, Personal])],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [UsuariosService],
})
export class UsuariosModule { }
