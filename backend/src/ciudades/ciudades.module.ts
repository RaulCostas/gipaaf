import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ciudad } from './ciudad.entity';
import { CiudadesController } from './ciudades.controller';
import { CiudadesService } from './ciudades.service';

@Module({
    imports: [TypeOrmModule.forFeature([Ciudad])],
    controllers: [CiudadesController],
    providers: [CiudadesService],
    exports: [CiudadesService],
})
export class CiudadesModule { }
