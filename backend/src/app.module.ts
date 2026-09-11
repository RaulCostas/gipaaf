import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PersonasModule } from './personas/personas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { PermisosModule } from './permisos/permisos.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { ClientesModule } from './clientes/clientes.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { CategoriasModule } from './categorias/categorias.module';
import { MarcasModule } from './marcas/marcas.module';
import { GruposModule } from './grupos/grupos.module';
import { ProductosModule } from './productos/productos.module';
import { InventarioModule } from './inventario/inventario.module';
import { NotasModule } from './notas/notas.module';
import { SeedModule } from './seed/seed.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ReportsModule } from './reports/reports.module';
import { CiudadesModule } from './ciudades/ciudades.module';
import { MovimientosInventarioModule } from './movimientos-inventario/movimientos.module';
import { PersonalModule } from './personal/personal.module';
import { RutasModule } from './rutas/rutas.module';
import { CobranzasModule } from './cobranzas/cobranzas.module';
import { PagosProveedoresModule } from './pagos-proveedores/pagos-proveedores.module';
import { TraspasosModule } from './traspasos/traspasos.module';
import { EgresosModule } from './egresos/egresos.module';
import { MuestrasModule } from './muestras/muestras.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', '127.0.0.1'),
        port: configService.get<number>('DB_PORT', 5433),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgrespg'),
        database: configService.get<string>('DB_NAME', 'gipaaf'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    PersonasModule,
    UsuariosModule,
    RolesModule,
    PermisosModule,
    SucursalesModule,
    ClientesModule,
    ProveedoresModule,
    MarcasModule,
    CategoriasModule,
    GruposModule,
    ProductosModule,
    InventarioModule,
    NotasModule,
    SeedModule,
    ReportsModule,
    CiudadesModule,
    MovimientosInventarioModule,
    PersonalModule,
    RutasModule,
    CobranzasModule,
    PagosProveedoresModule,
    TraspasosModule,
    EgresosModule,
    MuestrasModule,
    WhatsAppModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - start;
          Logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, 'HTTP');
        });
        next();
      })
      .forRoutes('*');
  }
}
