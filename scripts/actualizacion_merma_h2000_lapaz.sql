-- =========================================================================
-- Script: actualizacion_merma_h2000_lapaz.sql
-- Propósito: 
--   1. Actualizar el código del producto H2000 de 'VY-H2001' a 'VY-H2000'.
--   2. Reasignar la merma histórica de 1 unidad en Sucursal La Paz
--      para que apunte al producto 'VY-H2000' en lugar de 'VY-N2001'.
-- =========================================================================

BEGIN;

-- 1. Asegurar que el código del producto H2000 sea 'VY-H2000'
UPDATE productos 
SET codigo = 'VY-H2000' 
WHERE (codigo = 'VY-H2001' OR codigo = 'VY-H2000' OR nombre ILIKE 'H2000 Soplete%');

-- 2. Cambiar la merma registrada en Sucursal La Paz hacia el inventario de VY-H2000
UPDATE movimientos_inventario
SET 
    "inventarioId" = (
        SELECT i.id 
        FROM inventario i
        JOIN productos p ON p.id = i."productoId"
        JOIN sucursales s ON s.id = i."sucursalId"
        WHERE p.codigo = 'VY-H2000' 
          AND (s.id = 1 OR s.nombre ILIKE '%Paz%')
        LIMIT 1
    ),
    "numeroDocumento" = 'MERMA-LP-HIST-VY-H2000',
    motivo = 'Merma histórica [VY-H2000] - Sistema anterior'
WHERE id IN (
    SELECT m.id
    FROM movimientos_inventario m
    JOIN inventario i ON i.id = m."inventarioId"
    JOIN productos p ON p.id = i."productoId"
    JOIN sucursales s ON s.id = i."sucursalId"
    WHERE p.codigo = 'VY-N2001'
      AND (s.id = 1 OR s.nombre ILIKE '%Paz%')
      AND m.tipo IN ('MERMA', 'MERMA_DESCARTE')
);

COMMIT;
