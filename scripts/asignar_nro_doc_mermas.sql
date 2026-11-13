-- Script: scripts/asignar_nro_doc_mermas.sql
-- Propósito: Asignar número correlativo (MER-LP-00001, etc.) a las mermas existentes que no tienen NRO DOC.
-- Nota: El backend también ejecutará este backfill automáticamente al iniciar.

DO $$
DECLARE
    r RECORD;
    counter INT := 1;
    sucCode TEXT := 'LP';
    nuevoDoc TEXT;
BEGIN
    FOR r IN (
        SELECT m.id, m."creadoEn"
        FROM movimientos_inventario m
        WHERE m.tipo = 'MERMA' 
          AND (m."numeroDocumento" IS NULL OR m."numeroDocumento" = '' OR m."numeroDocumento" = '-')
          AND (m.motivo IS NULL OR m.motivo NOT LIKE '%Merma histórica%')
        ORDER BY m."creadoEn" ASC, m.id ASC
    ) LOOP
        -- Asegurar que el correlativo no colisione con uno existente
        LOOP
            nuevoDoc := 'MER-' || sucCode || '-' || LPAD(counter::TEXT, 5, '0');
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM movimientos_inventario WHERE "numeroDocumento" = nuevoDoc
            );
            counter := counter + 1;
        END LOOP;

        UPDATE movimientos_inventario
        SET "numeroDocumento" = nuevoDoc
        WHERE id = r.id;

        RAISE NOTICE 'Asignado % a merma id=%', nuevoDoc, r.id;
        counter := counter + 1;
    END LOOP;
END $$;
