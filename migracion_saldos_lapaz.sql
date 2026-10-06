-- =================================================================
-- SCRIPT DE MIGRACIÓN: SALDOS INICIALES SUCURSAL LA PAZ (30/09/2026)
-- TOTAL CLIENTES: 82
-- MONTO TOTAL: Bs. 1517399.71
-- =================================================================

BEGIN;

-- Cliente: [1002] Alexis Colors (Bs. 26689.77)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01002', 'VENTA', 'CONFIRMADA', '2026-09-30', 26689.77, 0, 0, 
  26689.77, 26689.77, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Alexis Colors', 
  (SELECT id FROM clientes WHERE codigo = '1002' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 26689.77, "total" = 26689.77, "subtotal" = 26689.77;

-- Cliente: [1003] Casa de Pinturas San Mateo (Bs. 718853.27)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01003', 'VENTA', 'CONFIRMADA', '2026-09-30', 718853.27, 0, 0, 
  718853.27, 718853.27, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa de Pinturas San Mateo', 
  (SELECT id FROM clientes WHERE codigo = '1003' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 718853.27, "total" = 718853.27, "subtotal" = 718853.27;

-- Cliente: [1004] Oswaldo Pinto Hurtado (Bs. 89179.83)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01004', 'VENTA', 'CONFIRMADA', '2026-09-30', 89179.83, 0, 0, 
  89179.83, 89179.83, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Oswaldo Pinto Hurtado', 
  (SELECT id FROM clientes WHERE codigo = '1004' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 89179.83, "total" = 89179.83, "subtotal" = 89179.83;

-- Cliente: [1005] Raúl Ortega (Bs. 3270.71)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01005', 'VENTA', 'CONFIRMADA', '2026-09-30', 3270.71, 0, 0, 
  3270.71, 3270.71, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Raúl Ortega', 
  (SELECT id FROM clientes WHERE codigo = '1005' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3270.71, "total" = 3270.71, "subtotal" = 3270.71;

-- Cliente: [1006] Pinturas Vencedor (Bs. 2064.54)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01006', 'VENTA', 'CONFIRMADA', '2026-09-30', 2064.54, 0, 0, 
  2064.54, 2064.54, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Vencedor', 
  (SELECT id FROM clientes WHERE codigo = '1006' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2064.54, "total" = 2064.54, "subtotal" = 2064.54;

-- Cliente: [1008] Rudy Copa (Bs. 26624.18)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01008', 'VENTA', 'CONFIRMADA', '2026-09-30', 26624.18, 0, 0, 
  26624.18, 26624.18, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Rudy Copa', 
  (SELECT id FROM clientes WHERE codigo = '1008' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 26624.18, "total" = 26624.18, "subtotal" = 26624.18;

-- Cliente: [1009] Combicolor (Bs. 12093.85)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01009', 'VENTA', 'CONFIRMADA', '2026-09-30', 12093.85, 0, 0, 
  12093.85, 12093.85, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Combicolor', 
  (SELECT id FROM clientes WHERE codigo = '1009' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 12093.85, "total" = 12093.85, "subtotal" = 12093.85;

-- Cliente: [1011] Casa de Pinturas Dils (Bs. 6724.98)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01011', 'VENTA', 'CONFIRMADA', '2026-09-30', 6724.98, 0, 0, 
  6724.98, 6724.98, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa de Pinturas Dils', 
  (SELECT id FROM clientes WHERE codigo = '1011' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 6724.98, "total" = 6724.98, "subtotal" = 6724.98;

-- Cliente: [1013] Ferretería Gabo (Bs. 1892.51)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01013', 'VENTA', 'CONFIRMADA', '2026-09-30', 1892.51, 0, 0, 
  1892.51, 1892.51, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Gabo', 
  (SELECT id FROM clientes WHERE codigo = '1013' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1892.51, "total" = 1892.51, "subtotal" = 1892.51;

-- Cliente: [1014] Juan Carlos Fernández Quenta (Bs. 898.75)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01014', 'VENTA', 'CONFIRMADA', '2026-09-30', 898.75, 0, 0, 
  898.75, 898.75, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Juan Carlos Fernández Quenta', 
  (SELECT id FROM clientes WHERE codigo = '1014' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 898.75, "total" = 898.75, "subtotal" = 898.75;

-- Cliente: [1016] Pinturas Haizer (Bs. 1468.62)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01016', 'VENTA', 'CONFIRMADA', '2026-09-30', 1468.62, 0, 0, 
  1468.62, 1468.62, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Haizer', 
  (SELECT id FROM clientes WHERE codigo = '1016' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1468.62, "total" = 1468.62, "subtotal" = 1468.62;

-- Cliente: [1020] Punto Color Express (Bs. 7786.93)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01020', 'VENTA', 'CONFIRMADA', '2026-09-30', 7786.93, 0, 0, 
  7786.93, 7786.93, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Punto Color Express', 
  (SELECT id FROM clientes WHERE codigo = '1020' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 7786.93, "total" = 7786.93, "subtotal" = 7786.93;

-- Cliente: [1023] Ferretería Silvia (Bs. 792.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01023', 'VENTA', 'CONFIRMADA', '2026-09-30', 792.00, 0, 0, 
  792.00, 792.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Silvia', 
  (SELECT id FROM clientes WHERE codigo = '1023' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 792.00, "total" = 792.00, "subtotal" = 792.00;

-- Cliente: [1026] Ferretería Alquímica (Bs. 9415.34)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01026', 'VENTA', 'CONFIRMADA', '2026-09-30', 9415.34, 0, 0, 
  9415.34, 9415.34, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Alquímica', 
  (SELECT id FROM clientes WHERE codigo = '1026' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 9415.34, "total" = 9415.34, "subtotal" = 9415.34;

-- Cliente: [1040] Pinturas Araoliz (Bs. 846.26)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01040', 'VENTA', 'CONFIRMADA', '2026-09-30', 846.26, 0, 0, 
  846.26, 846.26, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Araoliz', 
  (SELECT id FROM clientes WHERE codigo = '1040' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 846.26, "total" = 846.26, "subtotal" = 846.26;

-- Cliente: [1046] Pinturas C y V (Bs. 2248.25)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01046', 'VENTA', 'CONFIRMADA', '2026-09-30', 2248.25, 0, 0, 
  2248.25, 2248.25, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas C y V', 
  (SELECT id FROM clientes WHERE codigo = '1046' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2248.25, "total" = 2248.25, "subtotal" = 2248.25;

-- Cliente: [1048] Ferretería E y M (Bs. 12454.72)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01048', 'VENTA', 'CONFIRMADA', '2026-09-30', 12454.72, 0, 0, 
  12454.72, 12454.72, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería E y M', 
  (SELECT id FROM clientes WHERE codigo = '1048' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 12454.72, "total" = 12454.72, "subtotal" = 12454.72;

-- Cliente: [1050] Sagitario Mix (Bs. 6831.63)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01050', 'VENTA', 'CONFIRMADA', '2026-09-30', 6831.63, 0, 0, 
  6831.63, 6831.63, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Sagitario Mix', 
  (SELECT id FROM clientes WHERE codigo = '1050' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 6831.63, "total" = 6831.63, "subtotal" = 6831.63;

-- Cliente: [1052] Ferreteria Jaime (Bs. 4039.39)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01052', 'VENTA', 'CONFIRMADA', '2026-09-30', 4039.39, 0, 0, 
  4039.39, 4039.39, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferreteria Jaime', 
  (SELECT id FROM clientes WHERE codigo = '1052' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 4039.39, "total" = 4039.39, "subtotal" = 4039.39;

-- Cliente: [1054] Distribuidora Midal Vida (Bs. 1980.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01054', 'VENTA', 'CONFIRMADA', '2026-09-30', 1980.00, 0, 0, 
  1980.00, 1980.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Distribuidora Midal Vida', 
  (SELECT id FROM clientes WHERE codigo = '1054' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1980.00, "total" = 1980.00, "subtotal" = 1980.00;

-- Cliente: [1064] Ferreteria Yacuma (Bs. 231.08)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01064', 'VENTA', 'CONFIRMADA', '2026-09-30', 231.08, 0, 0, 
  231.08, 231.08, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferreteria Yacuma', 
  (SELECT id FROM clientes WHERE codigo = '1064' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 231.08, "total" = 231.08, "subtotal" = 231.08;

-- Cliente: [1066] Pinturas Color Mix (Bs. 1942.99)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01066', 'VENTA', 'CONFIRMADA', '2026-09-30', 1942.99, 0, 0, 
  1942.99, 1942.99, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Color Mix', 
  (SELECT id FROM clientes WHERE codigo = '1066' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1942.99, "total" = 1942.99, "subtotal" = 1942.99;

-- Cliente: [1999] Varios clientes - LPZ (Bs. 659.12)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-01999', 'VENTA', 'CONFIRMADA', '2026-09-30', 659.12, 0, 0, 
  659.12, 659.12, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Varios clientes - LPZ', 
  (SELECT id FROM clientes WHERE codigo = '1999' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 659.12, "total" = 659.12, "subtotal" = 659.12;

-- Cliente: [2001] Audi Colors (Bs. 50460.39)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02001', 'VENTA', 'CONFIRMADA', '2026-09-30', 50460.39, 0, 0, 
  50460.39, 50460.39, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Audi Colors', 
  (SELECT id FROM clientes WHERE codigo = '2001' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 50460.39, "total" = 50460.39, "subtotal" = 50460.39;

-- Cliente: [2003] Casa Alison (Bs. 14832.21)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02003', 'VENTA', 'CONFIRMADA', '2026-09-30', 14832.21, 0, 0, 
  14832.21, 14832.21, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa Alison', 
  (SELECT id FROM clientes WHERE codigo = '2003' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 14832.21, "total" = 14832.21, "subtotal" = 14832.21;

-- Cliente: [2005] Elsa Huanca (Bs. 9882.50)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02005', 'VENTA', 'CONFIRMADA', '2026-09-30', 9882.50, 0, 0, 
  9882.50, 9882.50, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Elsa Huanca', 
  (SELECT id FROM clientes WHERE codigo = '2005' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 9882.50, "total" = 9882.50, "subtotal" = 9882.50;

-- Cliente: [2007] Ferretería Melany (Bs. 93541.97)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02007', 'VENTA', 'CONFIRMADA', '2026-09-30', 93541.97, 0, 0, 
  93541.97, 93541.97, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Melany', 
  (SELECT id FROM clientes WHERE codigo = '2007' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 93541.97, "total" = 93541.97, "subtotal" = 93541.97;

-- Cliente: [2009] Pinto Color - Marcelo Pinto (Bs. 5796.23)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02009', 'VENTA', 'CONFIRMADA', '2026-09-30', 5796.23, 0, 0, 
  5796.23, 5796.23, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinto Color - Marcelo Pinto', 
  (SELECT id FROM clientes WHERE codigo = '2009' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 5796.23, "total" = 5796.23, "subtotal" = 5796.23;

-- Cliente: [2011] Casa de Pinturas Warita (Bs. 9199.87)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02011', 'VENTA', 'CONFIRMADA', '2026-09-30', 9199.87, 0, 0, 
  9199.87, 9199.87, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa de Pinturas Warita', 
  (SELECT id FROM clientes WHERE codigo = '2011' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 9199.87, "total" = 9199.87, "subtotal" = 9199.87;

-- Cliente: [2016] Daniela Pinto (Bs. 3459.48)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02016', 'VENTA', 'CONFIRMADA', '2026-09-30', 3459.48, 0, 0, 
  3459.48, 3459.48, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Daniela Pinto', 
  (SELECT id FROM clientes WHERE codigo = '2016' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3459.48, "total" = 3459.48, "subtotal" = 3459.48;

-- Cliente: [2017] Car Roly (Bs. 8389.38)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02017', 'VENTA', 'CONFIRMADA', '2026-09-30', 8389.38, 0, 0, 
  8389.38, 8389.38, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Car Roly', 
  (SELECT id FROM clientes WHERE codigo = '2017' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 8389.38, "total" = 8389.38, "subtotal" = 8389.38;

-- Cliente: [2026] Rey Colors (Bs. 7738.34)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02026', 'VENTA', 'CONFIRMADA', '2026-09-30', 7738.34, 0, 0, 
  7738.34, 7738.34, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Rey Colors', 
  (SELECT id FROM clientes WHERE codigo = '2026' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 7738.34, "total" = 7738.34, "subtotal" = 7738.34;

-- Cliente: [2027] Joel Samo (Bs. 18701.05)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02027', 'VENTA', 'CONFIRMADA', '2026-09-30', 18701.05, 0, 0, 
  18701.05, 18701.05, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Joel Samo', 
  (SELECT id FROM clientes WHERE codigo = '2027' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 18701.05, "total" = 18701.05, "subtotal" = 18701.05;

-- Cliente: [2033] Santísima Trinidad (Bs. 1599.01)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02033', 'VENTA', 'CONFIRMADA', '2026-09-30', 1599.01, 0, 0, 
  1599.01, 1599.01, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Santísima Trinidad', 
  (SELECT id FROM clientes WHERE codigo = '2033' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1599.01, "total" = 1599.01, "subtotal" = 1599.01;

-- Cliente: [2034] Pinturas Rodry (Bs. 3258.03)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02034', 'VENTA', 'CONFIRMADA', '2026-09-30', 3258.03, 0, 0, 
  3258.03, 3258.03, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Rodry', 
  (SELECT id FROM clientes WHERE codigo = '2034' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3258.03, "total" = 3258.03, "subtotal" = 3258.03;

-- Cliente: [2035] Ferretería Picasso (Bs. 9750.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02035', 'VENTA', 'CONFIRMADA', '2026-09-30', 9750.00, 0, 0, 
  9750.00, 9750.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Picasso', 
  (SELECT id FROM clientes WHERE codigo = '2035' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 9750.00, "total" = 9750.00, "subtotal" = 9750.00;

-- Cliente: [2037] Ferretería San Miguel (Bs. 4660.62)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02037', 'VENTA', 'CONFIRMADA', '2026-09-30', 4660.62, 0, 0, 
  4660.62, 4660.62, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería San Miguel', 
  (SELECT id FROM clientes WHERE codigo = '2037' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 4660.62, "total" = 4660.62, "subtotal" = 4660.62;

-- Cliente: [2040] Enriqueta Rojas (Bs. 2456.63)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02040', 'VENTA', 'CONFIRMADA', '2026-09-30', 2456.63, 0, 0, 
  2456.63, 2456.63, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Enriqueta Rojas', 
  (SELECT id FROM clientes WHERE codigo = '2040' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2456.63, "total" = 2456.63, "subtotal" = 2456.63;

-- Cliente: [2047] Megacolor (Bs. 5741.01)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02047', 'VENTA', 'CONFIRMADA', '2026-09-30', 5741.01, 0, 0, 
  5741.01, 5741.01, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Megacolor', 
  (SELECT id FROM clientes WHERE codigo = '2047' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 5741.01, "total" = 5741.01, "subtotal" = 5741.01;

-- Cliente: [2054] Casa Estrellita (Bs. 9248.08)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02054', 'VENTA', 'CONFIRMADA', '2026-09-30', 9248.08, 0, 0, 
  9248.08, 9248.08, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa Estrellita', 
  (SELECT id FROM clientes WHERE codigo = '2054' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 9248.08, "total" = 9248.08, "subtotal" = 9248.08;

-- Cliente: [2061] Ferretería Vale (Bs. 692.65)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02061', 'VENTA', 'CONFIRMADA', '2026-09-30', 692.65, 0, 0, 
  692.65, 692.65, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Vale', 
  (SELECT id FROM clientes WHERE codigo = '2061' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 692.65, "total" = 692.65, "subtotal" = 692.65;

-- Cliente: [2063] Ferretería Sr. Milagros (Bs. 3490.28)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02063', 'VENTA', 'CONFIRMADA', '2026-09-30', 3490.28, 0, 0, 
  3490.28, 3490.28, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Sr. Milagros', 
  (SELECT id FROM clientes WHERE codigo = '2063' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 3490.28, "total" = 3490.28, "subtotal" = 3490.28;

-- Cliente: [2065] Ferretería Quisbert (Bs. 2436.24)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02065', 'VENTA', 'CONFIRMADA', '2026-09-30', 2436.24, 0, 0, 
  2436.24, 2436.24, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Quisbert', 
  (SELECT id FROM clientes WHERE codigo = '2065' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2436.24, "total" = 2436.24, "subtotal" = 2436.24;

-- Cliente: [2071] Ferretería Fortaleza (Bs. 1952.52)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02071', 'VENTA', 'CONFIRMADA', '2026-09-30', 1952.52, 0, 0, 
  1952.52, 1952.52, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Fortaleza', 
  (SELECT id FROM clientes WHERE codigo = '2071' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1952.52, "total" = 1952.52, "subtotal" = 1952.52;

-- Cliente: [2072] Ferretería Arcoíris (Bs. 2812.01)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02072', 'VENTA', 'CONFIRMADA', '2026-09-30', 2812.01, 0, 0, 
  2812.01, 2812.01, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Arcoíris', 
  (SELECT id FROM clientes WHERE codigo = '2072' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2812.01, "total" = 2812.01, "subtotal" = 2812.01;

-- Cliente: [2082] Sensa Colors (Bs. 1804.20)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02082', 'VENTA', 'CONFIRMADA', '2026-09-30', 1804.20, 0, 0, 
  1804.20, 1804.20, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Sensa Colors', 
  (SELECT id FROM clientes WHERE codigo = '2082' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1804.20, "total" = 1804.20, "subtotal" = 1804.20;

-- Cliente: [2091] Ferretería Betto (Bs. 1014.99)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02091', 'VENTA', 'CONFIRMADA', '2026-09-30', 1014.99, 0, 0, 
  1014.99, 1014.99, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Betto', 
  (SELECT id FROM clientes WHERE codigo = '2091' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1014.99, "total" = 1014.99, "subtotal" = 1014.99;

-- Cliente: [2092] Pinturas Lio (Bs. 11001.66)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02092', 'VENTA', 'CONFIRMADA', '2026-09-30', 11001.66, 0, 0, 
  11001.66, 11001.66, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Lio', 
  (SELECT id FROM clientes WHERE codigo = '2092' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 11001.66, "total" = 11001.66, "subtotal" = 11001.66;

-- Cliente: [2093] Virginia Lazo (Bs. 2080.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02093', 'VENTA', 'CONFIRMADA', '2026-09-30', 2080.00, 0, 0, 
  2080.00, 2080.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Virginia Lazo', 
  (SELECT id FROM clientes WHERE codigo = '2093' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2080.00, "total" = 2080.00, "subtotal" = 2080.00;

-- Cliente: [2094] Ferretería Cleto (Bs. 602.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02094', 'VENTA', 'CONFIRMADA', '2026-09-30', 602.00, 0, 0, 
  602.00, 602.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Cleto', 
  (SELECT id FROM clientes WHERE codigo = '2094' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 602.00, "total" = 602.00, "subtotal" = 602.00;

-- Cliente: [2096] Ferretería Elizer (Bs. 1800.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02096', 'VENTA', 'CONFIRMADA', '2026-09-30', 1800.00, 0, 0, 
  1800.00, 1800.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Elizer', 
  (SELECT id FROM clientes WHERE codigo = '2096' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1800.00, "total" = 1800.00, "subtotal" = 1800.00;

-- Cliente: [2101] Laia Colors (Bs. 12797.04)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02101', 'VENTA', 'CONFIRMADA', '2026-09-30', 12797.04, 0, 0, 
  12797.04, 12797.04, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Laia Colors', 
  (SELECT id FROM clientes WHERE codigo = '2101' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 12797.04, "total" = 12797.04, "subtotal" = 12797.04;

-- Cliente: [2106] Color Mix (Bs. 5235.43)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02106', 'VENTA', 'CONFIRMADA', '2026-09-30', 5235.43, 0, 0, 
  5235.43, 5235.43, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Color Mix', 
  (SELECT id FROM clientes WHERE codigo = '2106' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 5235.43, "total" = 5235.43, "subtotal" = 5235.43;

-- Cliente: [2107] Saavedra Colors (Bs. 0.15)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02107', 'VENTA', 'CONFIRMADA', '2026-09-30', 0.15, 0, 0, 
  0.15, 0.15, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Saavedra Colors', 
  (SELECT id FROM clientes WHERE codigo = '2107' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 0.15, "total" = 0.15, "subtotal" = 0.15;

-- Cliente: [2108] Casa de Pinturas Universal Colors (Bs. 12162.96)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02108', 'VENTA', 'CONFIRMADA', '2026-09-30', 12162.96, 0, 0, 
  12162.96, 12162.96, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa de Pinturas Universal Colors', 
  (SELECT id FROM clientes WHERE codigo = '2108' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 12162.96, "total" = 12162.96, "subtotal" = 12162.96;

-- Cliente: [2113] Casa El Pintor (Bs. 971.87)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02113', 'VENTA', 'CONFIRMADA', '2026-09-30', 971.87, 0, 0, 
  971.87, 971.87, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa El Pintor', 
  (SELECT id FROM clientes WHERE codigo = '2113' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 971.87, "total" = 971.87, "subtotal" = 971.87;

-- Cliente: [2119] Amanda Nicol Fuentes Torrejón (Bs. 14113.71)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02119', 'VENTA', 'CONFIRMADA', '2026-09-30', 14113.71, 0, 0, 
  14113.71, 14113.71, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Amanda Nicol Fuentes Torrejón', 
  (SELECT id FROM clientes WHERE codigo = '2119' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 14113.71, "total" = 14113.71, "subtotal" = 14113.71;

-- Cliente: [2121] Servi Color (Bs. 10672.47)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02121', 'VENTA', 'CONFIRMADA', '2026-09-30', 10672.47, 0, 0, 
  10672.47, 10672.47, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Servi Color', 
  (SELECT id FROM clientes WHERE codigo = '2121' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 10672.47, "total" = 10672.47, "subtotal" = 10672.47;

-- Cliente: [2129] Pinturas Gabo (Bs. 11955.46)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02129', 'VENTA', 'CONFIRMADA', '2026-09-30', 11955.46, 0, 0, 
  11955.46, 11955.46, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Gabo', 
  (SELECT id FROM clientes WHERE codigo = '2129' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 11955.46, "total" = 11955.46, "subtotal" = 11955.46;

-- Cliente: [2130] Ferreteria VAC (Bs. 1083.74)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02130', 'VENTA', 'CONFIRMADA', '2026-09-30', 1083.74, 0, 0, 
  1083.74, 1083.74, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferreteria VAC', 
  (SELECT id FROM clientes WHERE codigo = '2130' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1083.74, "total" = 1083.74, "subtotal" = 1083.74;

-- Cliente: [2131] Universo de Colores (Bs. 6198.69)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02131', 'VENTA', 'CONFIRMADA', '2026-09-30', 6198.69, 0, 0, 
  6198.69, 6198.69, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Universo de Colores', 
  (SELECT id FROM clientes WHERE codigo = '2131' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 6198.69, "total" = 6198.69, "subtotal" = 6198.69;

-- Cliente: [2132] Pinturas Lukas (Bs. 937.07)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02132', 'VENTA', 'CONFIRMADA', '2026-09-30', 937.07, 0, 0, 
  937.07, 937.07, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Lukas', 
  (SELECT id FROM clientes WHERE codigo = '2132' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 937.07, "total" = 937.07, "subtotal" = 937.07;

-- Cliente: [2135] Pinturas Lider (Bs. 4403.89)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02135', 'VENTA', 'CONFIRMADA', '2026-09-30', 4403.89, 0, 0, 
  4403.89, 4403.89, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Lider', 
  (SELECT id FROM clientes WHERE codigo = '2135' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 4403.89, "total" = 4403.89, "subtotal" = 4403.89;

-- Cliente: [2137] Ferreteria Angel (Bs. 1049.02)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02137', 'VENTA', 'CONFIRMADA', '2026-09-30', 1049.02, 0, 0, 
  1049.02, 1049.02, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferreteria Angel', 
  (SELECT id FROM clientes WHERE codigo = '2137' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1049.02, "total" = 1049.02, "subtotal" = 1049.02;

-- Cliente: [2145] Ferreteria Don Cleto (Bs. 2000.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02145', 'VENTA', 'CONFIRMADA', '2026-09-30', 2000.00, 0, 0, 
  2000.00, 2000.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferreteria Don Cleto', 
  (SELECT id FROM clientes WHERE codigo = '2145' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2000.00, "total" = 2000.00, "subtotal" = 2000.00;

-- Cliente: [2152] Ferretería Comun (Bs. 278.12)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02152', 'VENTA', 'CONFIRMADA', '2026-09-30', 278.12, 0, 0, 
  278.12, 278.12, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferretería Comun', 
  (SELECT id FROM clientes WHERE codigo = '2152' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 278.12, "total" = 278.12, "subtotal" = 278.12;

-- Cliente: [2155] Pinturas Diego (Bs. 15273.79)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02155', 'VENTA', 'CONFIRMADA', '2026-09-30', 15273.79, 0, 0, 
  15273.79, 15273.79, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Pinturas Diego', 
  (SELECT id FROM clientes WHERE codigo = '2155' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 15273.79, "total" = 15273.79, "subtotal" = 15273.79;

-- Cliente: [2162] Jery Colors (Bs. 2648.89)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02162', 'VENTA', 'CONFIRMADA', '2026-09-30', 2648.89, 0, 0, 
  2648.89, 2648.89, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Jery Colors', 
  (SELECT id FROM clientes WHERE codigo = '2162' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 2648.89, "total" = 2648.89, "subtotal" = 2648.89;

-- Cliente: [2163] Ferreteria Valeshka (Bs. 1980.29)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-02163', 'VENTA', 'CONFIRMADA', '2026-09-30', 1980.29, 0, 0, 
  1980.29, 1980.29, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ferreteria Valeshka', 
  (SELECT id FROM clientes WHERE codigo = '2163' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1980.29, "total" = 1980.29, "subtotal" = 1980.29;

-- Cliente: [3001] Comercial David (Bs. 36050.32)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03001', 'VENTA', 'CONFIRMADA', '2026-09-30', 36050.32, 0, 0, 
  36050.32, 36050.32, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial David', 
  (SELECT id FROM clientes WHERE codigo = '3001' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 36050.32, "total" = 36050.32, "subtotal" = 36050.32;

-- Cliente: [3002] Fernando Martínez (Bs. 4094.39)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03002', 'VENTA', 'CONFIRMADA', '2026-09-30', 4094.39, 0, 0, 
  4094.39, 4094.39, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Fernando Martínez', 
  (SELECT id FROM clientes WHERE codigo = '3002' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 4094.39, "total" = 4094.39, "subtotal" = 4094.39;

-- Cliente: [3003] Comercial Rosario (Bs. 1197.10)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03003', 'VENTA', 'CONFIRMADA', '2026-09-30', 1197.10, 0, 0, 
  1197.10, 1197.10, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Rosario', 
  (SELECT id FROM clientes WHERE codigo = '3003' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1197.10, "total" = 1197.10, "subtotal" = 1197.10;

-- Cliente: [3005] Casa Altiplano (Bs. 16846.40)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03005', 'VENTA', 'CONFIRMADA', '2026-09-30', 16846.40, 0, 0, 
  16846.40, 16846.40, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Casa Altiplano', 
  (SELECT id FROM clientes WHERE codigo = '3005' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 16846.40, "total" = 16846.40, "subtotal" = 16846.40;

-- Cliente: [3012] Percy Gonzales (Bs. 18164.45)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03012', 'VENTA', 'CONFIRMADA', '2026-09-30', 18164.45, 0, 0, 
  18164.45, 18164.45, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Percy Gonzales', 
  (SELECT id FROM clientes WHERE codigo = '3012' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 18164.45, "total" = 18164.45, "subtotal" = 18164.45;

-- Cliente: [3017] Selin Gonzales (Bs. 7887.33)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03017', 'VENTA', 'CONFIRMADA', '2026-09-30', 7887.33, 0, 0, 
  7887.33, 7887.33, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Selin Gonzales', 
  (SELECT id FROM clientes WHERE codigo = '3017' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 7887.33, "total" = 7887.33, "subtotal" = 7887.33;

-- Cliente: [3019] Comercial Erminia (Bs. 100.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03019', 'VENTA', 'CONFIRMADA', '2026-09-30', 100.00, 0, 0, 
  100.00, 100.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Erminia', 
  (SELECT id FROM clientes WHERE codigo = '3019' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 100.00, "total" = 100.00, "subtotal" = 100.00;

-- Cliente: [3021] Ram Color (Bs. 8389.10)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03021', 'VENTA', 'CONFIRMADA', '2026-09-30', 8389.10, 0, 0, 
  8389.10, 8389.10, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Ram Color', 
  (SELECT id FROM clientes WHERE codigo = '3021' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 8389.10, "total" = 8389.10, "subtotal" = 8389.10;

-- Cliente: [3022] Comercial Matty (Bs. 1417.00)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-03022', 'VENTA', 'CONFIRMADA', '2026-09-30', 1417.00, 0, 0, 
  1417.00, 1417.00, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Comercial Matty', 
  (SELECT id FROM clientes WHERE codigo = '3022' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 1417.00, "total" = 1417.00, "subtotal" = 1417.00;

-- Cliente: [5002] Franz Agostopa (Bs. 29904.97)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-05002', 'VENTA', 'CONFIRMADA', '2026-09-30', 29904.97, 0, 0, 
  29904.97, 29904.97, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Franz Agostopa', 
  (SELECT id FROM clientes WHERE codigo = '5002' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 29904.97, "total" = 29904.97, "subtotal" = 29904.97;

-- Cliente: [5003] Color Mix - Jorge Gonzales (Bs. 8329.03)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-05003', 'VENTA', 'CONFIRMADA', '2026-09-30', 8329.03, 0, 0, 
  8329.03, 8329.03, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Color Mix - Jorge Gonzales', 
  (SELECT id FROM clientes WHERE codigo = '5003' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 8329.03, "total" = 8329.03, "subtotal" = 8329.03;

-- Cliente: [5008] Felipe Torihuano (Bs. 7875.31)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-05008', 'VENTA', 'CONFIRMADA', '2026-09-30', 7875.31, 0, 0, 
  7875.31, 7875.31, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - Felipe Torihuano', 
  (SELECT id FROM clientes WHERE codigo = '5008' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 7875.31, "total" = 7875.31, "subtotal" = 7875.31;

-- Cliente: [8002] El Chaqueñazo (Bs. 45991.65)
INSERT INTO notas (
  "numero", "tipo", "estado", "fecha", "subtotal", "descuento", "impuesto", 
  "total", "saldo", "moneda", "tipoCambio", "tipoPago", "diasCredito", 
  "conFactura", "observaciones", "clienteId", "sucursalId", "usuarioId", 
  "creadoEn", "actualizadoEn"
) VALUES (
  'SAL-LP-08002', 'VENTA', 'CONFIRMADA', '2026-09-30', 45991.65, 0, 0, 
  45991.65, 45991.65, 'BOB', 6.96, 'CREDITO', 0, 
  false, 'Saldo inicial al 30/09/2026 - El Chaqueñazo', 
  (SELECT id FROM clientes WHERE codigo = '8002' LIMIT 1), 
  (SELECT id FROM sucursales WHERE LOWER(nombre) LIKE '%la paz%' LIMIT 1), 
  (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1), 
  NOW(), NOW()
) ON CONFLICT ("numero") DO UPDATE SET "saldo" = 45991.65, "total" = 45991.65, "subtotal" = 45991.65;

COMMIT;
