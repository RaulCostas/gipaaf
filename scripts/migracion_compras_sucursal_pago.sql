-- ==============================================================================
-- Migración: Soporte para Sucursal de Pago y Sucursal Destino en Compras
-- ==============================================================================
-- Añade la columna sucursalPagoId a la tabla notas y actualiza compras históricas.
-- Ejecutar en DBeaver en producción.
-- ==============================================================================

-- 1. Crear columna sucursalPagoId referenciando a sucursales
ALTER TABLE notas 
ADD COLUMN IF NOT EXISTS "sucursalPagoId" integer REFERENCES sucursales(id);

-- 2. Para compras históricas existentes, asignar la sucursal de pago igual a la sucursal destino
UPDATE notas 
SET "sucursalPagoId" = "sucursalId" 
WHERE tipo = 'COMPRA' 
  AND "sucursalPagoId" IS NULL 
  AND "sucursalId" IS NOT NULL;

-- 3. Verificación
SELECT id, numero, tipo, "sucursalId", "sucursalPagoId"
FROM notas 
WHERE tipo = 'COMPRA'
ORDER BY id DESC 
LIMIT 10;
