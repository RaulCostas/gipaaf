-- =================================================================
-- SCRIPT DE LIMPIEZA: ELIMINAR MOVIMIENTOS Y LOTES INVENTARIO_INICIAL
-- CON PREFIJO DE OTRA SUCURSAL (EJ. L-INI-CBBA EN LA PAZ)
-- =================================================================

BEGIN;

-- 1. Eliminar movimientos de inventario_inicial asignados a una sucursal equivocada
DELETE FROM movimientos_inventario mi
USING inventario inv
JOIN sucursales s ON inv."sucursalId" = s.id
LEFT JOIN ciudades c ON s."ciudadId" = c.id
WHERE mi."inventarioId" = inv.id
  AND mi.tipo = 'INVENTARIO_INICIAL'
  AND (
    (mi."numeroDocumento" LIKE 'L-INI-CBBA-%'
      AND UPPER(COALESCE(s.nombre, '') || ' ' || COALESCE(c.nombre, '')) NOT LIKE '%CBBA%'
      AND UPPER(COALESCE(s.nombre, '') || ' ' || COALESCE(c.nombre, '')) NOT LIKE '%COCHABAMBA%')
    OR
    (mi."numeroDocumento" LIKE 'L-INI-LP-%'
      AND UPPER(COALESCE(s.nombre, '') || ' ' || COALESCE(c.nombre, '')) NOT LIKE '%LA PAZ%'
      AND UPPER(COALESCE(s.nombre, '') || ' ' || COALESCE(c.nombre, '')) NOT LIKE '%LP%')
  );

COMMIT;
