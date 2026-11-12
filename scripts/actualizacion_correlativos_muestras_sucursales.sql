-- =================================================================
-- SCRIPT DE MIGRACIÓN: CORRELATIVOS DE MUESTRAS POR SUCURSAL
-- SISTEMA GIPAAF - FECHA: 2026-11-12
-- =================================================================
-- Este script re-numera los registros de la tabla `muestras`
-- asignando el código de sucursal correspondiente:
--   -> MUE-LP-000001, MUE-LP-000002...
--   -> MUE-CBBA-000001, MUE-CBBA-000002...
-- =================================================================

BEGIN;

-- 1. Calcular el nuevo número correlativo por sucursal ordenado por fecha e id
CREATE TEMP TABLE temp_nuevos_numeros_muestras AS
WITH muestras_clasificadas AS (
    SELECT
        m.id,
        m.numero AS numero_anterior,
        m."sucursalId",
        m.fecha,
        COALESCE(
            CASE
                WHEN UPPER(c.nombre) LIKE '%COCHABAMBA%' OR UPPER(s.nombre) LIKE '%COCHABAMBA%' OR UPPER(s.nombre) LIKE '%CBBA%' THEN 'CBBA'
                WHEN UPPER(c.nombre) LIKE '%LA PAZ%' OR UPPER(s.nombre) LIKE '%LA PAZ%' OR UPPER(s.nombre) LIKE '%LPZ%' OR UPPER(s.nombre) LIKE '%LP%' THEN 'LP'
                WHEN UPPER(c.nombre) LIKE '%SANTA CRUZ%' OR UPPER(s.nombre) LIKE '%SANTA CRUZ%' OR UPPER(s.nombre) LIKE '%SCZ%' OR UPPER(s.nombre) LIKE '%SC%' THEN 'SCZ'
                WHEN UPPER(c.nombre) LIKE '%ORURO%' OR UPPER(s.nombre) LIKE '%ORURO%' THEN 'ORU'
                WHEN UPPER(c.nombre) LIKE '%POTOSI%' OR UPPER(c.nombre) LIKE '%POTOSÍ%' OR UPPER(s.nombre) LIKE '%POTOSI%' THEN 'PTS'
                WHEN UPPER(c.nombre) LIKE '%TARIJA%' OR UPPER(s.nombre) LIKE '%TARIJA%' THEN 'TJA'
                WHEN UPPER(c.nombre) LIKE '%CHUQUISACA%' OR UPPER(c.nombre) LIKE '%SUCRE%' OR UPPER(s.nombre) LIKE '%SUCRE%' THEN 'CHQ'
                WHEN UPPER(c.nombre) LIKE '%BENI%' OR UPPER(s.nombre) LIKE '%BENI%' THEN 'BEN'
                WHEN UPPER(c.nombre) LIKE '%PANDO%' OR UPPER(s.nombre) LIKE '%PANDO%' THEN 'PAN'
                ELSE 'SUC' || COALESCE(m."sucursalId"::TEXT, '1')
            END,
            'LP'
        ) AS codigo_sucursal
    FROM muestras m
    LEFT JOIN sucursales s ON m."sucursalId" = s.id
    LEFT JOIN ciudades c ON s."ciudadId" = c.id
),
muestras_con_correlativo AS (
    SELECT
        id,
        numero_anterior,
        codigo_sucursal,
        ROW_NUMBER() OVER (
            PARTITION BY codigo_sucursal
            ORDER BY fecha ASC, id ASC
        ) AS correlativo
    FROM muestras_clasificadas
)
SELECT
    id,
    numero_anterior,
    codigo_sucursal,
    'MUE-' || codigo_sucursal || '-' || LPAD(correlativo::TEXT, 6, '0') AS nuevo_numero
FROM muestras_con_correlativo;

-- 2. Asignar prefijo temporal único para evitar colisiones de clave única
UPDATE muestras m
SET numero = 'TMP-MUE-' || m.id || '-' || m.numero
FROM temp_nuevos_numeros_muestras t
WHERE m.id = t.id;

-- 3. Asignar los números finales organizados (MUE-<SUC>-000001...)
UPDATE muestras m
SET numero = t.nuevo_numero,
    "actualizadoEn" = NOW()
FROM temp_nuevos_numeros_muestras t
WHERE m.id = t.id;

-- 4. Mostrar detalle de cambios realizados
SELECT
    id,
    numero_anterior,
    nuevo_numero,
    codigo_sucursal
FROM temp_nuevos_numeros_muestras
ORDER BY codigo_sucursal, nuevo_numero;

DROP TABLE temp_nuevos_numeros_muestras;

-- 5. Reporte resumen de verificación
SELECT
    COALESCE(c.nombre, s.nombre, 'Sin Sucursal') AS sucursal_ciudad,
    SUBSTRING(m.numero FROM '^([A-Z]+-[A-Z0-9]+)') AS prefijo,
    COUNT(*) AS total_registros,
    MIN(m.numero) AS primer_numero,
    MAX(m.numero) AS ultimo_numero
FROM muestras m
LEFT JOIN sucursales s ON m."sucursalId" = s.id
LEFT JOIN ciudades c ON s."ciudadId" = c.id
GROUP BY COALESCE(c.nombre, s.nombre, 'Sin Sucursal'), SUBSTRING(m.numero FROM '^([A-Z]+-[A-Z0-9]+)')
ORDER BY sucursal_ciudad, prefijo;

COMMIT;
