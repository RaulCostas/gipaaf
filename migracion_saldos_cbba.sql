-- =================================================================
-- SCRIPT DE MIGRACIÓN: SALDOS INICIALES SUCURSAL COCHABAMBA (30/09/2026)
-- TOTAL CLIENTES: 33
-- MONTO TOTAL: Bs. 154706.16
-- =================================================================

BEGIN;

-- Cliente: [4024] Shopping Color (Bs. 165.68)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04024', 'VENTA', 'CONFIRMADA', '2026-09-30', 165.68, 0, 0, 
  165.68, 165.68, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Shopping Color', 
  (SELECT id FROM clientes WHERE codigo = '4024' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 165.68, "total" = 165.68, "subtotal" = 165.68;

-- Cliente: [4029] Comercial Barreto (Bs. 441.74)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04029', 'VENTA', 'CONFIRMADA', '2026-09-30', 441.74, 0, 0, 
  441.74, 441.74, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Barreto', 
  (SELECT id FROM clientes WHERE codigo = '4029' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 441.74, "total" = 441.74, "subtotal" = 441.74;

-- Cliente: [4096] Preparadora L y G (Bs. 612.37)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04096', 'VENTA', 'CONFIRMADA', '2026-09-30', 612.37, 0, 0, 
  612.37, 612.37, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Preparadora L y G', 
  (SELECT id FROM clientes WHERE codigo = '4096' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 612.37, "total" = 612.37, "subtotal" = 612.37;

-- Cliente: [4009] Comercial Albert (Bs. 724.80)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04009', 'VENTA', 'CONFIRMADA', '2026-09-30', 724.80, 0, 0, 
  724.80, 724.80, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Albert', 
  (SELECT id FROM clientes WHERE codigo = '4009' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 724.80, "total" = 724.80, "subtotal" = 724.80;

-- Cliente: [4008] Ferretería Chimba (Bs. 838.08)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04008', 'VENTA', 'CONFIRMADA', '2026-09-30', 838.08, 0, 0, 
  838.08, 838.08, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Chimba', 
  (SELECT id FROM clientes WHERE codigo = '4008' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 838.08, "total" = 838.08, "subtotal" = 838.08;

-- Cliente: [4011] Comercial Gamboa (Bs. 849.71)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04011', 'VENTA', 'CONFIRMADA', '2026-09-30', 849.71, 0, 0, 
  849.71, 849.71, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Gamboa', 
  (SELECT id FROM clientes WHERE codigo = '4011' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 849.71, "total" = 849.71, "subtotal" = 849.71;

-- Cliente: [4006] Color Crafters (Bs. 862.24)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04006', 'VENTA', 'CONFIRMADA', '2026-09-30', 862.24, 0, 0, 
  862.24, 862.24, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Color Crafters', 
  (SELECT id FROM clientes WHERE codigo = '4006' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 862.24, "total" = 862.24, "subtotal" = 862.24;

-- Cliente: [4068] Richar Teran (Bs. 875.66)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04068', 'VENTA', 'CONFIRMADA', '2026-09-30', 875.66, 0, 0, 
  875.66, 875.66, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Richar Teran', 
  (SELECT id FROM clientes WHERE codigo = '4068' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 875.66, "total" = 875.66, "subtotal" = 875.66;

-- Cliente: [4036] Oscar Pinto Salazar (Bs. 1046.14)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04036', 'VENTA', 'CONFIRMADA', '2026-09-30', 1046.14, 0, 0, 
  1046.14, 1046.14, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Oscar Pinto Salazar', 
  (SELECT id FROM clientes WHERE codigo = '4036' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1046.14, "total" = 1046.14, "subtotal" = 1046.14;

-- Cliente: [4095] FC Colors (Bs. 1729.31)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04095', 'VENTA', 'CONFIRMADA', '2026-09-30', 1729.31, 0, 0, 
  1729.31, 1729.31, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - FC Colors', 
  (SELECT id FROM clientes WHERE codigo = '4095' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1729.31, "total" = 1729.31, "subtotal" = 1729.31;

-- Cliente: [4089] Preparadora H Y H (Bs. 1866.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04089', 'VENTA', 'CONFIRMADA', '2026-09-30', 1866.00, 0, 0, 
  1866.00, 1866.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Preparadora H Y H', 
  (SELECT id FROM clientes WHERE codigo = '4089' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1866.00, "total" = 1866.00, "subtotal" = 1866.00;

-- Cliente: [4010] Fabrica de Colores (Bs. 1899.05)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04010', 'VENTA', 'CONFIRMADA', '2026-09-30', 1899.05, 0, 0, 
  1899.05, 1899.05, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Fabrica de Colores', 
  (SELECT id FROM clientes WHERE codigo = '4010' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1899.05, "total" = 1899.05, "subtotal" = 1899.05;

-- Cliente: [4075] Ferreteria Mil Colores (Bs. 2000.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04075', 'VENTA', 'CONFIRMADA', '2026-09-30', 2000.00, 0, 0, 
  2000.00, 2000.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferreteria Mil Colores', 
  (SELECT id FROM clientes WHERE codigo = '4075' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2000.00, "total" = 2000.00, "subtotal" = 2000.00;

-- Cliente: [4079] Comercial Bautista (Bs. 2047.54)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04079', 'VENTA', 'CONFIRMADA', '2026-09-30', 2047.54, 0, 0, 
  2047.54, 2047.54, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Bautista', 
  (SELECT id FROM clientes WHERE codigo = '4079' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2047.54, "total" = 2047.54, "subtotal" = 2047.54;

-- Cliente: [4056] Casa Color (Bs. 2130.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04056', 'VENTA', 'CONFIRMADA', '2026-09-30', 2130.00, 0, 0, 
  2130.00, 2130.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa Color', 
  (SELECT id FROM clientes WHERE codigo = '4056' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2130.00, "total" = 2130.00, "subtotal" = 2130.00;

-- Cliente: [4001] Mario Lider Quiroz Gutierrez (Bs. 2429.64)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04001', 'VENTA', 'CONFIRMADA', '2026-09-30', 2429.64, 0, 0, 
  2429.64, 2429.64, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Mario Lider Quiroz Gutierrez', 
  (SELECT id FROM clientes WHERE codigo = '4001' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2429.64, "total" = 2429.64, "subtotal" = 2429.64;

-- Cliente: [4093] Ferreteria Saravia (Bs. 2671.91)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04093', 'VENTA', 'CONFIRMADA', '2026-09-30', 2671.91, 0, 0, 
  2671.91, 2671.91, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferreteria Saravia', 
  (SELECT id FROM clientes WHERE codigo = '4093' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2671.91, "total" = 2671.91, "subtotal" = 2671.91;

-- Cliente: [4031] Comercial Duran (Bs. 3195.47)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04031', 'VENTA', 'CONFIRMADA', '2026-09-30', 3195.47, 0, 0, 
  3195.47, 3195.47, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Duran', 
  (SELECT id FROM clientes WHERE codigo = '4031' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3195.47, "total" = 3195.47, "subtotal" = 3195.47;

-- Cliente: [4067] Color Cambita (Bs. 3222.42)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04067', 'VENTA', 'CONFIRMADA', '2026-09-30', 3222.42, 0, 0, 
  3222.42, 3222.42, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Color Cambita', 
  (SELECT id FROM clientes WHERE codigo = '4067' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3222.42, "total" = 3222.42, "subtotal" = 3222.42;

-- Cliente: [4037] Plus Color (Bs. 3366.98)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04037', 'VENTA', 'CONFIRMADA', '2026-09-30', 3366.98, 0, 0, 
  3366.98, 3366.98, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Plus Color', 
  (SELECT id FROM clientes WHERE codigo = '4037' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3366.98, "total" = 3366.98, "subtotal" = 3366.98;

-- Cliente: [4064] Plus Color Villa (Bs. 3743.67)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04064', 'VENTA', 'CONFIRMADA', '2026-09-30', 3743.67, 0, 0, 
  3743.67, 3743.67, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Plus Color Villa', 
  (SELECT id FROM clientes WHERE codigo = '4064' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3743.67, "total" = 3743.67, "subtotal" = 3743.67;

-- Cliente: [4085] Comercial J.  Vargas (Bs. 3743.67)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04085', 'VENTA', 'CONFIRMADA', '2026-09-30', 3743.67, 0, 0, 
  3743.67, 3743.67, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial J.  Vargas', 
  (SELECT id FROM clientes WHERE codigo = '4085' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3743.67, "total" = 3743.67, "subtotal" = 3743.67;

-- Cliente: [4002] Nancy Cordova (Bs. 3888.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04002', 'VENTA', 'CONFIRMADA', '2026-09-30', 3888.00, 0, 0, 
  3888.00, 3888.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Nancy Cordova', 
  (SELECT id FROM clientes WHERE codigo = '4002' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3888.00, "total" = 3888.00, "subtotal" = 3888.00;

-- Cliente: [4028] Ximena Alanoca (Bs. 4400.26)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04028', 'VENTA', 'CONFIRMADA', '2026-09-30', 4400.26, 0, 0, 
  4400.26, 4400.26, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ximena Alanoca', 
  (SELECT id FROM clientes WHERE codigo = '4028' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 4400.26, "total" = 4400.26, "subtotal" = 4400.26;

-- Cliente: [4058] La Moderna (Bs. 4612.44)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04058', 'VENTA', 'CONFIRMADA', '2026-09-30', 4612.44, 0, 0, 
  4612.44, 4612.44, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - La Moderna', 
  (SELECT id FROM clientes WHERE codigo = '4058' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 4612.44, "total" = 4612.44, "subtotal" = 4612.44;

-- Cliente: [4043] 2M  Colors (Bs. 7256.92)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04043', 'VENTA', 'CONFIRMADA', '2026-09-30', 7256.92, 0, 0, 
  7256.92, 7256.92, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - 2M  Colors', 
  (SELECT id FROM clientes WHERE codigo = '4043' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 7256.92, "total" = 7256.92, "subtotal" = 7256.92;

-- Cliente: [4007] Wilder Zenzano (Bs. 7421.31)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04007', 'VENTA', 'CONFIRMADA', '2026-09-30', 7421.31, 0, 0, 
  7421.31, 7421.31, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Wilder Zenzano', 
  (SELECT id FROM clientes WHERE codigo = '4007' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 7421.31, "total" = 7421.31, "subtotal" = 7421.31;

-- Cliente: [4035] Varios - CBBA (Bs. 7526.12)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04035', 'VENTA', 'CONFIRMADA', '2026-09-30', 7526.12, 0, 0, 
  7526.12, 7526.12, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Varios - CBBA', 
  (SELECT id FROM clientes WHERE codigo = '4035' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 7526.12, "total" = 7526.12, "subtotal" = 7526.12;

-- Cliente: [6003] Comercial Auto Color-SUCRE (Bs. 7633.86)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-06003', 'VENTA', 'CONFIRMADA', '2026-09-30', 7633.86, 0, 0, 
  7633.86, 7633.86, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Auto Color-SUCRE', 
  (SELECT id FROM clientes WHERE codigo = '6003' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 7633.86, "total" = 7633.86, "subtotal" = 7633.86;

-- Cliente: [6011] Comercial AquaColor (Bs. 8030.35)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-06011', 'VENTA', 'CONFIRMADA', '2026-09-30', 8030.35, 0, 0, 
  8030.35, 8030.35, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial AquaColor', 
  (SELECT id FROM clientes WHERE codigo = '6011' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 8030.35, "total" = 8030.35, "subtotal" = 8030.35;

-- Cliente: [6002] Edmundo Salva Jacome-SUCRE (Bs. 12647.28)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-06002', 'VENTA', 'CONFIRMADA', '2026-09-30', 12647.28, 0, 0, 
  12647.28, 12647.28, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Edmundo Salva Jacome-SUCRE', 
  (SELECT id FROM clientes WHERE codigo = '6002' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 12647.28, "total" = 12647.28, "subtotal" = 12647.28;

-- Cliente: [4003] Comercial Magdiel (Bs. 25085.21)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-04003', 'VENTA', 'CONFIRMADA', '2026-09-30', 25085.21, 0, 0, 
  25085.21, 25085.21, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Magdiel', 
  (SELECT id FROM clientes WHERE codigo = '4003' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 25085.21, "total" = 25085.21, "subtotal" = 25085.21;

-- Cliente: [6009] Comercial Arenales - SUCRE (Bs. 25742.33)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-CBBA-06009', 'VENTA', 'CONFIRMADA', '2026-09-30', 25742.33, 0, 0, 
  25742.33, 25742.33, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Arenales - SUCRE', 
  (SELECT id FROM clientes WHERE codigo = '6009' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%cbba%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 25742.33, "total" = 25742.33, "subtotal" = 25742.33;

COMMIT;
