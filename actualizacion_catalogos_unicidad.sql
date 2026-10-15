-- Actualización de unicidad para Catálogos Maestros: Marcas, Líneas y Grupos
-- Fecha: 2026-10-15
-- Este script normaliza los nombres eliminando espacios accidentales y crea índices únicos
-- asegurando que no se repitan nombres (case-insensitive) entre registros activos ("eliminadoEn" IS NULL).

BEGIN;

-- 1. Normalización de espacios
UPDATE marcas SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);
UPDATE lineas SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);
UPDATE grupos SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);

-- 2. Índices únicos parciales (ignoran eliminados lógicos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_marcas_nombre_unique
ON marcas (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lineas_nombre_unique
ON lineas (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_grupos_nombre_unique
ON grupos (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

COMMIT;
