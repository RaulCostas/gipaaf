-- =================================================================
-- SCRIPT DE MIGRACIÓN: CORRELATIVOS DE VENTAS Y SALDOS INICIALES POR SUCURSAL
-- SISTEMA GIPAAF - FECHA: 2026-10-06
-- =================================================================
-- Este script organiza y re-numera:
-- 1. Saldos Iniciales (observaciones que empiezan con "Saldo inicial"):
--    -> SAL-LP-000001, SAL-LP-000002...
--    -> SAL-CBBA-000001, SAL-CBBA-000002...
-- 2. Ventas Reales (todas las ventas normales):
--    -> VEN-LP-000001, VEN-LP-000002... (inicia desde 1)
--    -> VEN-CBBA-000001, VEN-CBBA-000002... (inicia desde 1)
-- =================================================================

BEGIN;

-- 1. Crear tabla temporal con el nuevo número asignado según sea Saldo Inicial o Venta Real
CREATE TEMP TABLE temp_nuevos_numeros AS
WITH notas_clasificadas AS (
    SELECT 
        n.id,
        n.numero AS numero_anterior,
        n."sucursalId",
        n.fecha,
        CASE 
            WHEN TRIM(COALESCE(n.observaciones, '')) ILIKE 'Saldo inicial%' 
              OR TRIM(COALESCE(n.observaciones, '')) ILIKE 'Saldo_inicial%'
              OR n.numero ILIKE 'SAL-%'
            THEN 'SAL'
            ELSE 'VEN'
        END AS grupo_tipo,
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
        ) AS codigo_sucursal
    FROM notas n
    LEFT JOIN sucursales s ON n."sucursalId" = s.id
    LEFT JOIN ciudades c ON s."ciudadId" = c.id
    WHERE n.tipo = 'VENTA'
),
notas_con_correlativo AS (
    SELECT 
        id,
        numero_anterior,
        grupo_tipo,
        codigo_sucursal,
        ROW_NUMBER() OVER (
            PARTITION BY grupo_tipo, codigo_sucursal
            ORDER BY fecha ASC, id ASC
        ) AS correlativo
    FROM notas_clasificadas
)
SELECT 
    id,
    numero_anterior,
    grupo_tipo,
    codigo_sucursal,
    grupo_tipo || '-' || codigo_sucursal || '-' || LPAD(correlativo::TEXT, 6, '0') AS nuevo_numero
FROM notas_con_correlativo;

-- 2. Asignar prefijo temporal único para evitar colisiones durante la re-numeración
UPDATE notas n
SET numero = 'TMP-' || t.grupo_tipo || '-' || n.id || '-' || n.numero
FROM temp_nuevos_numeros t
WHERE n.id = t.id;

-- 3. Asignar los números finales organizados (SAL-... y VEN-...)
UPDATE notas n
SET numero = t.nuevo_numero,
    "actualizadoEn" = NOW()
FROM temp_nuevos_numeros t
WHERE n.id = t.id;

-- 4. Actualizar referencias en movimientos_inventario (Kardex)
UPDATE movimientos_inventario m
SET "numeroDocumento" = t.nuevo_numero,
    "motivo" = REPLACE(m."motivo", t.numero_anterior, t.nuevo_numero)
FROM temp_nuevos_numeros t
WHERE m."numeroDocumento" = t.numero_anterior;

-- 5. Actualizar referencias en observaciones de proformas convertidas si existiesen
UPDATE notas p
SET observaciones = REPLACE(p.observaciones, t.numero_anterior, t.nuevo_numero)
FROM temp_nuevos_numeros t
WHERE p.tipo = 'PROFORMA' AND p.observaciones LIKE '%' || t.numero_anterior || '%';

-- Limpiar tabla temporal
DROP TABLE temp_nuevos_numeros;

-- =================================================================
-- 6. REPORTE FINAL DE VERIFICACIÓN
-- =================================================================
SELECT 
    COALESCE(c.nombre, s.nombre, 'Sin Sucursal') AS sucursal_ciudad,
    SUBSTRING(n.numero FROM '^([A-Z]+-[A-Z0-9]+)') AS prefijo,
    COUNT(*) AS total_registros,
    MIN(n.numero) AS primer_numero,
    MAX(n.numero) AS ultimo_numero
FROM notas n
LEFT JOIN sucursales s ON n."sucursalId" = s.id
LEFT JOIN ciudades c ON s."ciudadId" = c.id
WHERE n.tipo = 'VENTA'
GROUP BY COALESCE(c.nombre, s.nombre, 'Sin Sucursal'), SUBSTRING(n.numero FROM '^([A-Z]+-[A-Z0-9]+)')
ORDER BY sucursal_ciudad, prefijo;

COMMIT;
