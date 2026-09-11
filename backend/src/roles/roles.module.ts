import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Rol } from './rol.entity';
import { Permiso } from '../permisos/permiso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, Permiso])],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule { }
