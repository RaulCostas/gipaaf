import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineasService } from './lineas.service';
import { LineasController } from './lineas.controller';
import { Linea } from './linea.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Linea])],
  providers: [LineasService],
  controllers: [LineasController],
  exports: [LineasService],
})
export class LineasModule { }
