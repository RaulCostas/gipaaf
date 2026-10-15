-- ==============================================================================
-- SCRIPT MAESTRO DE UNICIDAD PARA PRODUCCIÓN
-- ERP GIPAAF - Soft-Medic
-- Fecha: 2026-10-15
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PASO 1: VERIFICACIÓN PREVIA DE DUPLICADOS EXISTENTES EN PRODUCCIÓN
-- Ejecuta este bloque primero en DBeaver. 
-- Si alguna consulta devuelve registros, debes corregirlos o renombrarlos antes 
-- de ejecutar el PASO 2. Si todas devuelven 0 filas, puedes proceder sin riesgo.
-- ------------------------------------------------------------------------------

-- 1.1 Clientes con mismo código en la misma sucursal
SELECT "sucursalId", LOWER(TRIM(codigo)) AS codigo, COUNT(*) 
FROM clientes 
WHERE "eliminadoEn" IS NULL AND codigo IS NOT NULL AND TRIM(codigo) != ''
GROUP BY "sucursalId", LOWER(TRIM(codigo)) 
HAVING COUNT(*) > 1;

-- 1.2 Proveedores con mismo RUC/NIT
SELECT LOWER(TRIM(ruc)) AS ruc, COUNT(*) 
FROM proveedores 
WHERE "eliminadoEn" IS NULL AND ruc IS NOT NULL AND TRIM(ruc) != ''
GROUP BY LOWER(TRIM(ruc)) 
HAVING COUNT(*) > 1;

-- 1.3 Proveedores con misma Empresa / Razón Social
SELECT LOWER(TRIM(empresa)) AS empresa, COUNT(*) 
FROM proveedores 
WHERE "eliminadoEn" IS NULL AND empresa IS NOT NULL AND TRIM(empresa) != ''
GROUP BY LOWER(TRIM(empresa)) 
HAVING COUNT(*) > 1;

-- 1.4 Catálogos: Marcas duplicadas
SELECT LOWER(TRIM(nombre)) AS nombre, COUNT(*) 
FROM marcas 
WHERE "eliminadoEn" IS NULL AND nombre IS NOT NULL 
GROUP BY LOWER(TRIM(nombre)) 
HAVING COUNT(*) > 1;

-- 1.5 Catálogos: Líneas duplicadas
SELECT LOWER(TRIM(nombre)) AS nombre, COUNT(*) 
FROM lineas 
WHERE "eliminadoEn" IS NULL AND nombre IS NOT NULL 
GROUP BY LOWER(TRIM(nombre)) 
HAVING COUNT(*) > 1;

-- 1.6 Catálogos: Grupos duplicados
SELECT LOWER(TRIM(nombre)) AS nombre, COUNT(*) 
FROM grupos 
WHERE "eliminadoEn" IS NULL AND nombre IS NOT NULL 
GROUP BY LOWER(TRIM(nombre)) 
HAVING COUNT(*) > 1;

-- 1.7 Ciudades duplicadas
SELECT LOWER(TRIM(nombre)) AS nombre, COUNT(*) 
FROM ciudades 
WHERE "eliminadoEn" IS NULL AND nombre IS NOT NULL 
GROUP BY LOWER(TRIM(nombre)) 
HAVING COUNT(*) > 1;

-- 1.8 Sucursales duplicadas
SELECT LOWER(TRIM(nombre)) AS nombre, COUNT(*) 
FROM sucursales 
WHERE "eliminadoEn" IS NULL AND nombre IS NOT NULL 
GROUP BY LOWER(TRIM(nombre)) 
HAVING COUNT(*) > 1;

-- 1.9 Rutas duplicadas por sucursal
SELECT "sucursalId", LOWER(TRIM(nombre)) AS nombre, COUNT(*) 
FROM rutas 
WHERE "eliminadoEn" IS NULL AND nombre IS NOT NULL AND "sucursalId" IS NOT NULL
GROUP BY "sucursalId", LOWER(TRIM(nombre)) 
HAVING COUNT(*) > 1;


-- ------------------------------------------------------------------------------
-- PASO 2: APLICACIÓN DE NORMALIZACIÓN E ÍNDICES ÚNICOS
-- Ejecuta este bloque una vez verificado el PASO 1.
-- ------------------------------------------------------------------------------

BEGIN;

-- A) Normalización de espacios en blanco al inicio y final
UPDATE clientes SET codigo = TRIM(codigo) WHERE codigo IS NOT NULL AND codigo != TRIM(codigo);
UPDATE proveedores SET ruc = TRIM(ruc) WHERE ruc IS NOT NULL AND ruc != TRIM(ruc);
UPDATE proveedores SET empresa = TRIM(empresa) WHERE empresa IS NOT NULL AND empresa != TRIM(empresa);
UPDATE marcas SET nombre = TRIM(nombre) WHERE nombre IS NOT NULL AND nombre != TRIM(nombre);
UPDATE lineas SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);
UPDATE grupos SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);
UPDATE ciudades SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);
UPDATE sucursales SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);
UPDATE rutas SET nombre = TRIM(nombre) WHERE nombre != TRIM(nombre);

-- B) Creación de Índices Únicos Parciales (ignoran soft deletes "eliminadoEn")

-- 1. Clientes: código único por sucursal
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_codigo_sucursal_unique
ON clientes (LOWER(TRIM(codigo)), "sucursalId")
WHERE "eliminadoEn" IS NULL AND codigo IS NOT NULL AND TRIM(codigo) != '' AND "sucursalId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_codigo_sin_sucursal_unique
ON clientes (LOWER(TRIM(codigo)))
WHERE "eliminadoEn" IS NULL AND codigo IS NOT NULL AND TRIM(codigo) != '' AND "sucursalId" IS NULL;

-- 2. Proveedores: RUC y Empresa únicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_proveedores_ruc_unique
ON proveedores (LOWER(TRIM(ruc)))
WHERE "eliminadoEn" IS NULL AND ruc IS NOT NULL AND TRIM(ruc) != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_proveedores_empresa_unique
ON proveedores (LOWER(TRIM(empresa)))
WHERE "eliminadoEn" IS NULL AND empresa IS NOT NULL AND TRIM(empresa) != '';

-- 3. Catálogos Maestros: Marcas, Líneas, Grupos
CREATE UNIQUE INDEX IF NOT EXISTS idx_marcas_nombre_unique
ON marcas (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lineas_nombre_unique
ON lineas (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_grupos_nombre_unique
ON grupos (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

-- 4. Estructura: Ciudades y Sucursales
CREATE UNIQUE INDEX IF NOT EXISTS idx_ciudades_nombre_unique
ON ciudades (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sucursales_nombre_unique
ON sucursales (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL;

-- 5. Rutas: único por sucursal
CREATE UNIQUE INDEX IF NOT EXISTS idx_rutas_nombre_sucursal_unique
ON rutas (LOWER(TRIM(nombre)), "sucursalId")
WHERE "eliminadoEn" IS NULL AND "sucursalId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rutas_nombre_sin_sucursal_unique
ON rutas (LOWER(TRIM(nombre)))
WHERE "eliminadoEn" IS NULL AND "sucursalId" IS NULL;

COMMIT;
