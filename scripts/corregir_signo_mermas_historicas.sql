-- Script: scripts/corregir_signo_mermas_historicas.sql
-- Propósito: Homogeneizar el signo de cantidad para las mermas históricas del sistema anterior en movimientos_inventario.
-- En GIPAAF las mermas son salidas y se almacenan con valor negativo (-cantidad).
-- Este script actualiza los registros con cantidad > 0 a valores negativos sin alterar inventario ni lotes.

UPDATE movimientos_inventario
SET cantidad = -ABS(cantidad)
WHERE tipo = 'MERMA'
  AND (
    "numeroDocumento" LIKE 'MERMA-%-HIST-%'
    OR motivo LIKE '%Merma histórica%'
  )
  AND cantidad > 0;
