import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GruposService } from './grupos.service';
import { GruposController } from './grupos.controller';
import { Grupo } from './grupo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grupo])],
  providers: [GruposService],
  controllers: [GruposController],
  exports: [GruposService],
})
export class GruposModule {}
