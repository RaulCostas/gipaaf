-- Script: scripts/actualizar_merma_a21_09772.sql
-- Propósito: 
-- 1. Corregir la merma histórica de A21-09772 a 4 unidades (error de Excel reportado originalmente como 11).
-- 2. Limpiar las observaciones de la merma histórica para quitar el texto '[Reingreso a Stock...]' y así eliminar el badge 'Reingreso parcial'.
-- 3. Asegurar que la merma real de 7 unidades quede identificada como 'MER-LP-00007' (operativa, descuenta stock).
-- 4. Sincronizar el stockActual de inventario en La Paz para A21-09772 a 7444.00 unidades (1188 inicial + 7199 traspaso - 936 ventas - 7 merma real).

-- 1. Actualizar merma histórica de A21-09772 a 4 unidades y limpiar observación de reingreso
UPDATE movimientos_inventario
SET cantidad = -4.00,
    motivo = 'Merma histórica [A21-09772] - Sistema anterior',
    observaciones = 'Merma histórica del sistema anterior hasta el 30/10/2026'
WHERE tipo = 'MERMA'
  AND "numeroDocumento" = 'MERMA-LP-HIST-A21-09772';

-- 2. Actualizar o asegurar número y motivo de la merma real de 7 unidades
UPDATE movimientos_inventario
SET "numeroDocumento" = 'MER-LP-00007',
    cantidad = -7.00,
    motivo = 'Merma de Producto',
    observaciones = 'Merma real operativa de producto dañado'
WHERE tipo = 'MERMA'
  AND (
    "numeroDocumento" = 'MER-LP-00007'
    OR (
      ABS(cantidad) = 7.00 
      AND "creadoEn"::date >= '2026-11-11'
      AND "inventarioId" IN (
        SELECT i.id FROM inventario i 
        JOIN productos p ON i."productoId" = p.id 
        WHERE p.codigo = 'A21-09772' AND i."sucursalId" = 1
      )
    )
  );

-- 3. Actualizar stockActual en inventario La Paz para A21-09772 (7444 unidades reales)
UPDATE inventario
SET "stockActual" = 7444.00
WHERE "sucursalId" = 1 
  AND "productoId" = (SELECT id FROM productos WHERE codigo = 'A21-09772' LIMIT 1);
