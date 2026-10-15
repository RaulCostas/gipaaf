-- Índice único para clientes por código y sucursal
-- Permite el mismo código en diferentes sucursales, pero evita duplicados dentro de la misma sucursal
CREATE UNIQUE INDEX IF NOT EXISTS uq_clientes_codigo_sucursal 
ON clientes (LOWER(TRIM(codigo)), "sucursalId") 
WHERE "eliminadoEn" IS NULL AND codigo IS NOT NULL AND codigo != '';
