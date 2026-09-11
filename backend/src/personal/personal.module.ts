import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalController } from './personal.controller';
import { PersonalService } from './personal.service';
import { Personal } from './personal.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Personal, Sucursal])],
    controllers: [PersonalController],
    providers: [PersonalService],
    exports: [PersonalService]
})
export class PersonalModule {}
