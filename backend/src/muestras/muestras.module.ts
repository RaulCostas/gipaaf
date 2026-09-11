import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Muestra } from './muestra.entity';
import { DetalleMuestra } from './detalle-muestra.entity';
import { MuestrasService } from './muestras.service';
import { MuestrasController } from './muestras.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Muestra, DetalleMuestra])],
    controllers: [MuestrasController],
    providers: [MuestrasService],
    exports: [MuestrasService],
})
export class MuestrasModule { }
