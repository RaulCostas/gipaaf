import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermisosService } from './permisos.service';
import { PermisosController } from './permisos.controller';
import { Permiso } from './permiso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permiso])],
  providers: [PermisosService],
  controllers: [PermisosController],
  exports: [PermisosService],
})
export class PermisosModule { }
