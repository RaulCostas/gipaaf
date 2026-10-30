-- =========================================================================
-- MERMAS HISTÓRICAS SUCURSAL LA PAZ - hasta 30/10/2026
-- Generado para ejecución directa en DBeaver (Producción)
-- Total productos: 130
-- IMPORTANTE:
--   1. Solo inserta en movimientos_inventario (tipo = MERMA)
--   2. NO modifica inventario.stockActual ni la tabla lotes
--   3. Resuelve inventarioId dinámicamente por (código de producto + sucursal)
--   4. Es idempotente (evita duplicados si se corre más de una vez)
-- =========================================================================

BEGIN;

-- [004783.22] Acelerador de Secado p/ PU Brz 225ml (5 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    5,
    'Merma histórica [004783.22] - Sistema anterior',
    'MERMA-LP-HIST-004783.22',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '004783.22'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-004783.22'
  );

-- [005183.90] Barniz HS HT 70 2:1 15% Brz 900ml (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [005183.90] - Sistema anterior',
    'MERMA-LP-HIST-005183.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '005183.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-005183.90'
  );

-- [004183.60] Barniz Mate HT 2:1 Brz 600ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [004183.60] - Sistema anterior',
    'MERMA-LP-HIST-004183.60',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '004183.60'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-004183.60'
  );

-- [000783.75] Barniz PU HG 7700 turbo 5:1 Brz 750ml (8 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    8,
    'Merma histórica [000783.75] - Sistema anterior',
    'MERMA-LP-HIST-000783.75',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '000783.75'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-000783.75'
  );

-- [000583.75] Barniz PU HP 6000 Brz 750ml (7 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    7,
    'Merma histórica [000583.75] - Sistema anterior',
    'MERMA-LP-HIST-000583.75',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '000583.75'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-000583.75'
  );

-- [700889L.36] BL 8123 Negro Brz 3.6l (16 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    16,
    'Merma histórica [700889L.36] - Sistema anterior',
    'MERMA-LP-HIST-700889L.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 06/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700889L.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700889L.36'
  );

-- [401889L.90] BL 8227 Violeta Rojizo Brz 900ml (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [401889L.90] - Sistema anterior',
    'MERMA-LP-HIST-401889L.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '401889L.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-401889L.90'
  );

-- [302089L.36] BL 8229 Rojo Limpio Brz 3.6l (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [302089L.36] - Sistema anterior',
    'MERMA-LP-HIST-302089L.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 05/23',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '302089L.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-302089L.36'
  );

-- [100689L.36] BL 8321 Blanco Brz 3.6l (5 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    5,
    'Merma histórica [100689L.36] - Sistema anterior',
    'MERMA-LP-HIST-100689L.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 01/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '100689L.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-100689L.36'
  );

-- [201889L.36] BL 8324 Amarillo Verdoso 3.6l (9 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    9,
    'Merma histórica [201889L.36] - Sistema anterior',
    'MERMA-LP-HIST-201889L.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '201889L.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-201889L.36'
  );

-- [201789L.36] BL 8326 Amarillo Óxido Brz 3.6l (8 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    8,
    'Merma histórica [201789L.36] - Sistema anterior',
    'MERMA-LP-HIST-201789L.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/24',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '201789L.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-201789L.36'
  );

-- [302189L.90] BL 8424 Rojo Óxido Brz 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [302189L.90] - Sistema anterior',
    'MERMA-LP-HIST-302189L.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/24',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '302189L.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-302189L.90'
  );

-- [700289B.36] BP 8072 Negro Brz 3.6l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [700289B.36] - Sistema anterior',
    'MERMA-LP-HIST-700289B.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 01/23',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700289B.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700289B.36'
  );

-- [400789B.90] BP 8079 Azul (verdoso) Brz 900ml (43 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    43,
    'Merma histórica [400789B.90] - Sistema anterior',
    'MERMA-LP-HIST-400789B.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 05/25',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '400789B.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-400789B.90'
  );

-- [100289B.36] BP 8371 Blanco Puro Brz 3.6l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [100289B.36] - Sistema anterior',
    'MERMA-LP-HIST-100289B.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '100289B.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-100289B.36'
  );

-- [700389B.90] BP 8472 Negro Azulado Brz 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [700389B.90] - Sistema anterior',
    'MERMA-LP-HIST-700389B.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/25',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700389B.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700389B.90'
  );

-- [802289B.90] BP 8779 Perlado Oro Brz 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [802289B.90] - Sistema anterior',
    'MERMA-LP-HIST-802289B.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '802289B.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-802289B.90'
  );

-- [800789B.36] BP 8973 Aluminio Brillante Brz 3.6l (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [800789B.36] - Sistema anterior',
    'MERMA-LP-HIST-800789B.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 10/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '800789B.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-800789B.36'
  );

-- [700789S.36] BS 8012 Negro Brz 3.6l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [700789S.36] - Sistema anterior',
    'MERMA-LP-HIST-700789S.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700789S.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700789S.36'
  );

-- [201689S.36] BS 8014 Amarillo Limón Verdoso Brz 3.6l (3 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    3,
    'Merma histórica [201689S.36] - Sistema anterior',
    'MERMA-LP-HIST-201689S.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 06/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '201689S.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-201689S.36'
  );

-- [100589S.36] BS 8511 Blanco Brz 3.6l (4 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    4,
    'Merma histórica [100589S.36] - Sistema anterior',
    'MERMA-LP-HIST-100589S.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '100589S.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-100589S.36'
  );

-- [010183.45] Catalizador p/ HT 50 Brz 450ml (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [010183.45] - Sistema anterior',
    'MERMA-LP-HIST-010183.45',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '010183.45'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-010183.45'
  );

-- [000383.10] Catalizador normal p/primer 8:1 Brz 100ml (180 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    180,
    'Merma histórica [000383.10] - Sistema anterior',
    'MERMA-LP-HIST-000383.10',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '000383.10'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-000383.10'
  );

-- [000281.15] Catalizador p/ Esmalte Sintético Brz 150ml (109 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    109,
    'Merma histórica [000281.15] - Sistema anterior',
    'MERMA-LP-HIST-000281.15',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '000281.15'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-000281.15'
  );

-- [000185.30] Catalizador p/ Negro Mate/Wash P Brz 300ml (7 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    7,
    'Merma histórica [000185.30] - Sistema anterior',
    'MERMA-LP-HIST-000185.30',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '000185.30'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-000185.30'
  );

-- [009383.15] Catalizador p/HG 7700 Brz 150ml (44 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    44,
    'Merma histórica [009383.15] - Sistema anterior',
    'MERMA-LP-HIST-009383.15',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '009383.15'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-009383.15'
  );

-- [009483.15] Catalizador p/HP 6000 Brz 150ml (27 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    27,
    'Merma histórica [009483.15] - Sistema anterior',
    'MERMA-LP-HIST-009483.15',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 07/23',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '009483.15'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-009483.15'
  );

-- [005783.45] Catalizador p/HT 71 Rapido Brz 450ml (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [005783.45] - Sistema anterior',
    'MERMA-LP-HIST-005783.45',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '005783.45'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-005783.45'
  );

-- [009583.22] Catalizador rápido p/ PU Brz 225ml (8 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    8,
    'Merma histórica [009583.22] - Sistema anterior',
    'MERMA-LP-HIST-009583.22',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '009583.22'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-009583.22'
  );

-- [009583.45] Catalizador rápido p/ PU Brz 450ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [009583.45] - Sistema anterior',
    'MERMA-LP-HIST-009583.45',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '009583.45'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-009583.45'
  );

-- [011383.15] Catalizador rápido p/primer HS 5:1:1 Brz 150ml (1310 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1310,
    'Merma histórica [011383.15] - Sistema anterior',
    'MERMA-LP-HIST-011383.15',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '011383.15'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-011383.15'
  );

-- [111983.90] Colordur Blanco Toyota 056 Brz 900ml (10 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    10,
    'Merma histórica [111983.90] - Sistema anterior',
    'MERMA-LP-HIST-111983.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '111983.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-111983.90'
  );

-- [112083.90] Colordur Blanco Toyota 058 Brz 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [112083.90] - Sistema anterior',
    'MERMA-LP-HIST-112083.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '112083.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-112083.90'
  );

-- [202782.90] Colorlac Amarillo Cat.77 Brz 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [202782.90] - Sistema anterior',
    'MERMA-LP-HIST-202782.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 07/23',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '202782.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-202782.90'
  );

-- [101682.36] Colorlac Blanco Puro Brz 3.6l (8 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    8,
    'Merma histórica [101682.36] - Sistema anterior',
    'MERMA-LP-HIST-101682.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '101682.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-101682.36'
  );

-- [111482.36] Colorlac Blanco Toyota 040 Brz 3.6l (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [111482.36] - Sistema anterior',
    'MERMA-LP-HIST-111482.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/24',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '111482.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-111482.36'
  );

-- [111482.90] Colorlac Blanco Toyota 040 Brz 900ml (8 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    8,
    'Merma histórica [111482.90] - Sistema anterior',
    'MERMA-LP-HIST-111482.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '111482.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-111482.90'
  );

-- [111582.90] Colorlac Blanco Toyota 041 Brz 900ml (390 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    390,
    'Merma histórica [111582.90] - Sistema anterior',
    'MERMA-LP-HIST-111582.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '111582.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-111582.90'
  );

-- [111682.90] Colorlac Blanco Toyota 056 Brz 900ml (18 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    18,
    'Merma histórica [111682.90] - Sistema anterior',
    'MERMA-LP-HIST-111682.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '111682.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-111682.90'
  );

-- [111782.90] Colorlac Blanco Toyota 058 Brz 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [111782.90] - Sistema anterior',
    'MERMA-LP-HIST-111782.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '111782.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-111782.90'
  );

-- [700582.36] Colorlac Negro Cadilac Brz 3.6l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [700582.36] - Sistema anterior',
    'MERMA-LP-HIST-700582.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700582.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700582.36'
  );

-- [700582.90] Colorlac Negro Cadilac Brz 900ml (3 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    3,
    'Merma histórica [700582.90] - Sistema anterior',
    'MERMA-LP-HIST-700582.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700582.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700582.90'
  );

-- [700282.90] Colorlac Negro Mate Brz 900ml (5 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    5,
    'Merma histórica [700282.90] - Sistema anterior',
    'MERMA-LP-HIST-700282.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700282.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700282.90'
  );

-- [304782.90] Colorlac Rojo Flash II VW 04 Brz 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [304782.90] - Sistema anterior',
    'MERMA-LP-HIST-304782.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '304782.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-304782.90'
  );

-- [304382.90] Colorlac Rojo Munique Ford 92 Brz 900ml (90 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    90,
    'Merma histórica [304382.90] - Sistema anterior',
    'MERMA-LP-HIST-304382.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '304382.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-304382.90'
  );

-- [304282.90] Colorlac Rojo Tornado VW Brz 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [304282.90] - Sistema anterior',
    'MERMA-LP-HIST-304282.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '304282.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-304282.90'
  );

-- [304082.90] Colorlac Rojo Vino GM 75 Brz 900ml (103 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    103,
    'Merma histórica [304082.90] - Sistema anterior',
    'MERMA-LP-HIST-304082.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '304082.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-304082.90'
  );

-- [311782.36] Colorlac Rojo Vivo Brz 3.6l (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [311782.36] - Sistema anterior',
    'MERMA-LP-HIST-311782.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/24',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '311782.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-311782.36'
  );

-- [700281.90] Colorlux Negro Mate Brz 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [700281.90] - Sistema anterior',
    'MERMA-LP-HIST-700281.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700281.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700281.90'
  );

-- [004483.22] Endurecedor p/ Quick Primer 4:1 Brz 225ml (150 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    150,
    'Merma histórica [004483.22] - Sistema anterior',
    'MERMA-LP-HIST-004483.22',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 10/19',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '004483.22'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-004483.22'
  );

-- [400872.90] Esmalte Sintético Alkylux Azul Francia Brz 900ml (85 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    85,
    'Merma histórica [400872.90] - Sistema anterior',
    'MERMA-LP-HIST-400872.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/24',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '400872.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-400872.90'
  );

-- [100179.40] Kit Vedador Capó blanco Brz 400g (4 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    4,
    'Merma histórica [100179.40] - Sistema anterior',
    'MERMA-LP-HIST-100179.40',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 08/25',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '100179.40'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-100179.40'
  );

-- [700685.90] Masa Rápida Gris Brz 900ml (72 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    72,
    'Merma histórica [700685.90] - Sistema anterior',
    'MERMA-LP-HIST-700685.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 07/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700685.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700685.90'
  );

-- [001085.90] Pasta Mateante Brz 900ml (11 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    11,
    'Merma histórica [001085.90] - Sistema anterior',
    'MERMA-LP-HIST-001085.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 01/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '001085.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-001085.90'
  );

-- [208083.80] Primer PU Beige 8:1 Brz 800ml (12 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    12,
    'Merma histórica [208083.80] - Sistema anterior',
    'MERMA-LP-HIST-208083.80',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 10/19',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '208083.80'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-208083.80'
  );

-- [100385.90] Primer Univeral Blanco Brz 900ml (13 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    13,
    'Merma histórica [100385.90] - Sistema anterior',
    'MERMA-LP-HIST-100385.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '100385.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-100385.90'
  );

-- [700185.90] Primer Universal Gris Brz 900ml (397 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    397,
    'Merma histórica [700185.90] - Sistema anterior',
    'MERMA-LP-HIST-700185.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 08/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '700185.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-700185.90'
  );

-- [201289P.90] PU 8034 Amarillo Brz 900ml (8 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    8,
    'Merma histórica [201289P.90] - Sistema anterior',
    'MERMA-LP-HIST-201289P.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 10/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '201289P.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-201289P.90'
  );

-- [200989P.36] PU 8138 Naranja Brz 3.6l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [200989P.36] - Sistema anterior',
    'MERMA-LP-HIST-200989P.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '200989P.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-200989P.36'
  );

-- [301089P.36] PU 8230 Rojo Claro Brz 3.6l (7 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    7,
    'Merma histórica [301089P.36] - Sistema anterior',
    'MERMA-LP-HIST-301089P.36',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '301089P.36'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-301089P.36'
  );

-- [716883.90] Quick Primer PU 4:1:15% Brz 900ml (150 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    150,
    'Merma histórica [716883.90] - Sistema anterior',
    'MERMA-LP-HIST-716883.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '716883.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-716883.90'
  );

-- [716983.75] Quick Primer PU Cinza 5:1 Brz 750ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [716983.75] - Sistema anterior',
    'MERMA-LP-HIST-716983.75',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 06/18',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '716983.75'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-716983.75'
  );

-- [000285.90] Removedor Pastoso E Brz 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [000285.90] - Sistema anterior',
    'MERMA-LP-HIST-000285.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '000285.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-000285.90'
  );

-- [000581S.45] Solución Secante p/Esm. Sintético Brz 450ml (143 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    143,
    'Merma histórica [000581S.45] - Sistema anterior',
    'MERMA-LP-HIST-000581S.45',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 05/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '000581S.45'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-000581S.45'
  );

-- [000581S.90] Solución Secante p/Esm. Sintético Brz 900ml (56 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    56,
    'Merma histórica [000581S.90] - Sistema anterior',
    'MERMA-LP-HIST-000581S.90',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 08/19',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '000581S.90'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-000581S.90'
  );

-- [AA-66261171568] Lija de Fierro DA Grano 40 (50 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    50,
    'Merma histórica [AA-66261171568] - Sistema anterior',
    'MERMA-LP-HIST-AA-66261171568',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'AA-66261171568'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-AA-66261171568'
  );

-- [IC-1K160] 1K160 Aglutinante Balance 1K IC 3.75l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [IC-1K160] - Sistema anterior',
    'MERMA-LP-HIST-IC-1K160',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'IC-1K160'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-IC-1K160'
  );

-- [IC-1KS18] 1KS18 Pol. Aluminio Grueso IC 3.75l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [IC-1KS18] - Sistema anterior',
    'MERMA-LP-HIST-IC-1KS18',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'IC-1KS18'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-IC-1KS18'
  );

-- [A21-09772] Masilla Plástica Gris P2001 1kg (11 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    11,
    'Merma histórica [A21-09772] - Sistema anterior',
    'MERMA-LP-HIST-A21-09772',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'A21-09772'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-A21-09772'
  );

-- [A21-09777] Masilla Plástica Superior P2001 1kg (53 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    53,
    'Merma histórica [A21-09777] - Sistema anterior',
    'MERMA-LP-HIST-A21-09777',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'A21-09777'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-A21-09777'
  );

-- [A21-16090] Masilla Poliester P2001 4k (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [A21-16090] - Sistema anterior',
    'MERMA-LP-HIST-A21-16090',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'A21-16090'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-A21-16090'
  );

-- [A21-16685] Masilla Poliester P2001 5.0kg (14 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    14,
    'Merma histórica [A21-16685] - Sistema anterior',
    'MERMA-LP-HIST-A21-16685',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'A21-16685'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-A21-16685'
  );

-- [A21-09791] Removedor Pastoso P2001 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [A21-09791] - Sistema anterior',
    'MERMA-LP-HIST-A21-09791',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'A21-09791'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-A21-09791'
  );

-- [A21-09782] Resina para Laminación P2001 900g (7 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    7,
    'Merma histórica [A21-09782] - Sistema anterior',
    'MERMA-LP-HIST-A21-09782',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'A21-09782'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-A21-09782'
  );

-- [PR-S01] 2K Blanco Puro JW 3.75l (16 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    16,
    'Merma histórica [PR-S01] - Sistema anterior',
    'MERMA-LP-HIST-PR-S01',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'PR-S01'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-PR-S01'
  );

-- [PR-040] 2K Blanco Toyota 040 JW 1l (15 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    15,
    'Merma histórica [PR-040] - Sistema anterior',
    'MERMA-LP-HIST-PR-040',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'PR-040'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-PR-040'
  );

-- [PR-3000L] Barniz MS 2:1 JW 1l (4 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    4,
    'Merma histórica [PR-3000L] - Sistema anterior',
    'MERMA-LP-HIST-PR-3000L',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'PR-3000L'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-PR-3000L'
  );

-- [PR-CAT-M] Catalizador Rápido p/2:1 JW 500ml (866 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    866,
    'Merma histórica [PR-CAT-M] - Sistema anterior',
    'MERMA-LP-HIST-PR-CAT-M',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'PR-CAT-M'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-PR-CAT-M'
  );

-- [R-CAT-CX] Catalizador Mek RQ 10gr (761 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    761,
    'Merma histórica [R-CAT-CX] - Sistema anterior',
    'MERMA-LP-HIST-R-CAT-CX',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-CAT-CX'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-CAT-CX'
  );

-- [R-CPU0411-CX1] Catalizador para Primer PU 411 RQ 225ml (10 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    10,
    'Merma histórica [R-CPU0411-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-CPU0411-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-CPU0411-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-CPU0411-CX1'
  );

-- [R-CPU0511-CX1] Catalizador para Primer PU 511 RQ 150ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [R-CPU0511-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-CPU0511-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-CPU0511-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-CPU0511-CX1'
  );

-- [R-BAP0900-CX2] Emborrachamiento Negro RQ 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [R-BAP0900-CX2] - Sistema anterior',
    'MERMA-LP-HIST-R-BAP0900-CX2',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-BAP0900-CX2'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-BAP0900-CX2'
  );

-- [R-APL1000CIZCX1] Masilla Plástica Gris (GFix) RQ 1kg (111 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    111,
    'Merma histórica [R-APL1000CIZCX1] - Sistema anterior',
    'MERMA-LP-HIST-R-APL1000CIZCX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-APL1000CIZCX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-APL1000CIZCX1'
  );

-- [R-APO750-CX1] Masilla Poliester Fixlight RQ 750gr (10 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    10,
    'Merma histórica [R-APO750-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-APO750-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-APO750-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-APO750-CX1'
  );

-- [R-APO900-CX1] Masilla Poliester Fixlight RQ 900gr (13 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    13,
    'Merma histórica [R-APO900-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-APO900-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 11/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-APO900-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-APO900-CX1'
  );

-- [R-MPO1000-CX1] Massa de Pulir N"2 Base Agua RQ 1000gr (9 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    9,
    'Merma histórica [R-MPO1000-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-MPO1000-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 01/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-MPO1000-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-MPO1000-CX1'
  );

-- [R-PPU0511-CX1] Primer PU 511 RQ 750ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [R-PPU0511-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-PPU0511-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-PPU0511-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-PPU0511-CX1'
  );

-- [R-RPA1000-CX1] Removedor Pastoso RQ 1kg (5 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    5,
    'Merma histórica [R-RPA1000-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-RPA1000-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-RPA1000-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-RPA1000-CX1'
  );

-- [R-RPA0500-CX1] Removedor Pastoso RQ 500gr (16 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    16,
    'Merma histórica [R-RPA0500-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-RPA0500-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-RPA0500-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-RPA0500-CX1'
  );

-- [R-APLO800-CX1] Resina para Laminación RQ 800gr (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [R-APLO800-CX1] - Sistema anterior',
    'MERMA-LP-HIST-R-APLO800-CX1',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'R-APLO800-CX1'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-R-APLO800-CX1'
  );

-- [1600AD500017] AD 500 Poliéster Aditivo de Efecto SW 900ml (8 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    8,
    'Merma histórica [1600AD500017] - Sistema anterior',
    'MERMA-LP-HIST-1600AD500017',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 08/19',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '1600AD500017'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-1600AD500017'
  );

-- [0500AL300523] Adhesivo Ligth SW 495ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [0500AL300523] - Sistema anterior',
    'MERMA-LP-HIST-0500AL300523',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0500AL300523'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0500AL300523'
  );

-- [045008937442] Barniz Alto Sólido 8937 SW 900ml (11 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    11,
    'Merma histórica [045008937442] - Sistema anterior',
    'MERMA-LP-HIST-045008937442',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 09/23',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '045008937442'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-045008937442'
  );

-- [045006100520] Barniz Poliuretano 6100 A+B (kit) SW 900ml (24 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    24,
    'Merma histórica [045006100520] - Sistema anterior',
    'MERMA-LP-HIST-045006100520',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 09/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '045006100520'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-045006100520'
  );

-- [045B08000520] Barniz Poliuretano 8000 A+B (kit) SW 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [045B08000520] - Sistema anterior',
    'MERMA-LP-HIST-045B08000520',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 07/24',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '045B08000520'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-045B08000520'
  );

-- [155008050520] Barniz Poliuretano 8050 A+B (kit) SW 900ml (5 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    5,
    'Merma histórica [155008050520] - Sistema anterior',
    'MERMA-LP-HIST-155008050520',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '155008050520'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-155008050520'
  );

-- [056600H41645] Catalizador p/Primer H41 SW 180ml (40 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    40,
    'Merma histórica [056600H41645] - Sistema anterior',
    'MERMA-LP-HIST-056600H41645',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '056600H41645'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-056600H41645'
  );

-- [056600H81262] Catalizador p/Primer H81 SW 100ml (48 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    48,
    'Merma histórica [056600H81262] - Sistema anterior',
    'MERMA-LP-HIST-056600H81262',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '056600H81262'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-056600H81262'
  );

-- [050000051015] Catalizador p/Wash P. y Negro Mate SW 300ml (110 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    110,
    'Merma histórica [050000051015] - Sistema anterior',
    'MERMA-LP-HIST-050000051015',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '050000051015'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-050000051015'
  );

-- [050000070004] Emborrachamiento Automotivo Negro SW 900ml (18 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    18,
    'Merma histórica [050000070004] - Sistema anterior',
    'MERMA-LP-HIST-050000070004',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '050000070004'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-050000070004'
  );

-- [156689120175] Endurecedor p/Barniz 8937 SW 450ml (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [156689120175] - Sistema anterior',
    'MERMA-LP-HIST-156689120175',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '156689120175'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-156689120175'
  );

-- [0700LM401001] LM 401 Poliéster Negro SW 3.6l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [0700LM401001] - Sistema anterior',
    'MERMA-LP-HIST-0700LM401001',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 07/25',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM401001'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM401001'
  );

-- [0700LM402004] LM 402 Poliéster Blanco SW 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [0700LM402004] - Sistema anterior',
    'MERMA-LP-HIST-0700LM402004',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM402004'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM402004'
  );

-- [0700LM414017] LM 414 Poliéster Rojo Óxido SW 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [0700LM414017] - Sistema anterior',
    'MERMA-LP-HIST-0700LM414017',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 05/25',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM414017'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM414017'
  );

-- [0700LM415017] LM 415 Poliéster Naranja Claro SW 900ml (3 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    3,
    'Merma histórica [0700LM415017] - Sistema anterior',
    'MERMA-LP-HIST-0700LM415017',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM415017'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM415017'
  );

-- [0700LM421017] LM 421 Poliéster Amarillo Cromo SW 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [0700LM421017] - Sistema anterior',
    'MERMA-LP-HIST-0700LM421017',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/24',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM421017'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM421017'
  );

-- [0700LM430001] LM 430 Poliéster Blanco Puro SW 3.6l (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [0700LM430001] - Sistema anterior',
    'MERMA-LP-HIST-0700LM430001',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 08/23',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM430001'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM430001'
  );

-- [0700LM437017] LM 437 Poliéster Violeta Rojizo SW 900ml (3 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    3,
    'Merma histórica [0700LM437017] - Sistema anterior',
    'MERMA-LP-HIST-0700LM437017',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/23',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM437017'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM437017'
  );

-- [0700LM439017] LM 439 Poliéster Violeta SW 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [0700LM439017] - Sistema anterior',
    'MERMA-LP-HIST-0700LM439017',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM439017'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM439017'
  );

-- [0700LM441017] LM 441 Poliéster Negro Azulado SW 900ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [0700LM441017] - Sistema anterior',
    'MERMA-LP-HIST-0700LM441017',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM441017'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM441017'
  );

-- [0700LM442027] LM 442 Poliéster Negro Profundo SW 3.6l (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [0700LM442027] - Sistema anterior',
    'MERMA-LP-HIST-0700LM442027',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM442027'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM442027'
  );

-- [0700LM491001] LM 491 Poliéster Aluminio Fino SW 3.6l (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [0700LM491001] - Sistema anterior',
    'MERMA-LP-HIST-0700LM491001',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 12/21',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM491001'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM491001'
  );

-- [0700LM493027] LM 493 Poliéster Aluminio Extra Grueso SW 3.6l (3 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    3,
    'Merma histórica [0700LM493027] - Sistema anterior',
    'MERMA-LP-HIST-0700LM493027',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 03/23',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0700LM493027'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0700LM493027'
  );

-- [013000031391] Masa Rápida Gris SW 900ml (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [013000031391] - Sistema anterior',
    'MERMA-LP-HIST-013000031391',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 08/19',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '013000031391'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-013000031391'
  );

-- [05000M500496] Masilla para Plástico SW 400ml (4 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    4,
    'Merma histórica [05000M500496] - Sistema anterior',
    'MERMA-LP-HIST-05000M500496',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '05000M500496'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-05000M500496'
  );

-- [0500M3500328] Masilla Poliester SW 1.5 Kg (3 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    3,
    'Merma histórica [0500M3500328] - Sistema anterior',
    'MERMA-LP-HIST-0500M3500328',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0500M3500328'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0500M3500328'
  );

-- [050000085127] Masking Líquido SW 5kg (17 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    17,
    'Merma histórica [050000085127] - Sistema anterior',
    'MERMA-LP-HIST-050000085127',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '050000085127'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-050000085127'
  );

-- [050000049016] Negro Mate Vinílico SW 600ml (69 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    69,
    'Merma histórica [050000049016] - Sistema anterior',
    'MERMA-LP-HIST-050000049016',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 09/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '050000049016'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-050000049016'
  );

-- [053000P81280] Primer PU HS P81 SW 800ml (60 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    60,
    'Merma histórica [053000P81280] - Sistema anterior',
    'MERMA-LP-HIST-053000P81280',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '053000P81280'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-053000P81280'
  );

-- [053000P41654] Primer PU Multifiller HS P41 SW 720ml (40 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    40,
    'Merma histórica [053000P41654] - Sistema anterior',
    'MERMA-LP-HIST-053000P41654',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 04/22',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '053000P41654'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-053000P41654'
  );

-- [05300P510276] Primer PU P510 SW 750ml (12 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    12,
    'Merma histórica [05300P510276] - Sistema anterior',
    'MERMA-LP-HIST-05300P510276',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '05300P510276'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-05300P510276'
  );

-- [050000018004] Primer Universal Gris SW 900ml (18 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    18,
    'Merma histórica [050000018004] - Sistema anterior',
    'MERMA-LP-HIST-050000018004',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 08/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '050000018004'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-050000018004'
  );

-- [0500BP200417] Protector (Antigravilla) Gris SW 900ml (21 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    21,
    'Merma histórica [0500BP200417] - Sistema anterior',
    'MERMA-LP-HIST-0500BP200417',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 12/18',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0500BP200417'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0500BP200417'
  );

-- [0500BP202417] Protector (Antigravilla) Negro SW 900ml (58 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    58,
    'Merma histórica [0500BP202417] - Sistema anterior',
    'MERMA-LP-HIST-0500BP202417',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 02/19',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0500BP202417'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0500BP202417'
  );

-- [050000045016] Wash Primer Fondo SW 600ml (36 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    36,
    'Merma histórica [050000045016] - Sistema anterior',
    'MERMA-LP-HIST-050000045016',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 05/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '050000045016'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-050000045016'
  );

-- [0500LF045004] Wash Primer Monocomponente SW 900ml (365 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    365,
    'Merma histórica [0500LF045004] - Sistema anterior',
    'MERMA-LP-HIST-0500LF045004',
    'Merma histórica del sistema anterior hasta el 30/10/2026 | Vencimiento: 07/20',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = '0500LF045004'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-0500LF045004'
  );

-- [VY-KSG867] KSG867 Soplete de Baja Presión VL 1.3mm (6 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    6,
    'Merma histórica [VY-KSG867] - Sistema anterior',
    'MERMA-LP-HIST-VY-KSG867',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'VY-KSG867'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-VY-KSG867'
  );

-- [VY-N2001] N2001 Soplete de Gravedad Profesional VL 1.4mm-600ml (1 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    1,
    'Merma histórica [VY-N2001] - Sistema anterior',
    'MERMA-LP-HIST-VY-N2001',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'VY-N2001'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-VY-N2001'
  );

-- [ZY-MF-38] Masking Film ZY 3.8m*100m (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [ZY-MF-38] - Sistema anterior',
    'MERMA-LP-HIST-ZY-MF-38',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'ZY-MF-38'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-ZY-MF-38'
  );

-- [ZY-MF-055] Masking Film ZY 55cm*30m (2 u.)
INSERT INTO movimientos_inventario
    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
SELECT
    'MERMA',
    2,
    'Merma histórica [ZY-MF-055] - Sistema anterior',
    'MERMA-LP-HIST-ZY-MF-055',
    'Merma histórica del sistema anterior hasta el 30/10/2026',
    COALESCE(i."precioCompra", 0),
    i.id,
    '2026-10-30 08:00:00'::timestamp
FROM inventario i
JOIN productos p ON p.id = i."productoId"
WHERE p.codigo = 'ZY-MF-055'
  AND i."sucursalId" = 1
  AND NOT EXISTS (
      SELECT 1 FROM movimientos_inventario mi
      WHERE mi."inventarioId" = i.id
        AND mi.tipo = 'MERMA'
        AND mi."numeroDocumento" = 'MERMA-LP-HIST-ZY-MF-055'
  );

COMMIT;

-- =========================================================================
-- Fin del script
-- =========================================================================