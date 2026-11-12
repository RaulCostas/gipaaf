-- =================================================================
-- SCRIPT DE AJUSTE INVENTARIO INICIAL - SUCURSAL LA PAZ (30/09/2026)
-- 1. Insertar/Asegurar 2 items BRAZILIAN con cantidad inicial = 1
--    - 200384.90: Amarelo 1700 MBB Brz 900ml
--    - 400584.90: Azul Seguranca 2.5 PB 4/10 Brz 900ml
-- 2. Corregir MAX-MPROM LL (Material Promocional - LLaveros)
--    de 18 a 13 unidades
-- =================================================================

BEGIN;

DO $$
DECLARE
    v_suc_lp_id INT;
    v_marca_brazilian_id INT;
    v_prod_id INT;
    v_inv_id INT;
    v_lote_id INT;
    v_diff NUMERIC;
BEGIN
    -- 1. Obtener ID de la sucursal La Paz
    SELECT id INTO v_suc_lp_id 
    FROM sucursales 
    WHERE UPPER(nombre) LIKE '%LA PAZ%' OR UPPER(nombre) LIKE '%LP%'
    LIMIT 1;

    IF v_suc_lp_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró la sucursal de La Paz';
    END IF;

    -- Obtener o crear ID de la marca BRAZILIAN
    SELECT id INTO v_marca_brazilian_id 
    FROM marcas 
    WHERE UPPER(nombre) = 'BRAZILIAN' 
    LIMIT 1;

    -- =================================================================
    -- ITEM 1: 200384.90 - Amarelo 1700 MBB Brz 900ml (Cant: 1)
    -- =================================================================
    SELECT id INTO v_prod_id FROM productos WHERE codigo = '200384.90' LIMIT 1;
    IF v_prod_id IS NULL THEN
        INSERT INTO productos (codigo, nombre, "marcaId", "unidadMedida", activo, "creadoEn", "actualizadoEn")
        VALUES ('200384.90', 'Amarelo 1700 MBB Brz 900ml', v_marca_brazilian_id, 'UNIDAD', true, NOW(), NOW())
        RETURNING id INTO v_prod_id;
    END IF;

    -- Inventario
    SELECT id INTO v_inv_id FROM inventario WHERE "productoId" = v_prod_id AND "sucursalId" = v_suc_lp_id LIMIT 1;
    IF v_inv_id IS NULL THEN
        INSERT INTO inventario ("productoId", "sucursalId", "stockActual", "stockMinimo", "stockMaximo", "precioCompra", "precioVenta", "creadoEn", "actualizadoEn")
        VALUES (v_prod_id, v_suc_lp_id, 1, 0, 0, 0, 0, '2026-09-30 00:00:00', NOW())
        RETURNING id INTO v_inv_id;
    ELSE
        -- Si ya existía inventario, aseguramos stock base si era 0
        UPDATE inventario 
        SET "stockActual" = CASE WHEN "stockActual" <= 0 THEN 1 ELSE "stockActual" END,
            "actualizadoEn" = NOW()
        WHERE id = v_inv_id;
    END IF;

    -- Lote L-INI-LP-200384.90
    SELECT id INTO v_lote_id FROM lotes WHERE "numeroLote" = 'L-INI-LP-200384.90' AND "sucursalId" = v_suc_lp_id LIMIT 1;
    IF v_lote_id IS NULL THEN
        INSERT INTO lotes ("numeroLote", "productoId", "sucursalId", "cantidadInicial", "cantidadActual", "costoUnitario", "fechaIngreso", "creadoEn", "actualizadoEn")
        VALUES ('L-INI-LP-200384.90', v_prod_id, v_suc_lp_id, 1, 1, 0, '2026-09-30 00:00:00', '2026-09-30 00:00:00', NOW())
        RETURNING id INTO v_lote_id;
    ELSE
        UPDATE lotes 
        SET "cantidadInicial" = 1,
            "cantidadActual" = 1,
            "actualizadoEn" = NOW()
        WHERE id = v_lote_id;
    END IF;

    -- Movimiento Kardex INVENTARIO_INICIAL
    IF NOT EXISTS (
        SELECT 1 FROM movimientos_inventario 
        WHERE "inventarioId" = v_inv_id 
          AND tipo = 'INVENTARIO_INICIAL' 
          AND "numeroDocumento" = 'L-INI-LP-200384.90'
    ) THEN
        INSERT INTO movimientos_inventario ("inventarioId", tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "creadoEn")
        VALUES (v_inv_id, 'INVENTARIO_INICIAL', 1, 'Inventario Inicial [L-INI-LP-200384.90]', 'L-INI-LP-200384.90', 'Carga inicial de inventario al 30/09/2026', 0, '2026-09-30 00:00:00');
    ELSE
        UPDATE movimientos_inventario
        SET cantidad = 1
        WHERE "inventarioId" = v_inv_id 
          AND tipo = 'INVENTARIO_INICIAL' 
          AND "numeroDocumento" = 'L-INI-LP-200384.90';
    END IF;


    -- =================================================================
    -- ITEM 2: 400584.90 - Azul Seguranca 2.5 PB 4/10 Brz 900ml (Cant: 1)
    -- =================================================================
    SELECT id INTO v_prod_id FROM productos WHERE codigo = '400584.90' LIMIT 1;
    IF v_prod_id IS NULL THEN
        INSERT INTO productos (codigo, nombre, "marcaId", "unidadMedida", activo, "creadoEn", "actualizadoEn")
        VALUES ('400584.90', 'Azul Seguranca 2.5 PB 4/10 Brz 900ml', v_marca_brazilian_id, 'UNIDAD', true, NOW(), NOW())
        RETURNING id INTO v_prod_id;
    END IF;

    -- Inventario
    SELECT id INTO v_inv_id FROM inventario WHERE "productoId" = v_prod_id AND "sucursalId" = v_suc_lp_id LIMIT 1;
    IF v_inv_id IS NULL THEN
        INSERT INTO inventario ("productoId", "sucursalId", "stockActual", "stockMinimo", "stockMaximo", "precioCompra", "precioVenta", "creadoEn", "actualizadoEn")
        VALUES (v_prod_id, v_suc_lp_id, 1, 0, 0, 0, 0, '2026-09-30 00:00:00', NOW())
        RETURNING id INTO v_inv_id;
    ELSE
        UPDATE inventario 
        SET "stockActual" = CASE WHEN "stockActual" <= 0 THEN 1 ELSE "stockActual" END,
            "actualizadoEn" = NOW()
        WHERE id = v_inv_id;
    END IF;

    -- Lote L-INI-LP-400584.90
    SELECT id INTO v_lote_id FROM lotes WHERE "numeroLote" = 'L-INI-LP-400584.90' AND "sucursalId" = v_suc_lp_id LIMIT 1;
    IF v_lote_id IS NULL THEN
        INSERT INTO lotes ("numeroLote", "productoId", "sucursalId", "cantidadInicial", "cantidadActual", "costoUnitario", "fechaIngreso", "creadoEn", "actualizadoEn")
        VALUES ('L-INI-LP-400584.90', v_prod_id, v_suc_lp_id, 1, 1, 0, '2026-09-30 00:00:00', '2026-09-30 00:00:00', NOW())
        RETURNING id INTO v_lote_id;
    ELSE
        UPDATE lotes 
        SET "cantidadInicial" = 1,
            "cantidadActual" = 1,
            "actualizadoEn" = NOW()
        WHERE id = v_lote_id;
    END IF;

    -- Movimiento Kardex INVENTARIO_INICIAL
    IF NOT EXISTS (
        SELECT 1 FROM movimientos_inventario 
        WHERE "inventarioId" = v_inv_id 
          AND tipo = 'INVENTARIO_INICIAL' 
          AND "numeroDocumento" = 'L-INI-LP-400584.90'
    ) THEN
        INSERT INTO movimientos_inventario ("inventarioId", tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "creadoEn")
        VALUES (v_inv_id, 'INVENTARIO_INICIAL', 1, 'Inventario Inicial [L-INI-LP-400584.90]', 'L-INI-LP-400584.90', 'Carga inicial de inventario al 30/09/2026', 0, '2026-09-30 00:00:00');
    ELSE
        UPDATE movimientos_inventario
        SET cantidad = 1
        WHERE "inventarioId" = v_inv_id 
          AND tipo = 'INVENTARIO_INICIAL' 
          AND "numeroDocumento" = 'L-INI-LP-400584.90';
    END IF;


    -- =================================================================
    -- ITEM 3: MAX-MPROM LL - Material Promocional - LLaveros (De 18 a 13)
    -- =================================================================
    SELECT id INTO v_prod_id FROM productos WHERE codigo = 'MAX-MPROM LL' LIMIT 1;
    IF v_prod_id IS NOT NULL THEN
        SELECT id INTO v_lote_id FROM lotes WHERE "numeroLote" = 'L-INI-LP-MAX-MPROM LL' AND "sucursalId" = v_suc_lp_id LIMIT 1;
        IF v_lote_id IS NOT NULL THEN
            -- Calculamos diferencia respecto al inicial actual del lote
            SELECT (13 - "cantidadInicial") INTO v_diff FROM lotes WHERE id = v_lote_id;

            IF v_diff <> 0 THEN
                UPDATE lotes 
                SET "cantidadInicial" = 13,
                    "cantidadActual" = GREATEST(0, "cantidadActual" + v_diff),
                    "actualizadoEn" = NOW()
                WHERE id = v_lote_id;

                -- Ajustamos inventario La Paz
                UPDATE inventario
                SET "stockActual" = GREATEST(0, "stockActual" + v_diff),
                    "actualizadoEn" = NOW()
                WHERE "productoId" = v_prod_id AND "sucursalId" = v_suc_lp_id;

                -- Ajustamos movimiento en Kardex
                UPDATE movimientos_inventario
                SET cantidad = 13
                WHERE tipo = 'INVENTARIO_INICIAL'
                  AND "numeroDocumento" = 'L-INI-LP-MAX-MPROM LL';
            END IF;
        ELSE
            -- Si no existía el lote específico, lo insertamos
            INSERT INTO lotes ("numeroLote", "productoId", "sucursalId", "cantidadInicial", "cantidadActual", "costoUnitario", "fechaIngreso", "creadoEn", "actualizadoEn")
            VALUES ('L-INI-LP-MAX-MPROM LL', v_prod_id, v_suc_lp_id, 13, 13, 0, '2026-09-30 00:00:00', '2026-09-30 00:00:00', NOW());

            SELECT id INTO v_inv_id FROM inventario WHERE "productoId" = v_prod_id AND "sucursalId" = v_suc_lp_id LIMIT 1;
            IF v_inv_id IS NOT NULL THEN
                UPDATE inventario SET "stockActual" = 13, "actualizadoEn" = NOW() WHERE id = v_inv_id;
                INSERT INTO movimientos_inventario ("inventarioId", tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "creadoEn")
                VALUES (v_inv_id, 'INVENTARIO_INICIAL', 13, 'Inventario Inicial [L-INI-LP-MAX-MPROM LL]', 'L-INI-LP-MAX-MPROM LL', 'Carga inicial de inventario al 30/09/2026', 0, '2026-09-30 00:00:00');
            END IF;
        END IF;
    END IF;

END $$;

-- Verificación de los 3 registros ajustados
SELECT 
    p.codigo,
    p.nombre,
    l."numeroLote",
    l."cantidadInicial",
    l."cantidadActual",
    inv."stockActual",
    l."fechaIngreso"
FROM productos p
JOIN lotes l ON l."productoId" = p.id
JOIN inventario inv ON inv."productoId" = p.id AND inv."sucursalId" = l."sucursalId"
JOIN sucursales s ON l."sucursalId" = s.id
WHERE p.codigo IN ('200384.90', '400584.90', 'MAX-MPROM LL')
  AND (UPPER(s.nombre) LIKE '%LA PAZ%' OR UPPER(s.nombre) LIKE '%LP%');

COMMIT;
