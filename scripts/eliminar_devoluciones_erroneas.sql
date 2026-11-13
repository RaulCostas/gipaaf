-- Script: scripts/eliminar_devoluciones_erroneas.sql
-- Propósito: 
-- 1. Eliminar definitivamente las notas de devolución DEV-LP-000001 y DEV-LP-000002 registradas por error.
-- 2. Limpiar sus detalles, movimientos de lote y movimientos de inventario asociados.
-- 3. Al eliminarse de la tabla 'notas', el contador correlativo se reinicia automáticamente y la próxima devolución creada en La Paz será DEV-LP-000001.

BEGIN;

-- 1. Eliminar movimientos de lotes asociados a los detalles de estas notas
DELETE FROM movimientos_lote
WHERE "detalleNotaId" IN (
    SELECT id FROM detalle_notas WHERE "notaId" IN (
        SELECT id FROM notas WHERE numero IN ('DEV-LP-000001', 'DEV-LP-000002')
    )
);

-- 2. Eliminar detalles de las notas
DELETE FROM detalle_notas
WHERE "notaId" IN (
    SELECT id FROM notas WHERE numero IN ('DEV-LP-000001', 'DEV-LP-000002')
);

-- 3. Eliminar lotes creados por estas notas (si existiesen)
DELETE FROM lotes
WHERE "notaIngresoId" IN (
    SELECT id FROM notas WHERE numero IN ('DEV-LP-000001', 'DEV-LP-000002')
) OR "numeroLote" LIKE 'DEV-DEV-LP-000001%' OR "numeroLote" LIKE 'DEV-DEV-LP-000002%';

-- 4. Eliminar movimientos de kardex / inventario asociados a estas notas
DELETE FROM movimientos_inventario
WHERE "numeroDocumento" IN ('DEV-LP-000001', 'DEV-LP-000002')
   OR motivo LIKE '%DEV-LP-000001%'
   OR motivo LIKE '%DEV-LP-000002%';

-- 5. Eliminar cualquier registro de cobranza o pagos vinculado (por seguridad)
DELETE FROM pagos_cobranza WHERE "notaId" IN (SELECT id FROM notas WHERE numero IN ('DEV-LP-000001', 'DEV-LP-000002'));
DELETE FROM pagos_proveedor WHERE "notaId" IN (SELECT id FROM notas WHERE numero IN ('DEV-LP-000001', 'DEV-LP-000002'));

-- 6. Eliminar definitivamente las notas de devolución
DELETE FROM notas
WHERE numero IN ('DEV-LP-000001', 'DEV-LP-000002');

COMMIT;
