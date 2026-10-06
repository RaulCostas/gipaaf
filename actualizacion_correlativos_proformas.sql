-- =================================================================
-- SCRIPT DE MIGRACIÓN: CORRELATIVOS DE PROFORMAS POR SUCURSAL
-- SISTEMA GIPAAF - FECHA: 2026-10-06
-- =================================================================
-- Este script actualiza la numeración de proformas (tipo = 'PROFORMA')
-- para que cada sucursal tenga su propio correlativo independiente:
--   - La Paz:        PRO-LP-000001, PRO-LP-000002...
--   - Cochabamba:    PRO-CBBA-000001, PRO-CBBA-000002...
--   - Santa Cruz:    PRO-SCZ-000001, PRO-SCZ-000002...
-- =================================================================

BEGIN;

-- 1. Tabla temporal con el nuevo número calculado para cada proforma por orden cronológico
CREATE TEMP TABLE temp_nuevos_numeros_proformas AS
WITH proformas_ordenadas AS (
    SELECT 
        n.id,
        n.numero AS numero_anterior,
        n."sucursalId",
        n.fecha,
        COALESCE(
            CASE 
                WHEN UPPER(c.nombre) LIKE '%COCHABAMBA%' OR UPPER(s.nombre) LIKE '%COCHABAMBA%' OR UPPER(s.nombre) LIKE '%CBBA%' THEN 'CBBA'
                WHEN UPPER(c.nombre) LIKE '%LA PAZ%' OR UPPER(s.nombre) LIKE '%LA PAZ%' OR UPPER(s.nombre) LIKE '%LP%' THEN 'LP'
                WHEN UPPER(c.nombre) LIKE '%SANTA CRUZ%' OR UPPER(s.nombre) LIKE '%SANTA CRUZ%' OR UPPER(s.nombre) LIKE '%SCZ%' THEN 'SCZ'
                WHEN UPPER(c.nombre) LIKE '%ORURO%' OR UPPER(s.nombre) LIKE '%ORURO%' THEN 'ORU'
                WHEN UPPER(c.nombre) LIKE '%POTOSI%' OR UPPER(c.nombre) LIKE '%POTOSÍ%' OR UPPER(s.nombre) LIKE '%POTOSI%' THEN 'PTS'
                WHEN UPPER(c.nombre) LIKE '%TARIJA%' OR UPPER(s.nombre) LIKE '%TARIJA%' THEN 'TJA'
                WHEN UPPER(c.nombre) LIKE '%CHUQUISACA%' OR UPPER(c.nombre) LIKE '%SUCRE%' OR UPPER(s.nombre) LIKE '%SUCRE%' THEN 'CHQ'
                WHEN UPPER(c.nombre) LIKE '%BENI%' OR UPPER(s.nombre) LIKE '%BENI%' THEN 'BEN'
                WHEN UPPER(c.nombre) LIKE '%PANDO%' OR UPPER(s.nombre) LIKE '%PANDO%' THEN 'PAN'
                ELSE 'SUC' || COALESCE(n."sucursalId"::TEXT, '1')
            END,
            'LP'
        ) AS codigo_sucursal,
        ROW_NUMBER() OVER (
            PARTITION BY COALESCE(
                CASE 
                    WHEN UPPER(c.nombre) LIKE '%COCHABAMBA%' OR UPPER(s.nombre) LIKE '%COCHABAMBA%' OR UPPER(s.nombre) LIKE '%CBBA%' THEN 'CBBA'
                    WHEN UPPER(c.nombre) LIKE '%LA PAZ%' OR UPPER(s.nombre) LIKE '%LA PAZ%' OR UPPER(s.nombre) LIKE '%LP%' THEN 'LP'
                    WHEN UPPER(c.nombre) LIKE '%SANTA CRUZ%' OR UPPER(s.nombre) LIKE '%SANTA CRUZ%' OR UPPER(s.nombre) LIKE '%SCZ%' THEN 'SCZ'
                    WHEN UPPER(c.nombre) LIKE '%ORURO%' OR UPPER(s.nombre) LIKE '%ORURO%' THEN 'ORU'
                    WHEN UPPER(c.nombre) LIKE '%POTOSI%' OR UPPER(c.nombre) LIKE '%POTOSÍ%' OR UPPER(s.nombre) LIKE '%POTOSI%' THEN 'PTS'
                    WHEN UPPER(c.nombre) LIKE '%TARIJA%' OR UPPER(s.nombre) LIKE '%TARIJA%' THEN 'TJA'
                    WHEN UPPER(c.nombre) LIKE '%CHUQUISACA%' OR UPPER(c.nombre) LIKE '%SUCRE%' OR UPPER(s.nombre) LIKE '%SUCRE%' THEN 'CHQ'
                    WHEN UPPER(c.nombre) LIKE '%BENI%' OR UPPER(s.nombre) LIKE '%BENI%' THEN 'BEN'
                    WHEN UPPER(c.nombre) LIKE '%PANDO%' OR UPPER(s.nombre) LIKE '%PANDO%' THEN 'PAN'
                    ELSE 'SUC' || COALESCE(n."sucursalId"::TEXT, '1')
                END,
                'LP'
            )
            ORDER BY n.fecha ASC, n.id ASC
        ) AS correlativo
    FROM notas n
    LEFT JOIN sucursales s ON n."sucursalId" = s.id
    LEFT JOIN ciudades c ON s."ciudadId" = c.id
    WHERE n.tipo = 'PROFORMA'
)
SELECT 
    id,
    numero_anterior,
    'PRO-' || codigo_sucursal || '-' || LPAD(correlativo::TEXT, 6, '0') AS nuevo_numero
FROM proformas_ordenadas;

-- 2. Asignar prefijo temporal para evitar colisiones de unicidad
UPDATE notas n
SET numero = 'TMP-PRO-' || n.id || '-' || n.numero
WHERE n.id IN (SELECT id FROM temp_nuevos_numeros_proformas);

-- 3. Asignar los nuevos números correlativos por sucursal
UPDATE notas n
SET numero = t.nuevo_numero,
    "actualizadoEn" = NOW()
FROM temp_nuevos_numeros_proformas t
WHERE n.id = t.id;

-- 4. Actualizar referencias en observaciones de notas de venta si mencionaban la proforma original
UPDATE notas v
SET observaciones = REPLACE(v.observaciones, t.numero_anterior, t.nuevo_numero)
FROM temp_nuevos_numeros_proformas t
WHERE v.tipo = 'VENTA' AND v.observaciones LIKE '%' || t.numero_anterior || '%';

-- Limpiar tabla temporal
DROP TABLE temp_nuevos_numeros_proformas;

-- =================================================================
-- 5. REPORTE FINAL DE VERIFICACIÓN
-- =================================================================
SELECT 
    COALESCE(c.nombre, s.nombre, 'Sin Sucursal') AS sucursal_ciudad,
    SUBSTRING(n.numero FROM '^PRO-[A-Z0-9]+') AS prefijo,
    COUNT(*) AS total_proformas,
    MIN(n.numero) AS primer_numero,
    MAX(n.numero) AS ultimo_numero
FROM notas n
LEFT JOIN sucursales s ON n."sucursalId" = s.id
LEFT JOIN ciudades c ON s."ciudadId" = c.id
WHERE n.tipo = 'PROFORMA'
GROUP BY COALESCE(c.nombre, s.nombre, 'Sin Sucursal'), SUBSTRING(n.numero FROM '^PRO-[A-Z0-9]+')
ORDER BY sucursal_ciudad;

COMMIT;
