import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
import { Persona } from './persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Persona])],
  providers: [PersonasService],
  controllers: [PersonasController],
  exports: [PersonasService],
})
export class PersonasModule { }
