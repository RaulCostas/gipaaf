-- =================================================================
-- SCRIPT DE MIGRACIÓN: CORRELATIVOS DE TRASPASOS POR SUCURSAL ORIGEN
-- SISTEMA GIPAAF - FECHA: 2026-10-21
-- =================================================================
-- Este script actualiza la numeración de traspasos en la tabla `traspasos`
-- tomando como referencia la Sucursal de Origen (`sucursalOrigenId`),
-- para que cada sucursal tenga su propio correlativo independiente:
--   - La Paz:        TRASP-LP-0001, TRASP-LP-0002...
--   - Cochabamba:    TRASP-CBBA-0001, TRASP-CBBA-0002...
--   - Santa Cruz:    TRASP-SCZ-0001, TRASP-SCZ-0002...
-- =================================================================

BEGIN;

-- 1. Crear tabla temporal con el nuevo código calculado por orden cronológico y sucursal de origen
CREATE TEMP TABLE temp_nuevos_codigos_traspasos AS
WITH traspasos_clasificados AS (
    SELECT 
        t.id,
        t.codigo AS codigo_anterior,
        t."sucursalOrigenId",
        t.fecha,
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
                ELSE 'SUC' || COALESCE(t."sucursalOrigenId"::TEXT, '1')
            END,
            'LP'
        ) AS codigo_sucursal
    FROM traspasos t
    LEFT JOIN sucursales s ON t."sucursalOrigenId" = s.id
    LEFT JOIN ciudades c ON s."ciudadId" = c.id
),
traspasos_con_correlativo AS (
    SELECT 
        id,
        codigo_anterior,
        codigo_sucursal,
        ROW_NUMBER() OVER (
            PARTITION BY codigo_sucursal
            ORDER BY fecha ASC, id ASC
        ) AS correlativo
    FROM traspasos_clasificados
)
SELECT 
    id,
    codigo_anterior,
    codigo_sucursal,
    'TRASP-' || codigo_sucursal || '-' || LPAD(correlativo::TEXT, 4, '0') AS nuevo_codigo
FROM traspasos_con_correlativo;

-- 2. Asignar prefijo temporal único para evitar colisiones de restricción UNIQUE durante la actualización
UPDATE traspasos t
SET codigo = 'TMP-TRASP-' || t.id || '-' || t.codigo
WHERE t.id IN (SELECT id FROM temp_nuevos_codigos_traspasos);

-- 3. Asignar los nuevos códigos correlativos por sucursal de origen
UPDATE traspasos t
SET codigo = tmp.nuevo_codigo,
    "actualizadoEn" = NOW()
FROM temp_nuevos_codigos_traspasos tmp
WHERE t.id = tmp.id;

-- 4. Actualizar referencias en movimientos_inventario (Kardex: salida, entrada y anulaciones)
UPDATE movimientos_inventario m
SET "numeroDocumento" = CASE 
        WHEN m."numeroDocumento" = tmp.codigo_anterior THEN tmp.nuevo_codigo 
        ELSE m."numeroDocumento" 
    END,
    "motivo" = REPLACE(m."motivo", '[' || tmp.codigo_anterior || ']', '[' || tmp.nuevo_codigo || ']')
FROM temp_nuevos_codigos_traspasos tmp
WHERE m."numeroDocumento" = tmp.codigo_anterior
   OR m."motivo" LIKE '%[' || tmp.codigo_anterior || ']%';

-- 5. Actualizar referencias en detalles_traspaso y lotes si algún lote autogenerado usó el código anterior
UPDATE detalles_traspaso dt
SET "numeroLote" = REPLACE(dt."numeroLote", tmp.codigo_anterior, tmp.nuevo_codigo),
    "lotesDetalle" = REPLACE(dt."lotesDetalle", tmp.codigo_anterior, tmp.nuevo_codigo)
FROM temp_nuevos_codigos_traspasos tmp
WHERE dt."traspasoId" = tmp.id
  AND (dt."numeroLote" LIKE '%' || tmp.codigo_anterior || '%' OR dt."lotesDetalle" LIKE '%' || tmp.codigo_anterior || '%');

UPDATE lotes l
SET "numeroLote" = REPLACE(l."numeroLote", tmp.codigo_anterior, tmp.nuevo_codigo)
FROM temp_nuevos_codigos_traspasos tmp
WHERE l."numeroLote" = 'TRASP-' || tmp.codigo_anterior;

-- Limpiar tabla temporal
DROP TABLE temp_nuevos_codigos_traspasos;

-- =================================================================
-- 6. REPORTE FINAL DE VERIFICACIÓN
-- =================================================================
SELECT 
    COALESCE(c.nombre, s.nombre, 'Sin Sucursal Origen') AS sucursal_origen,
    SUBSTRING(t.codigo FROM '^TRASP-[A-Z0-9]+') AS prefijo,
    COUNT(*) AS total_traspasos,
    MIN(t.codigo) AS primer_codigo,
    MAX(t.codigo) AS ultimo_codigo
FROM traspasos t
LEFT JOIN sucursales s ON t."sucursalOrigenId" = s.id
LEFT JOIN ciudades c ON s."ciudadId" = c.id
GROUP BY COALESCE(c.nombre, s.nombre, 'Sin Sucursal Origen'), SUBSTRING(t.codigo FROM '^TRASP-[A-Z0-9]+')
ORDER BY sucursal_origen;

COMMIT;
