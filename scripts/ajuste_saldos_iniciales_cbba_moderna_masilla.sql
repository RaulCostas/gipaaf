-- =================================================================
-- AJUSTE DE SALDO INICIAL CLIENTE Y PRODUCTO (SUCURSAL COCHABAMBA)
-- FECHA: 30/10/2026
-- =================================================================

BEGIN;

-- 1. Cliente: [4058] La Moderna
-- Reducción de Bs. 60 al saldo inicial (4612.44 -> 4552.44)
-- El saldo pendiente se recalcula restando automáticamente los pagos ya registrados
UPDATE notas
SET subtotal = 4552.44,
    total = 4552.44,
    saldo = GREATEST(0, 4552.44 - COALESCE((
        SELECT SUM(p."montoEquivalente") 
        FROM pagos_cobranza p 
        WHERE p."notaId" = notas.id AND p.activo = true
    ), 0)),
    "actualizadoEn" = NOW()
WHERE "clienteId" = (SELECT id FROM clientes WHERE codigo = '4058' LIMIT 1)
  AND "sucursalId" = (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1)
  AND (
    "numero" IN ('VEN-CBBA-000025', 'SAL-CBBA-04058')
    OR "observaciones" LIKE '%Saldo inicial%La Moderna%'
    OR id = 134
  );

-- 2. Producto: [A21-09777] Masilla Plástica Superior P2001 1kg
-- Ajuste de saldo inicial de 1 a 3 unidades en Sucursal Cochabamba

-- 2.1. Stock en inventario
UPDATE inventario
SET "stockActual" = 3.00,
    "actualizadoEn" = NOW()
WHERE "productoId" = (SELECT id FROM productos WHERE codigo = 'A21-09777' LIMIT 1)
  AND "sucursalId" = (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1);

-- 2.2. Lote inicial
UPDATE lotes
SET "cantidadInicial" = 3.00,
    "cantidadActual" = 3.00,
    "actualizadoEn" = NOW()
WHERE "numeroLote" = 'L-INI-CBBA-A21-09777'
  AND "productoId" = (SELECT id FROM productos WHERE codigo = 'A21-09777' LIMIT 1)
  AND "sucursalId" = (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1);

-- 2.3. Movimiento inicial en Kardex
UPDATE movimientos_inventario
SET cantidad = 3.00
WHERE "numeroDocumento" = 'L-INI-CBBA-A21-09777'
  AND tipo = 'INVENTARIO_INICIAL';

COMMIT;

-- =================================================================
-- CONSULTAS DE VERIFICACIÓN (Opcionales para correr en DBeaver)
-- =================================================================
-- 1. Verificar Nota del Cliente
SELECT n.id, n.numero, n.subtotal, n.total, n.saldo, n.observaciones, c.codigo, c."nombreTienda"
FROM notas n
JOIN clientes c ON n."clienteId" = c.id
WHERE c.codigo = '4058'
  AND (n.numero IN ('VEN-CBBA-000025', 'SAL-CBBA-04058') OR n.observaciones LIKE '%Saldo inicial%');

-- 2. Verificar Stock, Lote y Movimiento del Producto
SELECT 
    p.codigo, 
    p.nombre, 
    i."stockActual", 
    l."numeroLote", 
    l."cantidadActual", 
    m.tipo AS tipo_mov, 
    m.cantidad AS kardex_inicial
FROM productos p
JOIN inventario i ON i."productoId" = p.id
JOIN sucursales s ON i."sucursalId" = s.id AND LOWER(s.nombre) LIKE '%cbba%'
LEFT JOIN lotes l ON l."productoId" = p.id AND l."sucursalId" = s.id AND l."numeroLote" = 'L-INI-CBBA-A21-09777'
LEFT JOIN movimientos_inventario m ON m."inventarioId" = i.id AND m."numeroDocumento" = 'L-INI-CBBA-A21-09777'
WHERE p.codigo = 'A21-09777';
