const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');

const myDataSource = new DataSource({
    type: 'postgres',
    host: '127.0.0.1',
    port: 5433,
    username: 'postgres',
    password: 'postgrespg',
    database: 'gipaaf',
});

myDataSource.initialize()
    .then(async () => {
        console.log("🌱 Insertando datos de ejemplo...");

        // 1. Ciudades
        await myDataSource.query(`INSERT INTO ciudades (nombre, activo) VALUES ('Santa Cruz', true), ('La Paz', true), ('Cochabamba', true) ON CONFLICT DO NOTHING`);
        const ciudades = await myDataSource.query(`SELECT id, nombre FROM ciudades`);
        const sczId = ciudades.find(c => c.nombre === 'Santa Cruz')?.id;
        const lpzId = ciudades.find(c => c.nombre === 'La Paz')?.id;

        // 2. Sucursales
        await myDataSource.query(`INSERT INTO sucursales (nombre, direccion, telefono, "ciudadId") VALUES 
            ('Sucursal Norte', 'Av. Banzer 4to Anillo', '70012345', $1),
            ('Sucursal Sur', 'Doble Vía a La Guardia', '70054321', $1),
            ('Sucursal Centro La Paz', 'El Prado', '71111111', $2)
            ON CONFLICT DO NOTHING`, [sczId, lpzId]);
        
        const sucursales = await myDataSource.query(`SELECT id, nombre FROM sucursales`);
        const sucNorte = sucursales.find(s => s.nombre === 'Sucursal Norte')?.id;
        const sucSur = sucursales.find(s => s.nombre === 'Sucursal Sur')?.id;

        // 3. Almacenes
        await myDataSource.query(`INSERT INTO almacenes (nombre, descripcion, "sucursalId") VALUES 
            ('Almacen Principal Norte', 'Almacen de piso', $1),
            ('Bodega Trastienda Norte', 'Depósito trasero', $1),
            ('Almacen Sur', 'Almacen único de sucursal sur', $2)
            ON CONFLICT DO NOTHING`, [sucNorte, sucSur]);

        const almacenes = await myDataSource.query(`SELECT id, nombre FROM almacenes`);
        const almNorte = almacenes.find(a => a.nombre === 'Almacen Principal Norte')?.id;

        // 4. Categorias
        await myDataSource.query(`INSERT INTO categorias (nombre, descripcion) VALUES 
            ('Electrónica', 'Televisores, Celulares, Laptops'),
            ('Hogar', 'Muebles, Decoración'),
            ('Línea Blanca', 'Heladeras, Lavadoras')
            ON CONFLICT DO NOTHING`);
            
        const categorias = await myDataSource.query(`SELECT id, nombre FROM categorias`);
        const catElec = categorias.find(c => c.nombre === 'Electrónica')?.id;
        const catHogar = categorias.find(c => c.nombre === 'Hogar')?.id;

        // 5. Productos
        await myDataSource.query(`INSERT INTO productos (nombre, descripcion, codigo, "precioCompra", "precioVenta", "categoriaId") VALUES 
            ('TV Samsung 55', 'Smart TV 4K', 'TV-SAM-55', 3000, 4500, $1),
            ('Laptop HP Core i5', '8GB RAM, 512GB SSD', 'LAP-HP-I5', 4000, 5200, $1),
            ('Sofá 3 cuerpos', 'Color Gris oscuro', 'SOF-3C-GR', 1500, 2200, $2)
            ON CONFLICT DO NOTHING`, [catElec, catHogar]);

        const productos = await myDataSource.query(`SELECT id, nombre FROM productos`);
        const prodTV = productos.find(p => p.nombre === 'TV Samsung 55')?.id;
        const prodLaptop = productos.find(p => p.nombre === 'Laptop HP Core i5')?.id;

        // 6. Inventario
        await myDataSource.query(`INSERT INTO inventario ("productoId", "almacenId", "stockActual", "stockMinimo") VALUES 
            ($1, $3, 15, 5),
            ($2, $3, 8, 3)
            ON CONFLICT DO NOTHING`, [prodTV, prodLaptop, almNorte]);

        // 7. Personas, Clientes y Proveedores
        const resultPersonaCli1 = await myDataSource.query(`INSERT INTO personas (nombres, apellidos, ci, telefono, direccion) VALUES ('Maria', 'Lopez', '1234567', '78888888', 'Av. Santos Dumont') RETURNING id`);
        const resultPersonaCli2 = await myDataSource.query(`INSERT INTO personas (nombres, apellidos, ci, telefono, direccion) VALUES ('Juan', 'Perez', '7654321', '79999999', 'Av. Piraí') RETURNING id`);
        
        await myDataSource.query(`INSERT INTO clientes ("personaId") VALUES ($1), ($2) ON CONFLICT DO NOTHING`, [resultPersonaCli1[0].id, resultPersonaCli2[0].id]);
            
        const resultPersonaProv1 = await myDataSource.query(`INSERT INTO personas (nombres, apellidos, telefono, direccion) VALUES ('Ventas Samsung', 'SRL', '3333333', 'Parque Industrial') RETURNING id`);
        const resultPersonaProv2 = await myDataSource.query(`INSERT INTO personas (nombres, apellidos, telefono, direccion) VALUES ('Contacto HP', 'SA', '4444444', 'Equipetrol') RETURNING id`);

        await myDataSource.query(`INSERT INTO proveedores (empresa, ruc, "personaId") VALUES 
            ('Importadora Samsung', '1000222020', $1),
            ('HP Bolivia', '1000333030', $2)
            ON CONFLICT DO NOTHING`, [resultPersonaProv1[0].id, resultPersonaProv2[0].id]);

        console.log("✅ Datos de ejemplo creados con éxito.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error connecting to DB:", err);
        process.exit(1);
    });
