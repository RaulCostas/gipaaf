import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Producto } from './productos/producto.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const repo = app.get<Repository<Producto>>(getRepositoryToken(Producto));

    // Check all products including deleted ones
    const products = await repo.find({ withDeleted: true });
    console.log('--- DIAGNOSTICO DE PRODUCTOS ---');
    console.log(`Total encontrados (incluyendo eliminados): ${products.length}`);
    products.forEach(p => {
        console.log(`ID: ${p.id} | Código: ${p.codigo} | Nombre: ${p.nombre} | Activo: ${p.activo} | Eliminado: ${p.eliminadoEn ? 'SÍ (' + p.eliminadoEn + ')' : 'NO'}`);
    });
    console.log('--- FIN ---');

    await app.close();
}
bootstrap();
