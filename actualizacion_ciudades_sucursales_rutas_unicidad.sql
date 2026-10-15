-- Actualización de unicidad para Ciudades, Sucursales y Rutas
-- Fecha: 2026-10-15
-- Este script normaliza espacios en nombres y crea índices únicos parciales
-- que garantizan la integridad de datos sin afectar registros eliminados lógicamente.

BEGIN;

-- 1. Normalización de espacios
UPDATE ciudades SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);
UPDATE sucursales SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);
UPDATE rutas SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);

-- 2. Índice único parcial para Ciudades (nombre no repetido)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ciudades_nombre_unique
ON ciudades (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

-- 3. Índice único parcial para Sucursales (nombre de sucursal único globalmente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sucursales_nombre_unique
ON sucursales (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

-- 4. Índice único parcial para Rutas (nombre único por sucursal)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rutas_nombre_sucursal_unique
ON rutas (LOWER(TRIM(nombre)), "sucursalId")
WHERE "eliminadoEn" IS NULL AND "sucursalId" IS NOT NULL;

-- Para rutas globales sin sucursal asignada
CREATE UNIQUE INDEX IF NOT EXISTS idx_rutas_nombre_sin_sucursal_unique
ON rutas (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL AND "sucursalId" IS NULL;

COMMIT;
