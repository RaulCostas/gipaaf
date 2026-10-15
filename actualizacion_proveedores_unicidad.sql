-- Índices únicos condicionales para proveedores
-- Evita duplicidad de NIT/RUC y Empresa entre proveedores activos
CREATE UNIQUE INDEX IF NOT EXISTS uq_proveedores_ruc 
ON proveedores (LOWER(TRIM(ruc))) 
WHERE "eliminadoEn" IS NULL AND ruc IS NOT NULL AND ruc != '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_proveedores_empresa 
ON proveedores (LOWER(TRIM(empresa))) 
WHERE "eliminadoEn" IS NULL AND empresa IS NOT NULL AND empresa != '';
