-- =================================================================
-- SCRIPT DE ACTUALIZACIÓN: PRECIOS DE COMPRA (COSTO UNITARIO)
-- FECHA: 2026-10-05
-- ARCHIVO ORIGEN: Precios de compra.xlsx
-- TOTAL PRODUCTOS A ACTUALIZAR: 1151
-- =================================================================

BEGIN;

-- [BH-P36] Lija en Disco Velcro 7" BH P36
UPDATE productos SET "precioCompra" = 0.88, "actualizadoEn" = NOW() WHERE codigo = 'BH-P36';

-- [BH-P40] Lija en Disco Velcro 7" BH P40
UPDATE productos SET "precioCompra" = 0.88, "actualizadoEn" = NOW() WHERE codigo = 'BH-P40';

-- [BH-P60] Lija en Disco Velcro 7" BH P60
UPDATE productos SET "precioCompra" = 0.88, "actualizadoEn" = NOW() WHERE codigo = 'BH-P60';

-- [BH-P80] Lija en Disco Velcro 7" BH P80
UPDATE productos SET "precioCompra" = 1.07, "actualizadoEn" = NOW() WHERE codigo = 'BH-P80';

-- [004783.22] Acelerador de Secado  p/ PU Brz 225ml
UPDATE productos SET "precioCompra" = 10.98, "actualizadoEn" = NOW() WHERE codigo = '004783.22';

-- [005383.75] Barniz HG 7300 Brz 750ml
UPDATE productos SET "precioCompra" = 44.38, "actualizadoEn" = NOW() WHERE codigo = '005383.75';

-- [005183.90] Barniz HS HT 70 2:1 15%  Brz  900ml
UPDATE productos SET "precioCompra" = 102.1, "actualizadoEn" = NOW() WHERE codigo = '005183.90';

-- [004183.60] Barniz Mate HT 2:1 Brz 600ml
UPDATE productos SET "precioCompra" = 79.85, "actualizadoEn" = NOW() WHERE codigo = '004183.60';

-- [001083.75] Barniz Metalizado Brz 750ml
UPDATE productos SET "precioCompra" = 61, "actualizadoEn" = NOW() WHERE codigo = '001083.75';

-- [000783.75] Barniz PU HG 7700 turbo 5:1 Brz 750ml
UPDATE productos SET "precioCompra" = 49.76, "actualizadoEn" = NOW() WHERE codigo = '000783.75';

-- [000583.75] Barniz PU HP 6000 Brz 750ml
UPDATE productos SET "precioCompra" = 40.28, "actualizadoEn" = NOW() WHERE codigo = '000583.75';

-- [010283.90] Barniz PU HS HT 50 Brz 900ml
UPDATE productos SET "precioCompra" = 87.82, "actualizadoEn" = NOW() WHERE codigo = '010283.90';

-- [012083.90] Barniz PU HT 40 Brz 900ml
UPDATE productos SET "precioCompra" = 67.56, "actualizadoEn" = NOW() WHERE codigo = '012083.90';

-- [700889L.36] BL 8123 Negro Brz 3.6l
UPDATE productos SET "precioCompra" = 123.82, "actualizadoEn" = NOW() WHERE codigo = '700889L.36';

-- [500589L.36] BL 8126 Verde Brz 3.6l
UPDATE productos SET "precioCompra" = 101.78, "actualizadoEn" = NOW() WHERE codigo = '500589L.36';

-- [500589L.90] BL 8126 Verde Brz 900ml
UPDATE productos SET "precioCompra" = 30.11, "actualizadoEn" = NOW() WHERE codigo = '500589L.90';

-- [202089L.36] BL 8128 Naranja Brz 3.6l
UPDATE productos SET "precioCompra" = 115.84, "actualizadoEn" = NOW() WHERE codigo = '202089L.36';

-- [301889L.90] BL 8225 Marrón Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 42.48, "actualizadoEn" = NOW() WHERE codigo = '301889L.90';

-- [401889L.90] BL 8227 Violeta Rojizo Brz  900ml
UPDATE productos SET "precioCompra" = 62.06, "actualizadoEn" = NOW() WHERE codigo = '401889L.90';

-- [302089L.36] BL 8229 Rojo Limpio Brz 3.6l
UPDATE productos SET "precioCompra" = 118.99, "actualizadoEn" = NOW() WHERE codigo = '302089L.36';

-- [302089L.90] BL 8229 Rojo Limpio Brz 900ml
UPDATE productos SET "precioCompra" = 43.32, "actualizadoEn" = NOW() WHERE codigo = '302089L.90';

-- [100689L.36] BL 8321 Blanco Brz 3.6l
UPDATE productos SET "precioCompra" = 196.71, "actualizadoEn" = NOW() WHERE codigo = '100689L.36';

-- [201889L.36] BL 8324 Amarillo Verdoso 3.6l
UPDATE productos SET "precioCompra" = 186.52, "actualizadoEn" = NOW() WHERE codigo = '201889L.36';

-- [201989L.90] BL 8325 Amarillo Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 48.59, "actualizadoEn" = NOW() WHERE codigo = '201989L.90';

-- [201789L.36] BL 8326 Amarillo Óxido Brz 3.6l
UPDATE productos SET "precioCompra" = 139.33, "actualizadoEn" = NOW() WHERE codigo = '201789L.36';

-- [401789L.36] BL 8327 Azul Verdoso Brz 3.6l
UPDATE productos SET "precioCompra" = 161.11, "actualizadoEn" = NOW() WHERE codigo = '401789L.36';

-- [401789L.90] BL 8327 Azul Verdoso Brz 900ml
UPDATE productos SET "precioCompra" = 38.29, "actualizadoEn" = NOW() WHERE codigo = '401789L.90';

-- [401689L.90] BL 8329 Azul Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 28.91, "actualizadoEn" = NOW() WHERE codigo = '401689L.90';

-- [302189L.90] BL 8424 Rojo Óxido Brz 900ml
UPDATE productos SET "precioCompra" = 33.83, "actualizadoEn" = NOW() WHERE codigo = '302189L.90';

-- [401989L.90] BL 8426 Violeta Azulado Brz 900ml
UPDATE productos SET "precioCompra" = 81.46, "actualizadoEn" = NOW() WHERE codigo = '401989L.90';

-- [700289B.36] BP 8072 Negro Brz 3.6l
UPDATE productos SET "precioCompra" = 182.19, "actualizadoEn" = NOW() WHERE codigo = '700289B.36';

-- [100189B.90] BP 8073 Blanco Brz 900ml
UPDATE productos SET "precioCompra" = 45.66, "actualizadoEn" = NOW() WHERE codigo = '100189B.90';

-- [400289B.90] BP 8074 Azul Limpio Brz 900ml
UPDATE productos SET "precioCompra" = 33.95, "actualizadoEn" = NOW() WHERE codigo = '400289B.90';

-- [400189B.90] BP 8075 Azul Medio Brz 900ml
UPDATE productos SET "precioCompra" = 71.1, "actualizadoEn" = NOW() WHERE codigo = '400189B.90';

-- [400689B.90] BP 8076 Azul Medio Intenso Brz 900ml
UPDATE productos SET "precioCompra" = 62.06, "actualizadoEn" = NOW() WHERE codigo = '400689B.90';

-- [400489B.90] BP 8077 Azul Intenso Brz 900ml
UPDATE productos SET "precioCompra" = 86.41, "actualizadoEn" = NOW() WHERE codigo = '400489B.90';

-- [700189B.36] BP 8078 Clear Brz 3.6l
UPDATE productos SET "precioCompra" = 101.23, "actualizadoEn" = NOW() WHERE codigo = '700189B.36';

-- [400789B.90] BP 8079 Azul (verdoso) Brz 900ml
UPDATE productos SET "precioCompra" = 101.87, "actualizadoEn" = NOW() WHERE codigo = '400789B.90';

-- [400789B.36] BP 8079 Azul Brz 3.6l
UPDATE productos SET "precioCompra" = 387.09, "actualizadoEn" = NOW() WHERE codigo = '400789B.36';

-- [200689B.90] BP 8170 Amarillo Transparente Brz  900ml
UPDATE productos SET "precioCompra" = 56.08, "actualizadoEn" = NOW() WHERE codigo = '200689B.90';

-- [300189B.90] BP 8171 Rojo Medio Brz 900ml
UPDATE productos SET "precioCompra" = 44.56, "actualizadoEn" = NOW() WHERE codigo = '300189B.90';

-- [202989B.90] BP 8172 Amarillo Limón Brilloso Brz 900ml
UPDATE productos SET "precioCompra" = 83.68, "actualizadoEn" = NOW() WHERE codigo = '202989B.90';

-- [200589B.90] BP 8173 Naranja Brz 900ml
UPDATE productos SET "precioCompra" = 44.73, "actualizadoEn" = NOW() WHERE codigo = '200589B.90';

-- [300889B.90] BP 8174 Rojo Transparente Brz 900ml
UPDATE productos SET "precioCompra" = 61.62, "actualizadoEn" = NOW() WHERE codigo = '300889B.90';

-- [300789B.90] BP 8175 Rojo Óxido Brz 900ml
UPDATE productos SET "precioCompra" = 29.52, "actualizadoEn" = NOW() WHERE codigo = '300789B.90';

-- [200489B.90] BP 8176 Naranja Limpio Brz 900ml
UPDATE productos SET "precioCompra" = 63.93, "actualizadoEn" = NOW() WHERE codigo = '200489B.90';

-- [300289B.90] BP 8178 Rojo Rubí Brz 900ml
UPDATE productos SET "precioCompra" = 88.61, "actualizadoEn" = NOW() WHERE codigo = '300289B.90';

-- [200289B.90] BP 8179 Amarillo Limpio Brz 900ml
UPDATE productos SET "precioCompra" = 63.81, "actualizadoEn" = NOW() WHERE codigo = '200289B.90';

-- [300589B.90] BP 8270 Rosa Brz 900ml
UPDATE productos SET "precioCompra" = 61.62, "actualizadoEn" = NOW() WHERE codigo = '300589B.90';

-- [200789B.90] BP 8271 Amarillo Óxido Brz 900ml
UPDATE productos SET "precioCompra" = 48.07, "actualizadoEn" = NOW() WHERE codigo = '200789B.90';

-- [200189B.90] BP 8272 Amarillo Cromo Brz 900ml
UPDATE productos SET "precioCompra" = 30.45, "actualizadoEn" = NOW() WHERE codigo = '200189B.90';

-- [200389B.90] BP 8273 Amarillo Verdoso Trans. Brz 900ml
UPDATE productos SET "precioCompra" = 147.53, "actualizadoEn" = NOW() WHERE codigo = '200389B.90';

-- [300689B.90] BP 8274 Rojo Vivo Brz 900ml
UPDATE productos SET "precioCompra" = 57.61, "actualizadoEn" = NOW() WHERE codigo = '300689B.90';

-- [300389B.90] BP 8275 Rojo Intenso Brz 900ml
UPDATE productos SET "precioCompra" = 40.83, "actualizadoEn" = NOW() WHERE codigo = '300389B.90';

-- [600189B.90] BP 8276 Marrón Limpio Brz 900ml
UPDATE productos SET "precioCompra" = 83.59, "actualizadoEn" = NOW() WHERE codigo = '600189B.90';

-- [600289B.36] BP 8277 Marrón Brz 3.6l
UPDATE productos SET "precioCompra" = 372.8, "actualizadoEn" = NOW() WHERE codigo = '600289B.36';

-- [600289B.90] BP 8277 Marrón Medio Brz 900ml
UPDATE productos SET "precioCompra" = 97.18, "actualizadoEn" = NOW() WHERE codigo = '600289B.90';

-- [600389B.90] BP 8279 Marrón Amarillento Brz 900ml
UPDATE productos SET "precioCompra" = 235.03, "actualizadoEn" = NOW() WHERE codigo = '600389B.90';

-- [400589B.90] BP 8370 Violeta Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 68.03, "actualizadoEn" = NOW() WHERE codigo = '400589B.90';

-- [100289B.36] BP 8371 Blanco Puro Brz 3.6l
UPDATE productos SET "precioCompra" = 216.26, "actualizadoEn" = NOW() WHERE codigo = '100289B.36';

-- [500189B.90] BP 8373 Verde Azulado Brz 900ml
UPDATE productos SET "precioCompra" = 49.06, "actualizadoEn" = NOW() WHERE codigo = '500189B.90';

-- [500289B.90] BP 8374 Verde Amarillento Brz 900ml
UPDATE productos SET "precioCompra" = 49.27, "actualizadoEn" = NOW() WHERE codigo = '500289B.90';

-- [400389B.90] BP 8378 Violeta Azulado Brz 900ml
UPDATE productos SET "precioCompra" = 71.19, "actualizadoEn" = NOW() WHERE codigo = '400389B.90';

-- [100389B.90] BP 8471 Blanco Micronizado Brz 900ml
UPDATE productos SET "precioCompra" = 149.87, "actualizadoEn" = NOW() WHERE codigo = '100389B.90';

-- [700389B.90] BP 8472 Negro Azulado Brz 900ml
UPDATE productos SET "precioCompra" = 89.68, "actualizadoEn" = NOW() WHERE codigo = '700389B.90';

-- [801089B.36] BP 8572 Aluminio Medio Brz 3.6l
UPDATE productos SET "precioCompra" = 118.22, "actualizadoEn" = NOW() WHERE codigo = '801089B.36';

-- [800189B.90] BP 8574 Aluminio Grueso Claro Brz 900ml
UPDATE productos SET "precioCompra" = 56.2, "actualizadoEn" = NOW() WHERE codigo = '800189B.90';

-- [800289B.90] BP 8575 Aluminio Medio Grueso Brz 900ml
UPDATE productos SET "precioCompra" = 28.81, "actualizadoEn" = NOW() WHERE codigo = '800289B.90';

-- [800389B.36] BP 8577 Aluminio Medio Brillante Brz 3.6l
UPDATE productos SET "precioCompra" = 150.39, "actualizadoEn" = NOW() WHERE codigo = '800389B.36';

-- [800489B.90] BP 8578 Aluminio Fino Lechoso Brz 900ml
UPDATE productos SET "precioCompra" = 53.27, "actualizadoEn" = NOW() WHERE codigo = '800489B.90';

-- [802389B.90] BP 8670 Perlado Bronce Fino Brz 900ml
UPDATE productos SET "precioCompra" = 81.39, "actualizadoEn" = NOW() WHERE codigo = '802389B.90';

-- [800989B.90] BP 8671 Aluminio Oro Brz 900ml
UPDATE productos SET "precioCompra" = 93.22, "actualizadoEn" = NOW() WHERE codigo = '800989B.90';

-- [800589B.36] BP 8673 Aluminio Medio Claro Brz 3.6l
UPDATE productos SET "precioCompra" = 126.65, "actualizadoEn" = NOW() WHERE codigo = '800589B.36';

-- [802589B.90] BP 8674 Perlado Rojo Fino Brz 900ml
UPDATE productos SET "precioCompra" = 81.96, "actualizadoEn" = NOW() WHERE codigo = '802589B.90';

-- [801189B.90] BP 8675 Perlado Blanco Fino Brz 900ml
UPDATE productos SET "precioCompra" = 76.78, "actualizadoEn" = NOW() WHERE codigo = '801189B.90';

-- [802489B.90] BP 8676 Perlado Azul Fino Brz 900ml
UPDATE productos SET "precioCompra" = 134.34, "actualizadoEn" = NOW() WHERE codigo = '802489B.90';

-- [801289B.90] BP 8677 Perlado Rojo Brz 900ml
UPDATE productos SET "precioCompra" = 87.23, "actualizadoEn" = NOW() WHERE codigo = '801289B.90';

-- [801389B.90] BP 8678 Perlado Azul  Brz 900ml
UPDATE productos SET "precioCompra" = 79.85, "actualizadoEn" = NOW() WHERE codigo = '801389B.90';

-- [801489B.90] BP 8679 Perlado Blanco Brz 900ml
UPDATE productos SET "precioCompra" = 108.66, "actualizadoEn" = NOW() WHERE codigo = '801489B.90';

-- [000189B.90] BP 8700 Aditivo de Efecto Brz 900ml
UPDATE productos SET "precioCompra" = 50.35, "actualizadoEn" = NOW() WHERE codigo = '000189B.90';

-- [700489B.90] BP 8770 Grafito Brz 900ml
UPDATE productos SET "precioCompra" = 48.59, "actualizadoEn" = NOW() WHERE codigo = '700489B.90';

-- [801589B.90] BP 8771 Perlado Violeta Osc. Brz 900ml
UPDATE productos SET "precioCompra" = 105.16, "actualizadoEn" = NOW() WHERE codigo = '801589B.90';

-- [801689B.90] BP 8773 Perlado Rojo II Brz 900ml
UPDATE productos SET "precioCompra" = 81.2, "actualizadoEn" = NOW() WHERE codigo = '801689B.90';

-- [801789B.90] BP 8774 Perlado Verde Brz 900ml
UPDATE productos SET "precioCompra" = 91.2, "actualizadoEn" = NOW() WHERE codigo = '801789B.90';

-- [801889B.90] BP 8775 Perlado Violeta Brz 900ml
UPDATE productos SET "precioCompra" = 90.39, "actualizadoEn" = NOW() WHERE codigo = '801889B.90';

-- [801989B.90] BP 8776 Perlado Verde Azulado Brz 900ml
UPDATE productos SET "precioCompra" = 66.35, "actualizadoEn" = NOW() WHERE codigo = '801989B.90';

-- [802089B.90] BP 8777 Perlado Bronce Brz 900ml
UPDATE productos SET "precioCompra" = 69.26, "actualizadoEn" = NOW() WHERE codigo = '802089B.90';

-- [802189B.90] BP 8778 Perlado Rojo Claro Brz 900ml
UPDATE productos SET "precioCompra" = 67.92, "actualizadoEn" = NOW() WHERE codigo = '802189B.90';

-- [802289B.90] BP 8779 Perlado Oro Brz 900ml
UPDATE productos SET "precioCompra" = 86.06, "actualizadoEn" = NOW() WHERE codigo = '802289B.90';

-- [802689B.90] BP 8780 Perlado Súper Blanco Brz 900ml
UPDATE productos SET "precioCompra" = 241.31, "actualizadoEn" = NOW() WHERE codigo = '802689B.90';

-- [802789B.90] BP 8781 Perlado Súper Azul Brz 900ml
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = '802789B.90';

-- [802889B.90] BP 8782 Perlado Súper Rojo Brz 900ml
UPDATE productos SET "precioCompra" = 174.39, "actualizadoEn" = NOW() WHERE codigo = '802889B.90';

-- [802989B.90] BP 8783 Perlado Súper Cobre Brz 900ml
UPDATE productos SET "precioCompra" = 194.19, "actualizadoEn" = NOW() WHERE codigo = '802989B.90';

-- [800689B.90] BP 8972 Aluminio Fino Brz 900ml
UPDATE productos SET "precioCompra" = 33.55, "actualizadoEn" = NOW() WHERE codigo = '800689B.90';

-- [800789B.36] BP 8973 Aluminio Brillante Brz 3.6l
UPDATE productos SET "precioCompra" = 173.22, "actualizadoEn" = NOW() WHERE codigo = '800789B.36';

-- [800889B.36] BP 8974 Aluminio Grueso Brillante Brz 3.6l
UPDATE productos SET "precioCompra" = 203.16, "actualizadoEn" = NOW() WHERE codigo = '800889B.36';

-- [800889B.90] BP 8974 Aluminio Grueso Brillante Brz 900ml
UPDATE productos SET "precioCompra" = 57.37, "actualizadoEn" = NOW() WHERE codigo = '800889B.90';

-- [700789S.36] BS 8012  Negro Brz 3.6l
UPDATE productos SET "precioCompra" = 104.76, "actualizadoEn" = NOW() WHERE codigo = '700789S.36';

-- [201689S.36] BS 8014 Amarillo Limón Verdoso Brz 3.6l
UPDATE productos SET "precioCompra" = 145.55, "actualizadoEn" = NOW() WHERE codigo = '201689S.36';

-- [201589S.36] BS 8015 Amarillo Rojizo Brz 3.6l
UPDATE productos SET "precioCompra" = 172.17, "actualizadoEn" = NOW() WHERE codigo = '201589S.36';

-- [201389S.36] BS 8016 Amarillo Óxido Brz 3.6l
UPDATE productos SET "precioCompra" = 104.51, "actualizadoEn" = NOW() WHERE codigo = '201389S.36';

-- [401389S.36] BS 8018 Azul Verdoso Brz 3.6l
UPDATE productos SET "precioCompra" = 138.51, "actualizadoEn" = NOW() WHERE codigo = '401389S.36';

-- [401489S.90] BS 8019 Azul Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = '401489S.90';

-- [500489S.36] BS 8116 Verde Brz 3.6l
UPDATE productos SET "precioCompra" = 114.98, "actualizadoEn" = NOW() WHERE codigo = '500489S.36';

-- [201489S.36] BS 8118 Naranja Brz  3.6l
UPDATE productos SET "precioCompra" = 139.27, "actualizadoEn" = NOW() WHERE codigo = '201489S.36';

-- [401289S.90] BS 8216 Violeta Azulado Brz 900ml
UPDATE productos SET "precioCompra" = 50, "actualizadoEn" = NOW() WHERE codigo = '401289S.90';

-- [401589S.90] BS 8217 Violeta Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 46.6, "actualizadoEn" = NOW() WHERE codigo = '401589S.90';

-- [301789S.36] BS 8219 Rojo Brz 3.6l
UPDATE productos SET "precioCompra" = 104.28, "actualizadoEn" = NOW() WHERE codigo = '301789S.36';

-- [000389.36] BS 8316 Clear Brz 3.6l
UPDATE productos SET "precioCompra" = 85.82, "actualizadoEn" = NOW() WHERE codigo = '000389.36';

-- [100589S.36] BS 8511 Blanco Brz 3.6l
UPDATE productos SET "precioCompra" = 180.31, "actualizadoEn" = NOW() WHERE codigo = '100589S.36';

-- [010183.45] Catalizador  p/ HT 50 Brz 450ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '010183.45';

-- [000383.10] Catalizador normal p/primer 8:1 Brz 100ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '000383.10';

-- [012283.45] Catalizador p/ Barniz pu HT 40 Brz 450ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '012283.45';

-- [004383.30] Catalizador p/ Barniz PU Mate HT Brz 300ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '004383.30';

-- [000281.15] Catalizador p/ Esmalte Sintético Brz 150ml
UPDATE productos SET "precioCompra" = 10.3, "actualizadoEn" = NOW() WHERE codigo = '000281.15';

-- [005483.15] Catalizador p/ HG 7300 Brz 150 ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '005483.15';

-- [000185.30] Catalizador p/ Negro Mate/Wash P Brz 300ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '000185.30';

-- [009383.15] Catalizador p/HG 7700 Brz 150ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '009383.15';

-- [009483.15] Catalizador p/HP 6000 Brz 150ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '009483.15';

-- [005783.45] Catalizador p/HT 71 Rapido Brz 450ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '005783.45';

-- [009583.22] Catalizador rápido p/  PU Brz 225ml
UPDATE productos SET "precioCompra" = 26.93, "actualizadoEn" = NOW() WHERE codigo = '009583.22';

-- [009583.45] Catalizador rápido p/ PU Brz 450ml
UPDATE productos SET "precioCompra" = 48.59, "actualizadoEn" = NOW() WHERE codigo = '009583.45';

-- [009583.90] Catalizador rápido p/ PU Brz 900ml
UPDATE productos SET "precioCompra" = 94.84, "actualizadoEn" = NOW() WHERE codigo = '009583.90';

-- [011383.15] Catalizador rápido p/primer HS 5:1:1 Brz 150ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '011383.15';

-- [013490] Catalogo Automotriz 2009-2019 Brz
UPDATE productos SET "precioCompra" = 199.24, "actualizadoEn" = NOW() WHERE codigo = '013490';

-- [000001] Catalogo de colores Automotivo Brazilian
UPDATE productos SET "precioCompra" = 222.36, "actualizadoEn" = NOW() WHERE codigo = '000001';

-- [402387.90] Colorbase Azul Noche Met. VW LH5X Brz 900ml
UPDATE productos SET "precioCompra" = 39.71, "actualizadoEn" = NOW() WHERE codigo = '402387.90';

-- [111887.90] Colorbase Blanco Cristal VW LB9A Brz 900ml
UPDATE productos SET "precioCompra" = 44.46, "actualizadoEn" = NOW() WHERE codigo = '111887.90';

-- [111987.90] Colorbase Blanco Toyota 040 Brz 900ml
UPDATE productos SET "precioCompra" = 58.04, "actualizadoEn" = NOW() WHERE codigo = '111987.90';

-- [112187.90] Colorbase Blanco Toyota 058 Brz 900ml
UPDATE productos SET "precioCompra" = 58.04, "actualizadoEn" = NOW() WHERE codigo = '112187.90';

-- [001187.36] Colorbase Clear II Brz 3.6l
UPDATE productos SET "precioCompra" = 155.49, "actualizadoEn" = NOW() WHERE codigo = '001187.36';

-- [001187.18] Colorbase Clear II Brz 18l
UPDATE productos SET "precioCompra" = 689.29, "actualizadoEn" = NOW() WHERE codigo = '001187.18';

-- [812587.90] Colorbase Gris Magnético Met. 1G3 Brz 900ml
UPDATE productos SET "precioCompra" = 42.83, "actualizadoEn" = NOW() WHERE codigo = '812587.90';

-- [802087.90] Colorbase Plata Classic Met. Toyota 1F7 Brz 900ml
UPDATE productos SET "precioCompra" = 79.76, "actualizadoEn" = NOW() WHERE codigo = '802087.90';

-- [812487.90] Colorbase Plata Silver Met. Toyota 199 Brz 900ml
UPDATE productos SET "precioCompra" = 79.76, "actualizadoEn" = NOW() WHERE codigo = '812487.90';

-- [811487.90] Colorbase Plata Sirius Met. VW LE7Q Brz 900ml
UPDATE productos SET "precioCompra" = 44.46, "actualizadoEn" = NOW() WHERE codigo = '811487.90';

-- [802487.90] Colorbase Plateado Met. Toyota 1CO Brz 900ml
UPDATE productos SET "precioCompra" = 39.71, "actualizadoEn" = NOW() WHERE codigo = '802487.90';

-- [811587.90] Colorbase Plateado Supernova Met. Toyota 1E7 Brz 900ml
UPDATE productos SET "precioCompra" = 39.71, "actualizadoEn" = NOW() WHERE codigo = '811587.90';

-- [318987.90] Colorbase Rojo Flash VW LP3G Brz 900ml
UPDATE productos SET "precioCompra" = 52.23, "actualizadoEn" = NOW() WHERE codigo = '318987.90';

-- [319187.36] Colorbase Rojo Vivo Brz 3.6l
UPDATE productos SET "precioCompra" = 253.35, "actualizadoEn" = NOW() WHERE codigo = '319187.36';

-- [319187.90] Colorbase Rojo Vivo Brz 900ml
UPDATE productos SET "precioCompra" = 52.23, "actualizadoEn" = NOW() WHERE codigo = '319187.90';

-- [203783.36] Colordur Amarillo Caterpillar 80/81 Brz 3.6l
UPDATE productos SET "precioCompra" = 181.48, "actualizadoEn" = NOW() WHERE codigo = '203783.36';

-- [203783.90] Colordur Amarillo Caterpillar 80/81 Brz 900ml
UPDATE productos SET "precioCompra" = 50.35, "actualizadoEn" = NOW() WHERE codigo = '203783.90';

-- [209083.36] Colordur Amarillo Oro Brz 3.6l
UPDATE productos SET "precioCompra" = 144.75, "actualizadoEn" = NOW() WHERE codigo = '209083.36';

-- [206283.90] Colordur Amarillo Trigo  I Gm 75 Brz 900ml
UPDATE productos SET "precioCompra" = 31.65, "actualizadoEn" = NOW() WHERE codigo = '206283.90';

-- [400783.90] Colordur Azul Nocturno Vw 08 Brz 900ml
UPDATE productos SET "precioCompra" = 31.08, "actualizadoEn" = NOW() WHERE codigo = '400783.90';

-- [101683.67] Colordur Blanco Puro Brz 675 ml
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = '101683.67';

-- [101683.90] Colordur Blanco Puro Brz  900ml
UPDATE productos SET "precioCompra" = 50.19, "actualizadoEn" = NOW() WHERE codigo = '101683.90';

-- [112183.90] Colordur Blanco Toyota 040  Brz 900ml
UPDATE productos SET "precioCompra" = 52.69, "actualizadoEn" = NOW() WHERE codigo = '112183.90';

-- [112283.90] Colordur Blanco Toyota 041 Brz 900ml
UPDATE productos SET "precioCompra" = 49.1, "actualizadoEn" = NOW() WHERE codigo = '112283.90';

-- [111983.90] Colordur Blanco Toyota 056 Brz 900ml
UPDATE productos SET "precioCompra" = 52.69, "actualizadoEn" = NOW() WHERE codigo = '111983.90';

-- [112083.90] Colordur Blanco Toyota 058 Brz 900ml
UPDATE productos SET "precioCompra" = 52.69, "actualizadoEn" = NOW() WHERE codigo = '112083.90';

-- [001189.36] Colordur Clear p/PU Brz 3.6l
UPDATE productos SET "precioCompra" = 133.6, "actualizadoEn" = NOW() WHERE codigo = '001189.36';

-- [001189.18] Colordur Clear p/PU Brz 18l
UPDATE productos SET "precioCompra" = 601.24, "actualizadoEn" = NOW() WHERE codigo = '001189.18';

-- [220983.90] Colordur Hs Amarillo John Deere Brz 900ml
UPDATE productos SET "precioCompra" = 63.23, "actualizadoEn" = NOW() WHERE codigo = '220983.90';

-- [227283.90] Colordur Hs Amarillo New Holland Brz 900ml
UPDATE productos SET "precioCompra" = 63.23, "actualizadoEn" = NOW() WHERE codigo = '227283.90';

-- [420083.90] Colordur Hs Azul New Holland Brz 900ml
UPDATE productos SET "precioCompra" = 50.35, "actualizadoEn" = NOW() WHERE codigo = '420083.90';

-- [317883.36] Colordur Hs Rojo Massey Ferguson Brz 3.6l
UPDATE productos SET "precioCompra" = 222.11, "actualizadoEn" = NOW() WHERE codigo = '317883.36';

-- [317883.90] Colordur Hs Rojo Massey Ferguson Brz 900ml
UPDATE productos SET "precioCompra" = 63.23, "actualizadoEn" = NOW() WHERE codigo = '317883.90';

-- [506383.36] Colordur Hs Verde John Deere Brz 3.6l
UPDATE productos SET "precioCompra" = 181.48, "actualizadoEn" = NOW() WHERE codigo = '506383.36';

-- [506383.90] Colordur Hs Verde John Deere Brz 900ml
UPDATE productos SET "precioCompra" = 50.35, "actualizadoEn" = NOW() WHERE codigo = '506383.90';

-- [700583.67] Colordur Negro Cadilac Brz 675ml
UPDATE productos SET "precioCompra" = 31.43, "actualizadoEn" = NOW() WHERE codigo = '700583.67';

-- [700583.90] Colordur Negro Cadilac Brz 900ml
UPDATE productos SET "precioCompra" = 49.76, "actualizadoEn" = NOW() WHERE codigo = '700583.90';

-- [908583.36] Colordur Negro Mate Brz 3.6l
UPDATE productos SET "precioCompra" = 188.28, "actualizadoEn" = NOW() WHERE codigo = '908583.36';

-- [908583.90] Colordur Negro Mate Brz 900ml
UPDATE productos SET "precioCompra" = 49.76, "actualizadoEn" = NOW() WHERE codigo = '908583.90';

-- [304783.67] Colordur Rojo Flash II Vw 04 Brz 675ml
UPDATE productos SET "precioCompra" = 35.21, "actualizadoEn" = NOW() WHERE codigo = '304783.67';

-- [304783.90] Colordur Rojo Flash II Vw 04 Brz 900ml
UPDATE productos SET "precioCompra" = 62.06, "actualizadoEn" = NOW() WHERE codigo = '304783.90';

-- [304383.90] Colordur Rojo Munique Ford 92 Brz 900ml
UPDATE productos SET "precioCompra" = 37.94, "actualizadoEn" = NOW() WHERE codigo = '304383.90';

-- [314283.67] Colordur Rojo Tornado Vw Brz 675ml
UPDATE productos SET "precioCompra" = 35.21, "actualizadoEn" = NOW() WHERE codigo = '314283.67';

-- [314283.90] Colordur Rojo Tornado Vw Brz 900ml
UPDATE productos SET "precioCompra" = 40.55, "actualizadoEn" = NOW() WHERE codigo = '314283.90';

-- [304083.90] Colordur Rojo Vino Gm 74 Brz 900ml
UPDATE productos SET "precioCompra" = 35.45, "actualizadoEn" = NOW() WHERE codigo = '304083.90';

-- [318083.36] Colordur Rojo Vivo Brz 3.6l
UPDATE productos SET "precioCompra" = 181.48, "actualizadoEn" = NOW() WHERE codigo = '318083.36';

-- [318083.90] Colordur Rojo Vivo Brz 900ml
UPDATE productos SET "precioCompra" = 35.45, "actualizadoEn" = NOW() WHERE codigo = '318083.90';

-- [700482.90] Colorlac  Gris Chasis 98 Scania Brz 900ml
UPDATE productos SET "precioCompra" = 22.61, "actualizadoEn" = NOW() WHERE codigo = '700482.90';

-- [708082.90] Colorlac Aluminio Grafite p/ Ruedas Brz 900ml
UPDATE productos SET "precioCompra" = 21.74, "actualizadoEn" = NOW() WHERE codigo = '708082.90';

-- [802182.90] Colorlac Aluminio Grueso p/ Ruedas Brz 900ml
UPDATE productos SET "precioCompra" = 40.51, "actualizadoEn" = NOW() WHERE codigo = '802182.90';

-- [800182.90] Colorlac Aluminio Opalescente Brz 900ml
UPDATE productos SET "precioCompra" = 34.89, "actualizadoEn" = NOW() WHERE codigo = '800182.90';

-- [202782.90] Colorlac Amarillo Cat.77 Brz 900ml
UPDATE productos SET "precioCompra" = 22.76, "actualizadoEn" = NOW() WHERE codigo = '202782.90';

-- [203782.90] Colorlac Amarillo Cat. 80/81 Brz 900ml
UPDATE productos SET "precioCompra" = 22.38, "actualizadoEn" = NOW() WHERE codigo = '203782.90';

-- [206282.90] Colorlac Amarillo Trigo I GM 75 Brz 900ml
UPDATE productos SET "precioCompra" = 43.79, "actualizadoEn" = NOW() WHERE codigo = '206282.90';

-- [404382.90] Colorlac Azul  Profundo GM 74 Brz 900ml
UPDATE productos SET "precioCompra" = 29.56, "actualizadoEn" = NOW() WHERE codigo = '404382.90';

-- [405282.90] Colorlac Azul Munich GM 93 Brz 900ml
UPDATE productos SET "precioCompra" = 22.01, "actualizadoEn" = NOW() WHERE codigo = '405282.90';

-- [400782.90] Colorlac Azul Nocturno Brz 900ML
UPDATE productos SET "precioCompra" = 22.39, "actualizadoEn" = NOW() WHERE codigo = '400782.90';

-- [200682.90] Colorlac Beige Vime Brz 900ml
UPDATE productos SET "precioCompra" = 23.27, "actualizadoEn" = NOW() WHERE codigo = '200682.90';

-- [101682.36] Colorlac Blanco Puro Brz 3.6l
UPDATE productos SET "precioCompra" = 159.24, "actualizadoEn" = NOW() WHERE codigo = '101682.36';

-- [101682.90] Colorlac Blanco Puro Brz 900ml
UPDATE productos SET "precioCompra" = 42.5, "actualizadoEn" = NOW() WHERE codigo = '101682.90';

-- [111482.36] Colorlac Blanco Toyota 040 Brz 3.6l
UPDATE productos SET "precioCompra" = 142.73, "actualizadoEn" = NOW() WHERE codigo = '111482.36';

-- [111482.90] Colorlac Blanco Toyota 040 Brz 900ml
UPDATE productos SET "precioCompra" = 42.27, "actualizadoEn" = NOW() WHERE codigo = '111482.90';

-- [111582.90] Colorlac Blanco Toyota 041 Brz 900ml
UPDATE productos SET "precioCompra" = 42.27, "actualizadoEn" = NOW() WHERE codigo = '111582.90';

-- [111682.90] Colorlac Blanco Toyota 056 Brz 900ml
UPDATE productos SET "precioCompra" = 42.27, "actualizadoEn" = NOW() WHERE codigo = '111682.90';

-- [111782.90] Colorlac Blanco Toyota 058 Brz  900ml
UPDATE productos SET "precioCompra" = 42.27, "actualizadoEn" = NOW() WHERE codigo = '111782.90';

-- [700582.36] Colorlac Negro Cadilac Brz 3.6l
UPDATE productos SET "precioCompra" = 163.45, "actualizadoEn" = NOW() WHERE codigo = '700582.36';

-- [700582.90] Colorlac Negro Cadilac Brz 900ml
UPDATE productos SET "precioCompra" = 40.59, "actualizadoEn" = NOW() WHERE codigo = '700582.90';

-- [900282.36] Colorlac Negro Mate Brz 3.6l
UPDATE productos SET "precioCompra" = 125.05, "actualizadoEn" = NOW() WHERE codigo = '900282.36';

-- [700282.90] Colorlac Negro Mate Brz 900ml
UPDATE productos SET "precioCompra" = 33.96, "actualizadoEn" = NOW() WHERE codigo = '700282.90';

-- [304782.90] Colorlac Rojo Flash II VW 04 Brz 900ml
UPDATE productos SET "precioCompra" = 47.42, "actualizadoEn" = NOW() WHERE codigo = '304782.90';

-- [304382.90] Colorlac Rojo Munique Ford 92 Brz 900ml
UPDATE productos SET "precioCompra" = 49.91, "actualizadoEn" = NOW() WHERE codigo = '304382.90';

-- [304282.90] Colorlac Rojo Tornado VW Brz 900ml
UPDATE productos SET "precioCompra" = 49.91, "actualizadoEn" = NOW() WHERE codigo = '304282.90';

-- [304082.90] Colorlac Rojo Vino GM 75 Brz 900ml
UPDATE productos SET "precioCompra" = 49.91, "actualizadoEn" = NOW() WHERE codigo = '304082.90';

-- [311782.36] Colorlac Rojo Vivo Brz 3.6l
UPDATE productos SET "precioCompra" = 165.68, "actualizadoEn" = NOW() WHERE codigo = '311782.36';

-- [311782.90] Colorlac Rojo Vivo Brz 900ml
UPDATE productos SET "precioCompra" = 44.73, "actualizadoEn" = NOW() WHERE codigo = '311782.90';

-- [508582.90] Colorlac Verde Amazonas Brz 900ml
UPDATE productos SET "precioCompra" = 23.27, "actualizadoEn" = NOW() WHERE codigo = '508582.90';

-- [202781.36] Colorlux  Amarillo Cat . 77 Brz 3.6l
UPDATE productos SET "precioCompra" = 73.9, "actualizadoEn" = NOW() WHERE codigo = '202781.36';

-- [800181.90] Colorlux Aluminio p/ Ruedas Brz 900ml
UPDATE productos SET "precioCompra" = 23.01, "actualizadoEn" = NOW() WHERE codigo = '800181.90';

-- [200181.36] Colorlux Amarillo Cat.80/81 Brz 3.6l
UPDATE productos SET "precioCompra" = 86.28, "actualizadoEn" = NOW() WHERE codigo = '200181.36';

-- [202781.90] Colorlux Amarillo Cat. 77 Brz 900ml
UPDATE productos SET "precioCompra" = 19.6, "actualizadoEn" = NOW() WHERE codigo = '202781.90';

-- [200181.90] Colorlux Amarillo Cat. 80/81 Brz 900ml
UPDATE productos SET "precioCompra" = 19.05, "actualizadoEn" = NOW() WHERE codigo = '200181.90';

-- [111381.90] Colorlux Blanco Toyota 040 Brz 900ml
UPDATE productos SET "precioCompra" = 35.49, "actualizadoEn" = NOW() WHERE codigo = '111381.90';

-- [111481.90] Colorlux Blanco Toyota 041 Brz 900ml
UPDATE productos SET "precioCompra" = 19.05, "actualizadoEn" = NOW() WHERE codigo = '111481.90';

-- [701181.36] Colorlux Gris chasis Scania 98 Brz 3.6l
UPDATE productos SET "precioCompra" = 117.84, "actualizadoEn" = NOW() WHERE codigo = '701181.36';

-- [701181.90] Colorlux Gris chasis Scania 98 Brz 900ml
UPDATE productos SET "precioCompra" = 19.6, "actualizadoEn" = NOW() WHERE codigo = '701181.90';

-- [700581.90] Colorlux Negro Cadilac Brz 900ml
UPDATE productos SET "precioCompra" = 33.72, "actualizadoEn" = NOW() WHERE codigo = '700581.90';

-- [700281.90] Colorlux Negro Mate Brz  900ml
UPDATE productos SET "precioCompra" = 19.6, "actualizadoEn" = NOW() WHERE codigo = '700281.90';

-- [304381.90] Colorlux Rojo Flash II VW 04 Brz 900ml
UPDATE productos SET "precioCompra" = 20.98, "actualizadoEn" = NOW() WHERE codigo = '304381.90';

-- [320681.36] Colorlux Rojo vivo Brz 3.6l
UPDATE productos SET "precioCompra" = 130.93, "actualizadoEn" = NOW() WHERE codigo = '320681.36';

-- [320681.90] Colorlux Rojo vivo Brz 900ml
UPDATE productos SET "precioCompra" = 19.77, "actualizadoEn" = NOW() WHERE codigo = '320681.90';

-- [204133.27] Colorsteel Epoxi Amarillo  8/12
UPDATE productos SET "precioCompra" = 121.34, "actualizadoEn" = NOW() WHERE codigo = '204133.27';

-- [101133.27] Colorsteel Epóxi Blanco R 9003
UPDATE productos SET "precioCompra" = 121.34, "actualizadoEn" = NOW() WHERE codigo = '101133.27';

-- [502133.27] Colorsteel Epoxi Verde 6/6
UPDATE productos SET "precioCompra" = 121.34, "actualizadoEn" = NOW() WHERE codigo = '502133.27';

-- [812187C.36] Concentrado 577 Aluminio Medio Brillante Brz 3.6l
UPDATE productos SET "precioCompra" = 278.32, "actualizadoEn" = NOW() WHERE codigo = '812187C.36';

-- [812287C.36] Concentrado 673 Aluminio Medio Claro Brz 3.6l
UPDATE productos SET "precioCompra" = 214.94, "actualizadoEn" = NOW() WHERE codigo = '812287C.36';

-- [812387C.36] Concentrado 972 Aluminio Fino Brz 3.6l
UPDATE productos SET "precioCompra" = 233.12, "actualizadoEn" = NOW() WHERE codigo = '812387C.36';

-- [812387C.90] Concentrado 972 Aluminio Fino Brz 900ml
UPDATE productos SET "precioCompra" = 38.47, "actualizadoEn" = NOW() WHERE codigo = '812387C.90';

-- [811987C.36] Concentrado 973 Aluminio Brillante Brz 3.6l
UPDATE productos SET "precioCompra" = 292.72, "actualizadoEn" = NOW() WHERE codigo = '811987C.36';

-- [700785.90] Emborrachamiento Negro Brz 900ml
UPDATE productos SET "precioCompra" = 19.67, "actualizadoEn" = NOW() WHERE codigo = '700785.90';

-- [004483.22] Endurecedor p/ Quick Primer  4:1 Brz 225ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '004483.22';

-- [004483.15] Endurecedor p/Quick Primer 5:1 Brz 150ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '004483.15';

-- [002733.90] Endurecedor Para Epóx
UPDATE productos SET "precioCompra" = 45.9, "actualizadoEn" = NOW() WHERE codigo = '002733.90';

-- [400872.90] Esmalte Sintético Alkylux Azul Francia Brz 900ml
UPDATE productos SET "precioCompra" = 9.09, "actualizadoEn" = NOW() WHERE codigo = '400872.90';

-- [900172.90] Esmalte Sintético Alkylux Preto Cadilac Brz 900ml
UPDATE productos SET "precioCompra" = 9.09, "actualizadoEn" = NOW() WHERE codigo = '900172.90';

-- [500472.90] Esmalte Sintético Alkylux Verde Hoja Brz 900ml
UPDATE productos SET "precioCompra" = 9.09, "actualizadoEn" = NOW() WHERE codigo = '500472.90';

-- [100179.40] Kit Vedador Capó blanco Brz 400g
UPDATE productos SET "precioCompra" = 23.65, "actualizadoEn" = NOW() WHERE codigo = '100179.40';

-- [000482l.36] Laca nitro Clear Brz 3.6l
UPDATE productos SET "precioCompra" = 91.31, "actualizadoEn" = NOW() WHERE codigo = '000482l.36';

-- [000482L.18] Laca nitro Clear Brz 18l
UPDATE productos SET "precioCompra" = 387.56, "actualizadoEn" = NOW() WHERE codigo = '000482L.18';

-- [9385.50] Líquido de enmascarar Brz 5Lts
UPDATE productos SET "precioCompra" = 39.22, "actualizadoEn" = NOW() WHERE codigo = '9385.50';

-- [302189L] Masa Rapida (Rojo Oxido) Brz Muestra
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '302189L';

-- [700689.90] Masa Rapida Beige Brz 900ml
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = '700689.90';

-- [209585.90] Masa Rápida Beige Brz 900ml
UPDATE productos SET "precioCompra" = 36.97, "actualizadoEn" = NOW() WHERE codigo = '209585.90';

-- [700685.90] Masa Rápida Gris Brz 900ml
UPDATE productos SET "precioCompra" = 35.83, "actualizadoEn" = NOW() WHERE codigo = '700685.90';

-- [208685.18] Masilla p/Pequeños Correcciones Brz 180g
UPDATE productos SET "precioCompra" = 27.81, "actualizadoEn" = NOW() WHERE codigo = '208685.18';

-- [BRZ-MPROM G] Material Promocional - Gorras
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'BRZ-MPROM G';

-- [700285.60] Negro Mate Vinílico Brz 600ml
UPDATE productos SET "precioCompra" = 38.05, "actualizadoEn" = NOW() WHERE codigo = '700285.60';

-- [000279.01] Paño anti Polvo Brz
UPDATE productos SET "precioCompra" = 20.05, "actualizadoEn" = NOW() WHERE codigo = '000279.01';

-- [001085.90] Pasta Mateante Brz 900ml
UPDATE productos SET "precioCompra" = 53.04, "actualizadoEn" = NOW() WHERE codigo = '001085.90';

-- [701122] Película Protectiva
UPDATE productos SET "precioCompra" = 17.81, "actualizadoEn" = NOW() WHERE codigo = '701122';

-- [801322] Plata Espejo
UPDATE productos SET "precioCompra" = 70.74, "actualizadoEn" = NOW() WHERE codigo = '801322';

-- [208083.80] Primer  PU Beige  8:1 Brz 800ml
UPDATE productos SET "precioCompra" = 22.42, "actualizadoEn" = NOW() WHERE codigo = '208083.80';

-- [706083.80] Primer PU Gris HS super  8:1 Brz 800ml
UPDATE productos SET "precioCompra" = 25.29, "actualizadoEn" = NOW() WHERE codigo = '706083.80';

-- [719083.75] Primer PU HS Gris 5.1.1 Brz 750ml
UPDATE productos SET "precioCompra" = 40.98, "actualizadoEn" = NOW() WHERE codigo = '719083.75';

-- [100385.90] Primer Univeral Blanco Brz 900ml
UPDATE productos SET "precioCompra" = 39.73, "actualizadoEn" = NOW() WHERE codigo = '100385.90';

-- [702285E.18] Primer Universal Gris Brz 18l
UPDATE productos SET "precioCompra" = 21.22, "actualizadoEn" = NOW() WHERE codigo = '702285E.18';

-- [700185.90] Primer Universal Gris Brz 900ml
UPDATE productos SET "precioCompra" = 32.78, "actualizadoEn" = NOW() WHERE codigo = '700185.90';

-- [700185.36] Primer Universal Gris Brz  3.6l
UPDATE productos SET "precioCompra" = 103.98, "actualizadoEn" = NOW() WHERE codigo = '700185.36';

-- [700589P.36] PU 8032 Negro Brz 3.6l
UPDATE productos SET "precioCompra" = 175.05, "actualizadoEn" = NOW() WHERE codigo = '700589P.36';

-- [201289P.36] PU 8034 Amarillo Brz 3.6l
UPDATE productos SET "precioCompra" = 311.45, "actualizadoEn" = NOW() WHERE codigo = '201289P.36';

-- [201289P.90] PU 8034 Amarillo Brz 900ml
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = '201289P.90';

-- [200889P.90] PU 8036 Amarillo Óxido Brz 900ml
UPDATE productos SET "precioCompra" = 63.7, "actualizadoEn" = NOW() WHERE codigo = '200889P.90';

-- [201189P.90] PU 8037 Amarillo Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 85.82, "actualizadoEn" = NOW() WHERE codigo = '201189P.90';

-- [401189P.36] PU 8038 Azul Verdoso Brz 3.6l
UPDATE productos SET "precioCompra" = 269.9, "actualizadoEn" = NOW() WHERE codigo = '401189P.36';

-- [400889P.90] PU 8039 Azul Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 85.16, "actualizadoEn" = NOW() WHERE codigo = '400889P.90';

-- [301189P.90] PU 8130 Rosa Brz 900ml
UPDATE productos SET "precioCompra" = 83.03, "actualizadoEn" = NOW() WHERE codigo = '301189P.90';

-- [201089P.36] PU 8132 Amarillo Verdoso Brz 3.6l
UPDATE productos SET "precioCompra" = 326.67, "actualizadoEn" = NOW() WHERE codigo = '201089P.36';

-- [201089P.90] PU 8132 Amarillo Verdoso Brz 900ml
UPDATE productos SET "precioCompra" = 85.01, "actualizadoEn" = NOW() WHERE codigo = '201089P.90';

-- [700689P.36] PU 8134 Negro Azulado Brz 3.6l
UPDATE productos SET "precioCompra" = 195.63, "actualizadoEn" = NOW() WHERE codigo = '700689P.36';

-- [500389P.90] PU 8136 Verde Amarillento Brz 900ml
UPDATE productos SET "precioCompra" = 51.64, "actualizadoEn" = NOW() WHERE codigo = '500389P.90';

-- [301289P.90] PU 8137 Rojo Vivo Brz 900ml
UPDATE productos SET "precioCompra" = 98.2, "actualizadoEn" = NOW() WHERE codigo = '301289P.90';

-- [200989P.36] PU 8138 Naranja Brz 3.6l
UPDATE productos SET "precioCompra" = 397.46, "actualizadoEn" = NOW() WHERE codigo = '200989P.36';

-- [200989P.90] PU 8138 Naranja Brz 900ml
UPDATE productos SET "precioCompra" = 79.81, "actualizadoEn" = NOW() WHERE codigo = '200989P.90';

-- [301089P.36] PU 8230 Rojo Claro Brz 3.6l
UPDATE productos SET "precioCompra" = 142.74, "actualizadoEn" = NOW() WHERE codigo = '301089P.36';

-- [301089P.90] PU 8230 Rojo Claro Brz 900ml
UPDATE productos SET "precioCompra" = 50.27, "actualizadoEn" = NOW() WHERE codigo = '301089P.90';

-- [301389P.90] PU 8232 Rojo Intenso Brz 900ml
UPDATE productos SET "precioCompra" = 93.29, "actualizadoEn" = NOW() WHERE codigo = '301389P.90';

-- [301489P.90] PU 8234 Rojo Óxido Brz 900ml
UPDATE productos SET "precioCompra" = 51.07, "actualizadoEn" = NOW() WHERE codigo = '301489P.90';

-- [400989P.90] PU 8236 Violeta Azulado Brz 900ml
UPDATE productos SET "precioCompra" = 50.11, "actualizadoEn" = NOW() WHERE codigo = '400989P.90';

-- [401089P.90] PU 8237 Violeta Rojizo Brz 900ml
UPDATE productos SET "precioCompra" = 85.59, "actualizadoEn" = NOW() WHERE codigo = '401089P.90';

-- [300989P.90] PU 8239 Rojo Brz 900ml
UPDATE productos SET "precioCompra" = 125.24, "actualizadoEn" = NOW() WHERE codigo = '300989P.90';

-- [100489P.36] PU 8531 Blanco Brz 3.6l
UPDATE productos SET "precioCompra" = 274.92, "actualizadoEn" = NOW() WHERE codigo = '100489P.36';

-- [716883.90] Quick Primer  PU  4:1:15% Brz 900ml
UPDATE productos SET "precioCompra" = 79.49, "actualizadoEn" = NOW() WHERE codigo = '716883.90';

-- [716983.75] Quick Primer PU Cinza 5:1 Brz 750ml
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = '716983.75';

-- [000285.90] Removedor Pastoso E Brz 900ml
UPDATE productos SET "precioCompra" = 43.44, "actualizadoEn" = NOW() WHERE codigo = '000285.90';

-- [000179] Reparador de  Piezas Plásticas Brz
UPDATE productos SET "precioCompra" = 49.27, "actualizadoEn" = NOW() WHERE codigo = '000179';

-- [003485.95] Sellador p/ Plásticos Brz 450ml
UPDATE productos SET "precioCompra" = 19.44, "actualizadoEn" = NOW() WHERE codigo = '003485.95';

-- [003485.90] Sellador p/ Plásticos Brz 900ml
UPDATE productos SET "precioCompra" = 35.59, "actualizadoEn" = NOW() WHERE codigo = '003485.90';

-- [000581S.45] Solución Secante p/Esm. Sintético Brz 450ml
UPDATE productos SET "precioCompra" = 45.28, "actualizadoEn" = NOW() WHERE codigo = '000581S.45';

-- [000581S.90] Solución Secante p/Esm. Sintético Brz 900ml
UPDATE productos SET "precioCompra" = 66.62, "actualizadoEn" = NOW() WHERE codigo = '000581S.90';

-- [200185.60] Wash Primer Amarillo Brz 600ml
UPDATE productos SET "precioCompra" = 39.58, "actualizadoEn" = NOW() WHERE codigo = '200185.60';

-- [AA-78072757464] Cinta Masking 980 DA 12mmX40m
UPDATE productos SET "precioCompra" = 2.46, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757464';

-- [AA-69957308184] Cinta Masking 980 DA 18mmX40m
UPDATE productos SET "precioCompra" = 3.46, "actualizadoEn" = NOW() WHERE codigo = 'AA-69957308184';

-- [AA-66261170222] Cinta Masking 980 DA 24mmX40m
UPDATE productos SET "precioCompra" = 4.55, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170222';

-- [AA-66261170223] Cinta Masking 980 DA 36mmX40m
UPDATE productos SET "precioCompra" = 6.64, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170223';

-- [AA-66261170224] Cinta Masking 980 DA 48mmX40m
UPDATE productos SET "precioCompra" = 8.64, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170224';

-- [AA-78072757453] Cinta Masking 995 DA 12mmx40m
UPDATE productos SET "precioCompra" = 3.27, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757453';

-- [AA-66261170220] Cinta Masking 995 DA 18mmX40m
UPDATE productos SET "precioCompra" = 4.55, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170220';

-- [AA-69957345747] Cinta Masking 995 DA 24mmX40m
UPDATE productos SET "precioCompra" = 5.91, "actualizadoEn" = NOW() WHERE codigo = 'AA-69957345747';

-- [AA-66623326043] Disco Flap Ultra Zir 115X22 DA P40
UPDATE productos SET "precioCompra" = 4.64, "actualizadoEn" = NOW() WHERE codigo = 'AA-66623326043';

-- [AA-66623326045] Disco Flap Ultra Zir 115X22 DA P60
UPDATE productos SET "precioCompra" = 4.64, "actualizadoEn" = NOW() WHERE codigo = 'AA-66623326045';

-- [AA-66623326049] Disco Flap Ultra Zir 115X22 DA P80
UPDATE productos SET "precioCompra" = 4.64, "actualizadoEn" = NOW() WHERE codigo = 'AA-66623326049';

-- [AA-66623326040] Disco Flap Ultra Zir 115x22 DA P120
UPDATE productos SET "precioCompra" = 4.64, "actualizadoEn" = NOW() WHERE codigo = 'AA-66623326040';

-- [AA-66261170711] Lija al  Agua DA Grano 400
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170711';

-- [AA-66261170701] Lija al Agua DA Grano 80
UPDATE productos SET "precioCompra" = 1.46, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170701';

-- [AA-66261170702] Lija al Agua DA Grano 100
UPDATE productos SET "precioCompra" = 1.27, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170702';

-- [AA-66261170703] Lija al Agua DA Grano 120
UPDATE productos SET "precioCompra" = 1.18, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170703';

-- [AA-66261170704] Lija al Agua DA Grano 150
UPDATE productos SET "precioCompra" = 1.18, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170704';

-- [AA-66261170705] Lija al Agua DA Grano 180
UPDATE productos SET "precioCompra" = 1.09, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170705';

-- [AA-66261170706] Lija al Agua DA Grano 220
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170706';

-- [AA-66261170707] Lija al Agua DA Grano 240
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170707';

-- [AA-66261170708] Lija al Agua DA Grano 280
UPDATE productos SET "precioCompra" = 0.91, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170708';

-- [AA-66261170709] Lija al Agua DA Grano 320
UPDATE productos SET "precioCompra" = 0.91, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170709';

-- [AA-66261170710] Lija al Agua DA Grano 360
UPDATE productos SET "precioCompra" = 0.91, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170710';

-- [AA-66261170712] Lija al Agua DA Grano 500
UPDATE productos SET "precioCompra" = 1.36, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170712';

-- [AA-6626170713] Lija al Agua DA Grano 600
UPDATE productos SET "precioCompra" = 1.46, "actualizadoEn" = NOW() WHERE codigo = 'AA-6626170713';

-- [AA-66261170713] Lija al Agua DA Grano 600
UPDATE productos SET "precioCompra" = 1.46, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261170713';

-- [AA-66261171567] Lija de fierro DA Grano 36
UPDATE productos SET "precioCompra" = 2.64, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261171567';

-- [AA-66261171568] Lija de Fierro DA Grano 40
UPDATE productos SET "precioCompra" = 2.1, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261171568';

-- [AA-66261171569] Lija de Fierro DA Grano 50
UPDATE productos SET "precioCompra" = 2.18, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261171569';

-- [AA-66261171570] Lija de Fierro DA Grano 60
UPDATE productos SET "precioCompra" = 2.09, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261171570';

-- [AA-66261171571] Lija de Fierro DA Grano 80
UPDATE productos SET "precioCompra" = 2.09, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261171571';

-- [AA-66261171572] Lija de Fierro DA Grano 100
UPDATE productos SET "precioCompra" = 1.91, "actualizadoEn" = NOW() WHERE codigo = 'AA-66261171572';

-- [AA-78072757360] Lija en Rollo 15cm*45m DA Grano 36
UPDATE productos SET "precioCompra" = 188.64, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757360';

-- [AA-78072757361] Lija en Rollo 15cm*45m DA Grano 40
UPDATE productos SET "precioCompra" = 141.16, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757361';

-- [AA-78072757363] Lija en Rollo 15cm*45m DA Grano 60
UPDATE productos SET "precioCompra" = 141.16, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757363';

-- [AA-78072757364] Lija en Rollo 15cm*45m DA Grano 80
UPDATE productos SET "precioCompra" = 134.62, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757364';

-- [AA-78072757366] Lija en Rollo 15cm*45m DA Grano 120
UPDATE productos SET "precioCompra" = 100.69, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757366';

-- [AA-78072757362] Lija en Rollo 15cmx45m DA Grano 50
UPDATE productos SET "precioCompra" = 141.16, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757362';

-- [AA-78072757365] Lija en Rollo 15cmx45m DA Grano 100
UPDATE productos SET "precioCompra" = 110.69, "actualizadoEn" = NOW() WHERE codigo = 'AA-78072757365';

-- [HW-1K-4001] 1K Aluminio Diamante HW 1L
UPDATE productos SET "precioCompra" = 56.62, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4001';

-- [HW-1K-4002] 1K Aluminio Diamante S. Claro HW 4L
UPDATE productos SET "precioCompra" = 225.03, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4002';

-- [HW-1K-4005] 1K Aluminio Extra Fino Claro HW 1L
UPDATE productos SET "precioCompra" = 66, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4005';

-- [HW-1K-4008] 1K Aluminio Fino Brillante HW 4L
UPDATE productos SET "precioCompra" = 157.28, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4008';

-- [HW-1K-4007] 1K Aluminio Fino Claro HW 4L
UPDATE productos SET "precioCompra" = 149.12, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4007';

-- [HW-1K-4006] 1K Aluminio Fino HW 4L
UPDATE productos SET "precioCompra" = 149.73, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4006';

-- [HW-1K-4014] 1K Aluminio Grueso Brillante HW 1L
UPDATE productos SET "precioCompra" = 42.15, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4014';

-- [HW-1K-4013] 1K Aluminio Grueso HW 4L
UPDATE productos SET "precioCompra" = 154.12, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4013';

-- [HW-1K-4010] 1K Aluminio Medio Brillante HW 4L
UPDATE productos SET "precioCompra" = 150.95, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4010';

-- [HW-1K-4004] 1K Aluminio Medio Fino Claro HW 4L
UPDATE productos SET "precioCompra" = 150.95, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4004';

-- [HW-1K-4011] 1K Aluminio Medio Fino HW 4L
UPDATE productos SET "precioCompra" = 244.15, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4011';

-- [HW-1K-4012] 1K Aluminio Medio Grueso HW 4L
UPDATE productos SET "precioCompra" = 232.57, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4012';

-- [HW-1K-4009] 1K Aluminio Medio HW 1L
UPDATE productos SET "precioCompra" = 62.88, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4009';

-- [HW-1K-4003] 1K Aluminio S. Medio Brillante HW 4L
UPDATE productos SET "precioCompra" = 237.35, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-4003';

-- [HW-1K-3022] 1K Amarillo Limon HW 1L
UPDATE productos SET "precioCompra" = 61.52, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3022';

-- [HW-1K-3021] 1K Amarillo Medio HW 1L
UPDATE productos SET "precioCompra" = 85.31, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3021';

-- [HW-1K-3024] 1K Amarillo Oro HW 1L
UPDATE productos SET "precioCompra" = 71.7, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3024';

-- [HW-1K-3026] 1K Amarillo Oxido HW 1L
UPDATE productos SET "precioCompra" = 50.68, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3026';

-- [HW-1K-3023] 1K Amarillo Transparente HW 1L
UPDATE productos SET "precioCompra" = 46.66, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3023';

-- [HW-1K-3025] 1K Amarillo Transparente HW 1L
UPDATE productos SET "precioCompra" = 47.51, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3025';

-- [HW-1K-3032] 1K Azul Brillante HW 1L
UPDATE productos SET "precioCompra" = 113.07, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3032';

-- [HW-1K-3030] 1K Azul HW 4L
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3030';

-- [HW-1K-3034] 1K Azul Laguna HW 1L
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3034';

-- [HW-1K-3030LT] 1K Azul Limpio HW 1L
UPDATE productos SET "precioCompra" = 44.1, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3030LT';

-- [HW-1K-3033] 1K Azul Rojiso HW 1L
UPDATE productos SET "precioCompra" = 65.79, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3033';

-- [HW-1K-3036] 1K Azul Ultramarino HW 1L
UPDATE productos SET "precioCompra" = 94.31, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3036';

-- [HW-1K-3031] 1K Azul Verdoso HW 4L
UPDATE productos SET "precioCompra" = 160.45, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3031';

-- [HW-1K-3034GLN] 1K Azul Verdoso HW 4L
UPDATE productos SET "precioCompra" = 271.2, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3034GLN';

-- [HW-1K-3001] 1K Blanco HW 4L
UPDATE productos SET "precioCompra" = 159.84, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3001';

-- [HW-1K-3003] 1K Blanco Titanio HW 1L
UPDATE productos SET "precioCompra" = 64.08, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3003';

-- [HW-1K-3007] 1K Extra Negro HW 4L
UPDATE productos SET "precioCompra" = 188.96, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3007';

-- [HW-1K-3014] 1K Marron Rojiso HW 1L
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3014';

-- [HW-1K-3035LT] 1K Marron Rojiso HW 1L
UPDATE productos SET "precioCompra" = 197.24, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3035LT';

-- [HW-1K-3035] 1K Marron Rojiso HW 4L
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3035';

-- [HW-1K-3014GLN] 1K Marron Rojiso HW 4L
UPDATE productos SET "precioCompra" = 283.87, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3014GLN';

-- [HW-1K-3010] 1K Marrón Transparente HW 1L
UPDATE productos SET "precioCompra" = 71.7, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3010';

-- [HW-1K-3019] 1K Naranja HW 1L
UPDATE productos SET "precioCompra" = 66.89, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3019';

-- [HW-1K-3008] 1K Negro Azul Oscuro HW 1L
UPDATE productos SET "precioCompra" = 49.95, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3008';

-- [HW-1K-3005] 1K Negro Azulado HW 4L
UPDATE productos SET "precioCompra" = 285.15, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3005';

-- [HW-1K-3004] 1K Negro HW 4L
UPDATE productos SET "precioCompra" = 225.03, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3004';

-- [HW-1K-3006] 1K Negro Plano HW 4L
UPDATE productos SET "precioCompra" = 177.51, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3006';

-- [HW-1K-5016] 1K Perlado Azul Fino HW 1L
UPDATE productos SET "precioCompra" = 42.52, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5016';

-- [HW-1K-5015] 1K Perlado Azul HW 1L
UPDATE productos SET "precioCompra" = 41.67, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5015';

-- [HW-1K-5001] 1K Perlado Blanco Fino HW 1L
UPDATE productos SET "precioCompra" = 42.15, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5001';

-- [HW-1K-5004] 1K Perlado Blanco Grueso HW 1L
UPDATE productos SET "precioCompra" = 42.52, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5004';

-- [HW-1K-5042] 1K Perlado Blanco HW 1L
UPDATE productos SET "precioCompra" = 42.15, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5042';

-- [HW-1K-5019] 1K Perlado Marron HW 1L
UPDATE productos SET "precioCompra" = 41.67, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5019';

-- [HW-1K-5012] 1K Perlado Oro HW 1L
UPDATE productos SET "precioCompra" = 41.67, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5012';

-- [HW-1K-5044] 1K Perlado Rojo Fino HW 1L
UPDATE productos SET "precioCompra" = 41.67, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5044';

-- [HW-1K-5005] 1k Perlado Rojo HW 1L
UPDATE productos SET "precioCompra" = 41.67, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5005';

-- [HW-1K-5013] 1K Perlado Verde HW 1L
UPDATE productos SET "precioCompra" = 41.67, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5013';

-- [HW-1K-5018] 1K Perlado Violeta HW 1L
UPDATE productos SET "precioCompra" = 42.52, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-5018';

-- [HW-F-707] 1K Resina (Lechoso p/metalizados)HW 4L
UPDATE productos SET "precioCompra" = 147.78, "actualizadoEn" = NOW() WHERE codigo = 'HW-F-707';

-- [HW-F-708] 1K Resina (Transparente p/lisos y tripacas) HW 4L
UPDATE productos SET "precioCompra" = 131.94, "actualizadoEn" = NOW() WHERE codigo = 'HW-F-708';

-- [HW-1K-3020] 1K Rojo Oxido HW 1L
UPDATE productos SET "precioCompra" = 77.95, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3020';

-- [HW-1K-3015] 1K Rojo Transoxido HW 1L
UPDATE productos SET "precioCompra" = 45.81, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3015';

-- [HW-1K-3018] 1K Rojo Transparente Amarillo HW 1L
UPDATE productos SET "precioCompra" = 53.36, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3018';

-- [HW-1K-3017] 1K Rojo Transparente Violeta HW 1L
UPDATE productos SET "precioCompra" = 63.23, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3017';

-- [HW-1K-3016] 1K Rojo Vivo HW 4L
UPDATE productos SET "precioCompra" = 182.62, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3016';

-- [HW-1K-3013] 1K Rosa HW 1L
UPDATE productos SET "precioCompra" = 56.65, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3013';

-- [HW-1K-3002] 1K Super Blanco HW 4L
UPDATE productos SET "precioCompra" = 253.53, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3002';

-- [HW-1K-3009] 1K Super Negro HW 1L
UPDATE productos SET "precioCompra" = 71.64, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3009';

-- [HW-1K-3027] 1K Verde HW 4L
UPDATE productos SET "precioCompra" = 166.79, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3027';

-- [HW-1K-3029] 1K Verde Olivo HW 1L
UPDATE productos SET "precioCompra" = 89.17, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3029';

-- [HW-1K-3028] 1K Verde Oro HW 1L
UPDATE productos SET "precioCompra" = 54.09, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3028';

-- [HW-1K-3011] 1K Violeta Azulado HW 1L
UPDATE productos SET "precioCompra" = 51.66, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3011';

-- [HW-1K-3012] 1K Violeta Rojiso HW 1L
UPDATE productos SET "precioCompra" = 59.64, "actualizadoEn" = NOW() WHERE codigo = 'HW-1K-3012';

-- [HW-F-706] 2K Binder HW 4L
UPDATE productos SET "precioCompra" = 111.11, "actualizadoEn" = NOW() WHERE codigo = 'HW-F-706';

-- [HW-B-211] Barniz HW 1L
UPDATE productos SET "precioCompra" = 30.46, "actualizadoEn" = NOW() WHERE codigo = 'HW-B-211';

-- [HW-F-709] Blanqueador HW 1L
UPDATE productos SET "precioCompra" = 38.38, "actualizadoEn" = NOW() WHERE codigo = 'HW-F-709';

-- [HW-B-800] Catalizador HW 0.5 Ml
UPDATE productos SET "precioCompra" = 23.15, "actualizadoEn" = NOW() WHERE codigo = 'HW-B-800';

-- [HW-SPB] Masa rápida 1K Beige HW 1L
UPDATE productos SET "precioCompra" = 36.55, "actualizadoEn" = NOW() WHERE codigo = 'HW-SPB';

-- [HW-2K-2001] PU Blanco HW 4L
UPDATE productos SET "precioCompra" = 134.01, "actualizadoEn" = NOW() WHERE codigo = 'HW-2K-2001';

-- [IC-1K12] 1K12 Pol. Blanco IC 3.75l
UPDATE productos SET "precioCompra" = 211.13, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K12';

-- [IC-1K14] 1K14 Pol. Blanco Trasparente IC 1l
UPDATE productos SET "precioCompra" = 100.93, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K14';

-- [IC-1K21] 1K21 Pol. Extra Negro IC 3.75l
UPDATE productos SET "precioCompra" = 210.05, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K21';

-- [IC-1K22] 1K22 Pol. Negro Azulado IC 3.75l
UPDATE productos SET "precioCompra" = 210.05, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K22';

-- [IC-1K23] 1K23 Pol. Negro General  IC 3.75l
UPDATE productos SET "precioCompra" = 192.53, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K23';

-- [IC-1K24] 1K24 Pol. Negro Súper Profundo IC 1l
UPDATE productos SET "precioCompra" = 67.83, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K24';

-- [IC-1K30] 1K30 Pol. Rojo Extra Vivo IC 3.75l
UPDATE productos SET "precioCompra" = 210.05, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K30';

-- [IC-1K31] 1K31 Pol. Rojo Vivo IC 3.75l
UPDATE productos SET "precioCompra" = 210.05, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K31';

-- [IC-1K32] 1K32 Pol. Rojo Óxido IC 1l
UPDATE productos SET "precioCompra" = 54.94, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K32';

-- [IC-1K33] 1K33 Pol. Rojo Transóxido IC 1l
UPDATE productos SET "precioCompra" = 67.83, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K33';

-- [IC-1K34] 1K34 Pol. Rojo Violeta IC 1l
UPDATE productos SET "precioCompra" = 83.65, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K34';

-- [IC-1K35] 1K35 Pol. Rojo Durazno IC 1l
UPDATE productos SET "precioCompra" = 78.48, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K35';

-- [IC-1K36] 1K36 Pol. Rojo Marrón IC 3.75l
UPDATE productos SET "precioCompra" = 307.21, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K36';

-- [IC-1K37] 1K37 Pol. Rojo Trasparente IC 1l
UPDATE productos SET "precioCompra" = 78.86, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K37';

-- [IC-K38A] 1K38A Pol. Rojo Borgoña IC 1l
UPDATE productos SET "precioCompra" = 145.31, "actualizadoEn" = NOW() WHERE codigo = 'IC-K38A';

-- [IC-1K39] 1K39 Pol. Rojo Marrón Transparente IC 1l
UPDATE productos SET "precioCompra" = 145.31, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K39';

-- [IC-1K42] 1K42 Pol. Rojo Anaranjado Traslúcido IC 1l
UPDATE productos SET "precioCompra" = 84.9, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K42';

-- [IC-1K51] 1K51 Pol. Amarillo Limón  IC 1l
UPDATE productos SET "precioCompra" = 58.49, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K51';

-- [IC-1K52] 1K52 Pol. Verde Oro IC 1l
UPDATE productos SET "precioCompra" = 87.27, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K52';

-- [IC-1K53] 1K53 Pol. Amarillo Medio Transparente IC 1l
UPDATE productos SET "precioCompra" = 62.58, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K53';

-- [IC-1K54] 1K54 Pol. Amarillo Transóxido IC 1l
UPDATE productos SET "precioCompra" = 67.83, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K54';

-- [IC-1K55] 1K55 Pol. Amarillo Óxido IC 1l
UPDATE productos SET "precioCompra" = 54.94, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K55';

-- [IC-1K56] 1K56 Pol. Amarillo Medio Traslúcido IC 1l
UPDATE productos SET "precioCompra" = 67.83, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K56';

-- [IC-1K57-MUESTRA] 1K57-Amarillo Brillante IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K57-MUESTRA';

-- [IC-1K61] 1K61 Pol. Verde General IC 3.75l
UPDATE productos SET "precioCompra" = 179.65, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K61';

-- [IC-1K62] 1K62 Pol. Verde Amarillento  IC 1l
UPDATE productos SET "precioCompra" = 68.91, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K62';

-- [IC-1K63] 1K63 Pol. Verde Oliva IC 1l
UPDATE productos SET "precioCompra" = 142.44, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K63';

-- [IC-1K71] 1K71 Pol. Azul Toner IC 3.75l
UPDATE productos SET "precioCompra" = 179.65, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K71';

-- [IC-1K72] 1K72 Pol. Azul Transparente  IC 1l
UPDATE productos SET "precioCompra" = 49.69, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K72';

-- [IC-1K73] 1K73 Pol. Azul Rojizo  IC 1l
UPDATE productos SET "precioCompra" = 49.69, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K73';

-- [IC-1K74] 1K74 Pol. Azul Violetoso  IC 1l
UPDATE productos SET "precioCompra" = 79.33, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K74';

-- [IC-1K75] 1K75 Pol. Azul Verdoso  IC 3.75l
UPDATE productos SET "precioCompra" = 289.61, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K75';

-- [IC-1K76] 1K76 Pol. Azul Brillante IC 1l
UPDATE productos SET "precioCompra" = 110.27, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K76';

-- [IC-1K81] 1K81 Pol. Violeta  IC 1l
UPDATE productos SET "precioCompra" = 72.15, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K81';

-- [IC-1K100] 1K100 Pol. Aglutinante 1K(Transparente)  IC 3.75l
UPDATE productos SET "precioCompra" = 173.94, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K100';

-- [IC-1K160] 1K160 Aglutinante Balance 1K IC 3.75l
UPDATE productos SET "precioCompra" = 221.55, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K160';

-- [IC-1K190] 1K190  Pol. Controlador Flip 1K IC 1l
UPDATE productos SET "precioCompra" = 60.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K190';

-- [IC-1K411F] 1K411F Naranja Sangre IC 1l
UPDATE productos SET "precioCompra" = 90.21, "actualizadoEn" = NOW() WHERE codigo = 'IC-1K411F';

-- [IC-1KP11] 1KP11 Pol. Perlado Blanco Grueso IC 1l
UPDATE productos SET "precioCompra" = 58.72, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP11';

-- [IC-1KP12] 1KP12 Pol. Perlado Blanco IC 1l
UPDATE productos SET "precioCompra" = 58.72, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP12';

-- [IC-1KP13] 1KP13 Pol. Perlado Blanco Fino IC 1l
UPDATE productos SET "precioCompra" = 58.72, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP13';

-- [IC-1KP14] 1KP14 Pol. Blanco Transparente IC 1l
UPDATE productos SET "precioCompra" = 60.61, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP14';

-- [IC-1KP15] 1KP15 Perlado Blanco Extra Fino IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP15';

-- [IC-1KP15-MUESTRA] 1KP15-Perlado Blanco Extra Fino IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP15-MUESTRA';

-- [IC-1KP16-MUESTRA] 1KP16-Perla Blanca Super IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP16-MUESTRA';

-- [IC-1KP30] 1KP30 Pol. Perlado Rojo Violeta  IC 1l
UPDATE productos SET "precioCompra" = 59.5, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP30';

-- [IC-1KP31] 1KP31 Pol. Perlado Rojo IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP31';

-- [IC-1KP32] 1KP32 Pol. Perlado Rojo Fino IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP32';

-- [IC-1KP33] 1KP33 Pol. Perlado Cobre IC 1l
UPDATE productos SET "precioCompra" = 60.61, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP33';

-- [IC-1KP37] 1KP37 Perlado Rojo Vívido IC 1l
UPDATE productos SET "precioCompra" = 90.13, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP37';

-- [IC-1KP51] 1KP51 Pol. Perlado Amarillo IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP51';

-- [IC-1KP52] 1KP52 Pol. Perlado Oro IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP52';

-- [IC-1KP61] 1KP61 Pol. Perlado Verde IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP61';

-- [IC-1KP62] 1KP62 Pol. Perlado Verde Fino IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP62';

-- [IC-1KP70] 1KP70 Pol. Perlado Verde Azulado IC 1l
UPDATE productos SET "precioCompra" = 88.3, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP70';

-- [IC-1KP71] 1KP71 Pol. Perlado Azul IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP71';

-- [IC-1KP72] 1KP72 Pol. Perlado Azul Fino IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP72';

-- [IC-1KP81] 1KP81 Pol. Perlado Violeta IC 1l
UPDATE productos SET "precioCompra" = 61.81, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KP81';

-- [IC-1KSD707-MUESTRA] 1KPSD707-Aluminio Cromado IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KSD707-MUESTRA';

-- [IC-1KS11] 1KS11 Pol. Aluminio Luminoso Grueso IC 3.75l
UPDATE productos SET "precioCompra" = 197.09, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS11';

-- [IC-1KS18] 1KS18 Pol. Aluminio Grueso IC 3.75l
UPDATE productos SET "precioCompra" = 197.09, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS18';

-- [IC-1KS21] 1KS21 Pol. Aluminio Medio Grueso IC 3.75l
UPDATE productos SET "precioCompra" = 201.79, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS21';

-- [IC-1KS22] 1KS22 Pol. Aluminio Luminoso Medio IC 3.75l
UPDATE productos SET "precioCompra" = 222.71, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS22';

-- [IC-1KS22B] 1KS22B Pol. Aluminio Medio IC 1l
UPDATE productos SET "precioCompra" = 54.32, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS22B';

-- [IC-1KS23] 1KS23 Pol. Aluminio Medio Fino IC 1l
UPDATE productos SET "precioCompra" = 54.32, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS23';

-- [IC-1KS26] 1KS26 Pol. Aluminio Luminoso IC 3.75l
UPDATE productos SET "precioCompra" = 222.71, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS26';

-- [IC-1KS27-MUESTRA] 1KS27-Aluminio Blanco Fino Medio IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS27-MUESTRA';

-- [IC-1KS31] 1KS31 Pol. Aluminoso Luminoso Fino IC 3.75l
UPDATE productos SET "precioCompra" = 222.71, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS31';

-- [IC-1KS34] 1KS34 Pol. Aluminio Fino IC 3.75l
UPDATE productos SET "precioCompra" = 197.09, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS34';

-- [IC-1KS35] 1KS35 Aluminio Fino Claro IC 3.75l
UPDATE productos SET "precioCompra" = 222.71, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS35';

-- [IC-1KS36] 1KS36 Aluminio Luminoso Extra Fino IC 3.75l
UPDATE productos SET "precioCompra" = 222.71, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS36';

-- [IC-1KS822-MUESTRA] 1KS822-Super Brillante Mediunmalu IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS822-MUESTRA';

-- [IC-1KS910] 1KS910 Pol. Aluminio Medio Azul IC 1l
UPDATE productos SET "precioCompra" = 245.16, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS910';

-- [IC-1KS913R-MUESTRA] 1KS913R-Rojo Medio Alu IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS913R-MUESTRA';

-- [IC-1KS918] 1KS918 Pol. Aluminio Medio Cobre IC 1l
UPDATE productos SET "precioCompra" = 249.95, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS918';

-- [IC-1KS919] 1KS919 Pol. Aluminio Medio Rojo IC 1l
UPDATE productos SET "precioCompra" = 249.95, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KS919';

-- [IC-1KX1012] 1KX1012 Pol. Plata Cristal IC 1l
UPDATE productos SET "precioCompra" = 106.57, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KX1012';

-- [IC-1KX1030] 1KX1030 Pol. Rojo Radiante IC 1l
UPDATE productos SET "precioCompra" = 106.57, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KX1030';

-- [IC-1KX1033] 1KX1033 Pol. Perlado Cobre IC 1l
UPDATE productos SET "precioCompra" = 107.7, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KX1033';

-- [IC-1KX1050] 1KX1050 Pol. Oro de Sunbeam IC 1l
UPDATE productos SET "precioCompra" = 109.75, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KX1050';

-- [IC-1KX1060] 1KX1060 Pol. Verde Estelar IC 1l
UPDATE productos SET "precioCompra" = 109.75, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KX1060';

-- [IC-1KX1070] 1KX1070 Pol. Azul Galaxia IC 1l
UPDATE productos SET "precioCompra" = 109.75, "actualizadoEn" = NOW() WHERE codigo = 'IC-1KX1070';

-- [IC-2K11] 2K11 PU Blanco Puro IC 3.75l
UPDATE productos SET "precioCompra" = 203.57, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K11';

-- [IC-2K21L] 2K21 PU Extra Negro IC 1l
UPDATE productos SET "precioCompra" = 54.09, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K21L';

-- [IC-2K21G] 2K21 PU Extra Negro IC 3.75l
UPDATE productos SET "precioCompra" = 196.39, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K21G';

-- [IC-2K22] 2K22 PU Negro General IC 3.75l
UPDATE productos SET "precioCompra" = 182.12, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K22';

-- [IC-2K24] 2K24 PU Negro Profundo IC 1l
UPDATE productos SET "precioCompra" = 56.02, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K24';

-- [IC-2K30] 2K30 PU Rojo Brillante IC 3.75l
UPDATE productos SET "precioCompra" = 233.36, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K30';

-- [IC-2K31] 2K31 PU Rojo Vivo IC 3.75l
UPDATE productos SET "precioCompra" = 210.51, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K31';

-- [IC-2K32] 2K32 PU Rojo Óxido IC 1l
UPDATE productos SET "precioCompra" = 47.22, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K32';

-- [IC-2K34] 2K34 PU Violeta Rojizo IC 1l
UPDATE productos SET "precioCompra" = 62.58, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K34';

-- [IC-2K35] 2K35 PU Rosa  IC 1l
UPDATE productos SET "precioCompra" = 64.28, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K35';

-- [IC-2K36] 2K36 PU  Marron Rojizo IC 1l
UPDATE productos SET "precioCompra" = 84.8, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K36';

-- [IC-2K37] 2K37 PU Rojo Extra Vivo IC 3.75l
UPDATE productos SET "precioCompra" = 224.56, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K37';

-- [IC-2K41] 2K41 PU Rojo Anaranjado Brillante IC 1l
UPDATE productos SET "precioCompra" = 61.35, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K41';

-- [IC-2K42] 2K42 PU Rojo Anaranjado IC 3.75l
UPDATE productos SET "precioCompra" = 223.4, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K42';

-- [IC-2K51] 2K51 PU Amarillo Limón IC 3.75l
UPDATE productos SET "precioCompra" = 234.36, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K51';

-- [IC-2K52] 2K52 PU Amarillo Brillante 1l
UPDATE productos SET "precioCompra" = 109.53, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K52';

-- [IC-2K53] 2K53 PU Amarillo Medio IC  3.75l
UPDATE productos SET "precioCompra" = 232.66, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K53';

-- [IC-2K55] 2K55 PU Amarillo Óxido IC 3.75l
UPDATE productos SET "precioCompra" = 170.62, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K55';

-- [IC-2K61] 2K61 PU Verde IC 3.75l
UPDATE productos SET "precioCompra" = 182.12, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K61';

-- [IC-2K62] 2K62 PU Verde Amarillento IC 1l
UPDATE productos SET "precioCompra" = 63.22, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K62';

-- [IC-2K71] 2K71 PU Azul Toner IC 3.75l
UPDATE productos SET "precioCompra" = 182.12, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K71';

-- [IC-2K73] 2K73 PU Azul Transparente IC 1l
UPDATE productos SET "precioCompra" = 49.37, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K73';

-- [IC-2K81] 2K81 PU Violeta Transparente IC 1l
UPDATE productos SET "precioCompra" = 64.28, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K81';

-- [IC-2K200] 2K200 PU Transparente IC 3.75l
UPDATE productos SET "precioCompra" = 155.88, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K200';

-- [IC-2K290] 2K290 PU Resina Mate IC 1l
UPDATE productos SET "precioCompra" = 64.28, "actualizadoEn" = NOW() WHERE codigo = 'IC-2K290';

-- [2K-TOYOTA 040] 2K Blanco Toyota 040 IC 1l
UPDATE productos SET "precioCompra" = 45.91, "actualizadoEn" = NOW() WHERE codigo = '2K-TOYOTA 040';

-- [2K-TOYOTA 041] 2K Blanco Toyota 041 IC 1l
UPDATE productos SET "precioCompra" = 45.91, "actualizadoEn" = NOW() WHERE codigo = '2K-TOYOTA 041';

-- [2K-TOYOTA 058] 2K Blanco Toyota 058 IC 1l
UPDATE productos SET "precioCompra" = 45.91, "actualizadoEn" = NOW() WHERE codigo = '2K-TOYOTA 058';

-- [IC-208] 208 Barniz Súper Brilloso Kit 2:1 IC 1l
UPDATE productos SET "precioCompra" = 62.66, "actualizadoEn" = NOW() WHERE codigo = 'IC-208';

-- [IC-212] 212 Masilla Suave + Catalizador IC 1k
UPDATE productos SET "precioCompra" = 21.68, "actualizadoEn" = NOW() WHERE codigo = 'IC-212';

-- [IC-213-MUESTRA] 213 IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-213-MUESTRA';

-- [IC-408] 408 Rellenador (Masilla) Rojo IC 1k
UPDATE productos SET "precioCompra" = 30.94, "actualizadoEn" = NOW() WHERE codigo = 'IC-408';

-- [IC-588L] 588L Rellenador (Masilla) Amarillo Óxido IC 1k
UPDATE productos SET "precioCompra" = 29.79, "actualizadoEn" = NOW() WHERE codigo = 'IC-588L';

-- [IC-588M] 588M Rellenador (Masilla) Amarillo Óxido IC 200g (tubo)
UPDATE productos SET "precioCompra" = 9.12, "actualizadoEn" = NOW() WHERE codigo = 'IC-588M';

-- [IC-750] 750 Catalizador p/ Barniz 208 IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-750';

-- [IC-900] 900 Primer p/Plástico IC 1l
UPDATE productos SET "precioCompra" = 38.5, "actualizadoEn" = NOW() WHERE codigo = 'IC-900';

-- [IC-961] 961 Catalizador p/ Primer 981-991 IC 0.25l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-961';

-- [IC-972] 972 1K Imprimación Gris IC 0.8l
UPDATE productos SET "precioCompra" = 29.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-972';

-- [IC-981] 981 2K Primer Imprimación PU IC 1l
UPDATE productos SET "precioCompra" = 44.55, "actualizadoEn" = NOW() WHERE codigo = 'IC-981';

-- [IC-991] 991 2K Primer Imprimación Rápido PU IC 1l
UPDATE productos SET "precioCompra" = 51.17, "actualizadoEn" = NOW() WHERE codigo = 'IC-991';

-- [IC-1000] 1000 Masilla Poliéster + Catalizador IC 1k
UPDATE productos SET "precioCompra" = 12.94, "actualizadoEn" = NOW() WHERE codigo = 'IC-1000';

-- [BH-1012] 1012 Pol. Plata Cristal IC 1l
UPDATE productos SET "precioCompra" = 307.92, "actualizadoEn" = NOW() WHERE codigo = 'BH-1012';

-- [BH-1030] 1030 Pol. Rojo Radiante IC 1l
UPDATE productos SET "precioCompra" = 307.92, "actualizadoEn" = NOW() WHERE codigo = 'BH-1030';

-- [BH-1032] 1032 Rojo/Verde Cristal IC 1l
UPDATE productos SET "precioCompra" = 369.32, "actualizadoEn" = NOW() WHERE codigo = 'BH-1032';

-- [BH-1033] 1033 Pol. Perlado Cobre IC 1l
UPDATE productos SET "precioCompra" = 369.32, "actualizadoEn" = NOW() WHERE codigo = 'BH-1033';

-- [BH-1050] 1050 Pol. Oro de Sunbeam IC 1l
UPDATE productos SET "precioCompra" = 369.32, "actualizadoEn" = NOW() WHERE codigo = 'BH-1050';

-- [BH-1060] 1060 Pol. Verde Estelar IC 1l
UPDATE productos SET "precioCompra" = 369.32, "actualizadoEn" = NOW() WHERE codigo = 'BH-1060';

-- [BH-1063] 1063 Pol. Verde /Rojo Cristal IC 1l
UPDATE productos SET "precioCompra" = 369.32, "actualizadoEn" = NOW() WHERE codigo = 'BH-1063';

-- [BH-1070] 1070 Pol. Azul Galaxia IC 1l
UPDATE productos SET "precioCompra" = 369.32, "actualizadoEn" = NOW() WHERE codigo = 'BH-1070';

-- [IC-2010] 2010 Catalizador p/Barniz Mate 2020 IC 0.25l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-2010';

-- [IC-2020] 2020 Barniz Mate Kit 4:1 IC 1l
UPDATE productos SET "precioCompra" = 91.6, "actualizadoEn" = NOW() WHERE codigo = 'IC-2020';

-- [IC-9601] 9601 Catalizador Rápido p/Barniz 9901 IC 0.5l
UPDATE productos SET "precioCompra" = 36.11, "actualizadoEn" = NOW() WHERE codigo = 'IC-9601';

-- [IC-9603] 9603 Catalizador Rápido p/ Barniz 9903 IC 0.5l
UPDATE productos SET "precioCompra" = 38.53, "actualizadoEn" = NOW() WHERE codigo = 'IC-9603';

-- [IC-9606] 9606 Catalizador Rápido p/Barniz 9906 IC 0.5l
UPDATE productos SET "precioCompra" = 30.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-9606';

-- [IC-9688L] 9688L Catalizador Universal Rápido IC 1l
UPDATE productos SET "precioCompra" = 59.59, "actualizadoEn" = NOW() WHERE codigo = 'IC-9688L';

-- [IC-9688M] 9688M Catalizador Universal Rápido IC 0.5l
UPDATE productos SET "precioCompra" = 36.11, "actualizadoEn" = NOW() WHERE codigo = 'IC-9688M';

-- [IC-9688ML] 9688ML Catalizador Universal Rápido IC 0.25l
UPDATE productos SET "precioCompra" = 17.51, "actualizadoEn" = NOW() WHERE codigo = 'IC-9688ML';

-- [IC-9901] 9901 Barniz con Efecto Espejo IC 1l
UPDATE productos SET "precioCompra" = 42.36, "actualizadoEn" = NOW() WHERE codigo = 'IC-9901';

-- [IC-9903] 9903 Barniz Alto Sólido IC 1l
UPDATE productos SET "precioCompra" = 56.46, "actualizadoEn" = NOW() WHERE codigo = 'IC-9903';

-- [IC-9906] 9906 Barniz Súper Rápido IC 1l
UPDATE productos SET "precioCompra" = 57.8, "actualizadoEn" = NOW() WHERE codigo = 'IC-9906';

-- [IC-9906-MUESTRA] Claro Hiperrapido IC 1l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-9906-MUESTRA';

-- [IC-TD603-MUESTRA] Diluyente de Aluminio Cromado IC 1l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-TD603-MUESTRA';

-- [IC-DISCO-P40] Disco con Velcro 6" IC P40
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P40';

-- [IC-DISCO-P60] Disco con Velcro 6" IC P60
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P60';

-- [IC-DISCO-P80] Disco con Velcro 6" IC P80
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P80';

-- [IC-DISCO-P150] Disco con Velcro 6" IC P150
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P150';

-- [IC-DISCO-P220] Disco con Velcro 6" IC P220
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P220';

-- [IC-DISCO-P320] Disco con Velcro 6" IC P320
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P320';

-- [IC-DISCO-P400] Disco con Velcro 6" IC P400
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P400';

-- [IC-DISCO-P600] Disco con Velcro 6" IC P600
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P600';

-- [IC-DISCO-P1000] Disco con Velcro 6" IC P1000
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P1000';

-- [IC-DISCO-P1200] Disco con Velcro 6" IC P1200
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P1200';

-- [IC-DISCO-P1500] Disco con Velcro 6" IC P1500
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P1500';

-- [IC-DISCO-P2000] Disco con Velcro 6" IC P2000
UPDATE productos SET "precioCompra" = 1.1, "actualizadoEn" = NOW() WHERE codigo = 'IC-DISCO-P2000';

-- [IC-EP-INNO] Embudo de papel Filtro IC pieza
UPDATE productos SET "precioCompra" = 0.18, "actualizadoEn" = NOW() WHERE codigo = 'IC-EP-INNO';

-- [IC-9688-MUESTRA] Endurecedor Rapido 2:1 IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-9688-MUESTRA';

-- [IC-9609-MUESTRA] Endurecedor Rapido  r. IC 9906 Trans. IC 9609 025.l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-9609-MUESTRA';

-- [IC-9709-MUESTRA] Endurecedor STD f. IC 9906 Trans IC 9709 025.l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-9709-MUESTRA';

-- [IC-9788-MUESTRA] Endurecedor STD Univer. 2:1 IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-9788-MUESTRA';

-- [IC-LIJA-P60] Lija al Agua  Azul IC P60
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P60';

-- [IC-LIJA-P80] Lija al Agua  Azul IC P80
UPDATE productos SET "precioCompra" = 1.02, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P80';

-- [IC-LIJA-P120] Lija al Agua  Azul IC P120
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P120';

-- [IC-LIJA-P150] Lija al Agua  Azul IC P150
UPDATE productos SET "precioCompra" = 0.95, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P150';

-- [IC-LIJA-P180] Lija al Agua  Azul IC P180
UPDATE productos SET "precioCompra" = 0.95, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P180';

-- [IC-LIJA-P220] Lija al Agua  Azul IC P220
UPDATE productos SET "precioCompra" = 0.95, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P220';

-- [IC-LIJA-P240] Lija al Agua  Azul IC P240
UPDATE productos SET "precioCompra" = 0.99, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P240';

-- [IC-LIJA-P280] Lija al Agua  Azul IC P280
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P280';

-- [IC-LIJA-P360] Lija al Agua  Azul IC P360
UPDATE productos SET "precioCompra" = 0.95, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P360';

-- [IC-LIJA-P400] Lija al Agua  Azul IC P400
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P400';

-- [IC-LIJA-P600] Lija al Agua  Azul IC P600
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P600';

-- [IC-LIJA-P800] Lija al Agua  Azul IC P800
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P800';

-- [IC-LIJA-P1000] Lija al Agua  Azul IC P1000
UPDATE productos SET "precioCompra" = 0.95, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P1000';

-- [IC-LIJA-P1200] Lija al Agua  Azul IC P1200
UPDATE productos SET "precioCompra" = 1.08, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P1200';

-- [IC-LIJA-P1500] Lija al Agua  Azul IC P1500
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P1500';

-- [IC-LIJA-P2000] Lija al Agua  Azul IC P2000
UPDATE productos SET "precioCompra" = 1.08, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P2000';

-- [IC-LIJA-P100] Lija al Agua Azul IC P100
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P100';

-- [IC-LIJA-P320] Lija al Agua Azul IC P320
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P320';

-- [IC-LIJA-P500] Lija al Agua Azul IC P500
UPDATE productos SET "precioCompra" = 0.96, "actualizadoEn" = NOW() WHERE codigo = 'IC-LIJA-P500';

-- [IC-LINTERNA-MUESTRA] Linterna IC Material Promocional
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-LINTERNA-MUESTRA';

-- [IC-LW 300-MUESTRA] LW 300 IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-LW 300-MUESTRA';

-- [IC-MAQUINA] Maquina mezcladora IC 80 Tapas
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = 'IC-MAQUINA';

-- [IC-MPROM G] Material Promocional - Gorras
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-MPROM G';

-- [IC-MPROM USB] Material Promocional - USB
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-MPROM USB';

-- [IC-MF-MUESTRA] MF IC 0.5l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-MF-MUESTRA';

-- [IC-TAPAS] Tapas maquinas mezcladoras IC
UPDATE productos SET "precioCompra" = 11.35, "actualizadoEn" = NOW() WHERE codigo = 'IC-TAPAS';

-- [IC-208-20-MUESTRA] Transparente Rapido IC 1l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'IC-208-20-MUESTRA';

-- [MAX-810] Capa Limpio MAX 1l
UPDATE productos SET "precioCompra" = 35.89, "actualizadoEn" = NOW() WHERE codigo = 'MAX-810';

-- [MAX-7000] Capa Transparente Extra Rápido MAX 1l
UPDATE productos SET "precioCompra" = 42.07, "actualizadoEn" = NOW() WHERE codigo = 'MAX-7000';

-- [MAX-810A] Capa Transparente Rápido MAX 1l
UPDATE productos SET "precioCompra" = 37.14, "actualizadoEn" = NOW() WHERE codigo = 'MAX-810A';

-- [C-MAXM3] Catalogo Maxytone M3
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'C-MAXM3';

-- [M3-60] Controlador Flip 1k MAX 1l
UPDATE productos SET "precioCompra" = 55.33, "actualizadoEn" = NOW() WHERE codigo = 'M3-60';

-- [MAX-3600] Endurecedor Extra Rápido MAX 500ml
UPDATE productos SET "precioCompra" = 36.58, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3600';

-- [MAX-811L] Endurecedor Rápido MAX 1l
UPDATE productos SET "precioCompra" = 56.48, "actualizadoEn" = NOW() WHERE codigo = 'MAX-811L';

-- [MAX-811C] Endurecedor Rápido MAX 250ml
UPDATE productos SET "precioCompra" = 14.99, "actualizadoEn" = NOW() WHERE codigo = 'MAX-811C';

-- [MAX-811] Endurecedor Rápido MAX 500ml
UPDATE productos SET "precioCompra" = 29.91, "actualizadoEn" = NOW() WHERE codigo = 'MAX-811';

-- [M3-50] Filler MAX 1k
UPDATE productos SET "precioCompra" = 24.67, "actualizadoEn" = NOW() WHERE codigo = 'M3-50';

-- [MAX-MPROM C] Material Promocional - Camisa
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-MPROM C';

-- [MAX-MPROM CR] Material Promocional - Camisa cuello redondo
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-MPROM CR';

-- [MAX-MPROM G] Material Promocional - Gorras
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-MPROM G';

-- [MAX-MPROM LL] Material Promocional - LLaveros
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-MPROM LL';

-- [MAX-3P600] Perla Amarilla MAX-P600 1l
UPDATE productos SET "precioCompra" = 58.8, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P600';

-- [MAX-3PC30] Perla Azul Cristalino MAX-PC30 1l
UPDATE productos SET "precioCompra" = 103.67, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3PC30';

-- [MAX-3P301] Perla Azul Fina MAX-P301 1l
UPDATE productos SET "precioCompra" = 56.82, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P301';

-- [MAX-3P300] Perla Azul MAX-P300 1l
UPDATE productos SET "precioCompra" = 56.82, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P300';

-- [MAX-3PC10] Perla Blanco Cristalino MAX-PC10 1l
UPDATE productos SET "precioCompra" = 61.82, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3PC10';

-- [MAX-3P101] Perla Blanco Fino MAX-P101 1l
UPDATE productos SET "precioCompra" = 45.61, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P101';

-- [MAX-3P100] Perla Blanco MAX-P100 1l
UPDATE productos SET "precioCompra" = 45.61, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P100';

-- [MAX-3PC64] Perla Cobre Cristalino MAX-PC64 1l
UPDATE productos SET "precioCompra" = 109, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3PC64';

-- [MAX-3P605] Perla de Cobre MAX-P605 3.75l
UPDATE productos SET "precioCompra" = 61.82, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P605';

-- [MAX-3P603] Perla Dorada Amarilla MAX-P603 1l
UPDATE productos SET "precioCompra" = 61.82, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P603';

-- [MAX-3P601] Perla Dorada MAX-P601 1l
UPDATE productos SET "precioCompra" = 56.82, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P601';

-- [MAX-3PC61] Perla Dorado Cristalino MAX-PC61 1l
UPDATE productos SET "precioCompra" = 99.43, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3PC61';

-- [MAX-3PC50] Perla Roja Cristalino MAX-PC50 1l
UPDATE productos SET "precioCompra" = 103.67, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3PC50';

-- [MAX-3P501] Perla Roja Fina MAX-P501 1l
UPDATE productos SET "precioCompra" = 56.39, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P501';

-- [MAX-3P500] Perla Roja MAX-P500 1l
UPDATE productos SET "precioCompra" = 56.39, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P500';

-- [MAX-3P701] Perla Roja Violeta MAX-P701 1l
UPDATE productos SET "precioCompra" = 61.82, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P701';

-- [MAX-3P400] Perla Verde MAX-P400 1l
UPDATE productos SET "precioCompra" = 56.82, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P400';

-- [MAX-3P700] Perla Violeta MAX-P700 1l
UPDATE productos SET "precioCompra" = 58.8, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3P700';

-- [MAX-3M101] Pol. Aluminio Blanco Fino MAX-M101 3.75l
UPDATE productos SET "precioCompra" = 165.24, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M101';

-- [MAX-3M102A] Pol. Aluminio Blanco Mediano Fino  MAX-M102A 3.75l
UPDATE productos SET "precioCompra" = 165.24, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M102A';

-- [MAX-3M201] Pol. Aluminio Blanco Mediano MAX-M201 1l
UPDATE productos SET "precioCompra" = 50.84, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M201';

-- [MAX-3M201G] Pol. Aluminio Blanco Mediano MAX-M201G 3.75l
UPDATE productos SET "precioCompra" = 182.17, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M201G';

-- [MAX-3M400A] Pol. Aluminio Brillante Extra Fino MAX-M400A 1l
UPDATE productos SET "precioCompra" = 50.84, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M400A';

-- [MAX-3M401] Pol. Aluminio Brillante Fino MAX-M401 1l
UPDATE productos SET "precioCompra" = 45.61, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M401';

-- [MAX-3M402] Pol. Aluminio Brillante Fino MAX-M402 1l
UPDATE productos SET "precioCompra" = 50.54, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M402';

-- [MAX-3M301] Pol. Aluminio Extra Grueso MAX-M301 1L.
UPDATE productos SET "precioCompra" = 50.54, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M301';

-- [MAX-3M301G] Pol. Aluminio Extra Grueso MAX-M301G 3.75l
UPDATE productos SET "precioCompra" = 185.43, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M301G';

-- [MAX-3M100] Pol. Aluminio Extrafino MAX-M100 1l
UPDATE productos SET "precioCompra" = 45.61, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M100';

-- [MAX-3M406] Pol. Aluminio Fino Grueso MAX-M406 3.75l
UPDATE productos SET "precioCompra" = 185.43, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M406';

-- [MAX-3M300] Pol. Aluminio Grueso MAX-M300 3.75l
UPDATE productos SET "precioCompra" = 184.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M300';

-- [MAX-3M403] Pol. Aluminio Mediano Fino MAX-M403 3.75l
UPDATE productos SET "precioCompra" = 185.43, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M403';

-- [MAX-3M404] Pol. Aluminio Mediano Fino MAX-M404 3.75l
UPDATE productos SET "precioCompra" = 185.43, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M404';

-- [MAX-3M200] Pol. Aluminio Mediano MAX-M200 3.75l
UPDATE productos SET "precioCompra" = 180.33, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3M200';

-- [MAX-3B600] Pol. Amarillo Barro MAX-B600 1l
UPDATE productos SET "precioCompra" = 52.34, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B600';

-- [MAX-3B605] Pol. Amarillo Limón sin Plomo MAX-B605 1l
UPDATE productos SET "precioCompra" = 136.36, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B605';

-- [MAX-3B603] Pol. Amarillo Orgánico MAX-B603 1l
UPDATE productos SET "precioCompra" = 57.75, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B603';

-- [MAX-3B601] Pol. Amarillo Transóxido MAX-B601 1l
UPDATE productos SET "precioCompra" = 63.55, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B601';

-- [MAX-3B301] Pol. Azul Tóner MAX-B301 1l
UPDATE productos SET "precioCompra" = 46, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B301';

-- [MAX-3B302] Pol. Azul Transparente B302.75l
UPDATE productos SET "precioCompra" = 169.19, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B302';

-- [MAX-3B304] Pol. Azul Verdoso MAX-B304 3.75l
UPDATE productos SET "precioCompra" = 234.14, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B304';

-- [MAX-3B300] Pol. Azul Violetoso MAX-B300 1l
UPDATE productos SET "precioCompra" = 63.55, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B300';

-- [MAX-3B100] Pol. Blanco MAX-B100 3.75l
UPDATE productos SET "precioCompra" = 188.42, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B100';

-- [MAX-3B101] Pol. Blanco Transparente MAX-B101 1l
UPDATE productos SET "precioCompra" = 96.45, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B101';

-- [MAX-3B206B] Pol. Extra Negro MAX-B206B 1l
UPDATE productos SET "precioCompra" = 54.58, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B206B';

-- [MAX-3B606] Pol. Marrón Transparente MAX-B606 1l
UPDATE productos SET "precioCompra" = 81.5, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B606';

-- [MAX-3B203] Pol. Negro Azulado MAX-B203 3.75l
UPDATE productos SET "precioCompra" = 193.65, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B203';

-- [MAX-3B202] Pol. Negro General MAX-B202 3.75l
UPDATE productos SET "precioCompra" = 181.04, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B202';

-- [MAX-3B205] Pol. Negro MAX-B205 1l
UPDATE productos SET "precioCompra" = 52.15, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B205';

-- [MAX-3B205G] Pol. Negro MAX-B205G 3.75l
UPDATE productos SET "precioCompra" = 190.25, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B205G';

-- [MAX-3520] Pol. Resina 1K MAX 3.75l
UPDATE productos SET "precioCompra" = 170.21, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3520';

-- [MAX-3B503] Pol. Rojo Brillante MAX-B503 3.75l
UPDATE productos SET "precioCompra" = 192.17, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B503';

-- [MAX-3B500] Pol. Rojo Burdeos MAX-B500 1l
UPDATE productos SET "precioCompra" = 54.93, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B500';

-- [MAX-3B508] Pol. Rojo Granate MAX-B508 3.75l
UPDATE productos SET "precioCompra" = 240.75, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B508';

-- [MAX-3B502] Pol. Rojo Ladrillo MAX-B502 1l
UPDATE productos SET "precioCompra" = 56.94, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B502';

-- [MAX-3B501] Pol. Rojo Transóxido MAX-B501 1l
UPDATE productos SET "precioCompra" = 63.55, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B501';

-- [MAX-3B509] Pol. Rojo Transparente MAX-B509 1l
UPDATE productos SET "precioCompra" = 84.33, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B509';

-- [MAX-3B505] Pol. Rojo Violeta MAX-B505 3.75l
UPDATE productos SET "precioCompra" = 261.92, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B505';

-- [MAX-3B506] Pol. Rosa MAX-B506 1l
UPDATE productos SET "precioCompra" = 71.58, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B506';

-- [MAX-3B401] Pol. Verde Amarillento MAX-B401 1l
UPDATE productos SET "precioCompra" = 71.58, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B401';

-- [MAX-3B400] Pol. Verde MAX-B400 3.75l
UPDATE productos SET "precioCompra" = 155.52, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B400';

-- [MAX-3B402] Pol. Verde Oro MAX-B402 1l
UPDATE productos SET "precioCompra" = 81.5, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B402';

-- [MAX-3B700] Pol. Violeta MAX-B700 1l
UPDATE productos SET "precioCompra" = 68.79, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3B700';

-- [M3-40] Primer Surfacer 1k MAX 1l
UPDATE productos SET "precioCompra" = 27.57, "actualizadoEn" = NOW() WHERE codigo = 'M3-40';

-- [MAX-3C600] PU Amarillo Barro MAX-C600 3.75l
UPDATE productos SET "precioCompra" = 155.52, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C600';

-- [MAX-3C603] PU Amarillo Limón MAX-C603 1l
UPDATE productos SET "precioCompra" = 61.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C603';

-- [MAX-3C604] PU Amarillo Limón sin Plomo MAX-C604 1l
UPDATE productos SET "precioCompra" = 122.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C604';

-- [MAX-3C601] PU Amarillo Medio MAX-C601 3.75l
UPDATE productos SET "precioCompra" = 191.88, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C601';

-- [MAX-3C602] PU Amarillo Medio sin Plomo MAX-C602 1l
UPDATE productos SET "precioCompra" = 123.64, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C602';

-- [MAX-3C301] PU Azul Tóner MAX-C301 3.75l
UPDATE productos SET "precioCompra" = 165.24, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C301';

-- [MAX-3C302] PU Azul Transparente MAX-C302 3.75l
UPDATE productos SET "precioCompra" = 165.24, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C302';

-- [MAX-3C300] PU Azul Violeta MAX-C300 1l
UPDATE productos SET "precioCompra" = 63.45, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C300';

-- [TOYOTA 2K M-040] PU Blanco 040 MAX 1l
UPDATE productos SET "precioCompra" = 51.81, "actualizadoEn" = NOW() WHERE codigo = 'TOYOTA 2K M-040';

-- [TOYOTA 2K M-041] PU Blanco 041 MAX 1l
UPDATE productos SET "precioCompra" = 53.29, "actualizadoEn" = NOW() WHERE codigo = 'TOYOTA 2K M-041';

-- [TOYOTA 2K M-058] PU Blanco 058 MAX 1l
UPDATE productos SET "precioCompra" = 51.81, "actualizadoEn" = NOW() WHERE codigo = 'TOYOTA 2K M-058';

-- [MAX-3C100] PU Blanco MAX-C100 3.75l
UPDATE productos SET "precioCompra" = 184.65, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C100';

-- [MAX-3C201] PU Extra Negro MAX-C201 1l
UPDATE productos SET "precioCompra" = 50.84, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C201';

-- [MAX-3C507] PU Naranja Rojizo sin Plomo MAX-C507 1l
UPDATE productos SET "precioCompra" = 123.64, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C507';

-- [MAX-3C200] PU Negro MAX-C200 3.75l
UPDATE productos SET "precioCompra" = 165.24, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C200';

-- [MAX-3510] PU Resina 2K MAX 3.75l
UPDATE productos SET "precioCompra" = 147.93, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3510';

-- [MAX-3C504] PU Rojo Anaranjado MAX-C504 3.75l
UPDATE productos SET "precioCompra" = 204.79, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C504';

-- [MAX-3C503] PU Rojo Brillante MAX-C503 3.75l
UPDATE productos SET "precioCompra" = 184.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C503';

-- [MAX-3C533] PU Rojo Ferrari MAX-C533 3.75l
UPDATE productos SET "precioCompra" = 216.66, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C533';

-- [MAX-3C501] PU Rojo Ladrillo MAX-C501 1l
UPDATE productos SET "precioCompra" = 47.18, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C501';

-- [MAX-3C502] PU Rojo Oscuro MAX-C502 3.75l
UPDATE productos SET "precioCompra" = 184.01, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C502';

-- [MAX-3C508] PU Rojo Rubí MAX-C508 3.75l
UPDATE productos SET "precioCompra" = 344.95, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C508';

-- [MAX-3C505G] PU Rojo Violeta MAX-C505G 3.75l
UPDATE productos SET "precioCompra" = 212.34, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C505G';

-- [MAX-3C506] PU Rosa MAX-C506 1l
UPDATE productos SET "precioCompra" = 63.45, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C506';

-- [MAX-3C401] PU Verde Amarillento MAX-C401 1l
UPDATE productos SET "precioCompra" = 63.45, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C401';

-- [MAX-3C400] PU Verde MAX-C400 3.75l
UPDATE productos SET "precioCompra" = 165.24, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C400';

-- [MAX-3C700] PU Violeta MAX-C700 1l
UPDATE productos SET "precioCompra" = 65.89, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C700';

-- [MAX-3C505] PU Violeta Rojizo MAX-C505 1l
UPDATE productos SET "precioCompra" = 63.45, "actualizadoEn" = NOW() WHERE codigo = 'MAX-3C505';

-- [A21-10416] Cera Pulidora P2001 200gr
UPDATE productos SET "precioCompra" = 14.35, "actualizadoEn" = NOW() WHERE codigo = 'A21-10416';

-- [A21-09787] Emborrachamiento Blanco P2001 900ml
UPDATE productos SET "precioCompra" = 17.58, "actualizadoEn" = NOW() WHERE codigo = 'A21-09787';

-- [A21-09788] Emborrachamiento Negro P2001 900ml
UPDATE productos SET "precioCompra" = 26.28, "actualizadoEn" = NOW() WHERE codigo = 'A21-09788';

-- [A21-10462] Endurecedor Primer Pu 411 P2001 180ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'A21-10462';

-- [A21-18348] Endurecedor Primer Pu 411 P2001 225ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'A21-18348';

-- [A21-11836] Manta de Fibra de Vidrio P2001 300g
UPDATE productos SET "precioCompra" = 14.17, "actualizadoEn" = NOW() WHERE codigo = 'A21-11836';

-- [A21-09802] Masa Antiruido P2001 900ml
UPDATE productos SET "precioCompra" = 26.55, "actualizadoEn" = NOW() WHERE codigo = 'A21-09802';

-- [A21-10429] Masa de Pulir No.2 P2001 450g
UPDATE productos SET "precioCompra" = 23.41, "actualizadoEn" = NOW() WHERE codigo = 'A21-10429';

-- [A21-10428] Masa de Pulir No.2 Premiun P2001 1kg
UPDATE productos SET "precioCompra" = 37.54, "actualizadoEn" = NOW() WHERE codigo = 'A21-10428';

-- [A21-10427] Masa de Pulir No. 1 P2001 1kg
UPDATE productos SET "precioCompra" = 37.3, "actualizadoEn" = NOW() WHERE codigo = 'A21-10427';

-- [A21-10529] Masa Rápida Gris P2001 900ml
UPDATE productos SET "precioCompra" = 42.08, "actualizadoEn" = NOW() WHERE codigo = 'A21-10529';

-- [A21-16683] Masilla Light P2001 1kg
UPDATE productos SET "precioCompra" = 20.61, "actualizadoEn" = NOW() WHERE codigo = 'A21-16683';

-- [A21-16684] Masilla Light P2001 2.5kg
UPDATE productos SET "precioCompra" = 53.64, "actualizadoEn" = NOW() WHERE codigo = 'A21-16684';

-- [A21-09772] Masilla Plástica Gris P2001 1kg
UPDATE productos SET "precioCompra" = 21.04, "actualizadoEn" = NOW() WHERE codigo = 'A21-09772';

-- [A21-09777] Masilla Plástica Superior P2001 1kg
UPDATE productos SET "precioCompra" = 22.72, "actualizadoEn" = NOW() WHERE codigo = 'A21-09777';

-- [A21-16686] Masilla Poliester Megalight P2001 4.0 kg
UPDATE productos SET "precioCompra" = 105.35, "actualizadoEn" = NOW() WHERE codigo = 'A21-16686';

-- [A21-11024] Masilla Poliester Megaliht P2001 900g
UPDATE productos SET "precioCompra" = 40.65, "actualizadoEn" = NOW() WHERE codigo = 'A21-11024';

-- [A21-16090] Masilla Poliester P2001 4k
UPDATE productos SET "precioCompra" = 160.43, "actualizadoEn" = NOW() WHERE codigo = 'A21-16090';

-- [A21-16685] Masilla Poliester P2001 5.0kg
UPDATE productos SET "precioCompra" = 116.24, "actualizadoEn" = NOW() WHERE codigo = 'A21-16685';

-- [A21-09784] Masilla Poliester P2001 900g
UPDATE productos SET "precioCompra" = 36.05, "actualizadoEn" = NOW() WHERE codigo = 'A21-09784';

-- [A21-10440] Primer Pu 411 P2001 720ml
UPDATE productos SET "precioCompra" = 37.34, "actualizadoEn" = NOW() WHERE codigo = 'A21-10440';

-- [A21-18347] Primer Pu 411 P2001 900ml
UPDATE productos SET "precioCompra" = 63.77, "actualizadoEn" = NOW() WHERE codigo = 'A21-18347';

-- [A21-09791] Removedor Pastoso P2001 900ml
UPDATE productos SET "precioCompra" = 27.26, "actualizadoEn" = NOW() WHERE codigo = 'A21-09791';

-- [A21-09782] Resina para Laminación P2001 900g
UPDATE productos SET "precioCompra" = 68.05, "actualizadoEn" = NOW() WHERE codigo = 'A21-09782';

-- [A21-10434] Sulfacer Gris P2001 900ml
UPDATE productos SET "precioCompra" = 58.61, "actualizadoEn" = NOW() WHERE codigo = 'A21-10434';

-- [PR-B153] 1K Aditivo de efecto JW 3,75l
UPDATE productos SET "precioCompra" = 146.85, "actualizadoEn" = NOW() WHERE codigo = 'PR-B153';

-- [PR-M03] 1K Aluminio Amarillo JW 1l
UPDATE productos SET "precioCompra" = 273.46, "actualizadoEn" = NOW() WHERE codigo = 'PR-M03';

-- [PR-M02] 1K Aluminio Azul JW 1l
UPDATE productos SET "precioCompra" = 273.46, "actualizadoEn" = NOW() WHERE codigo = 'PR-M02';

-- [PR-M31A] 1K Aluminio Blanco Fino JW 3,75l
UPDATE productos SET "precioCompra" = 159.69, "actualizadoEn" = NOW() WHERE codigo = 'PR-M31A';

-- [PR-M91] 1K Aluminio Dorado JW 1l
UPDATE productos SET "precioCompra" = 135.1, "actualizadoEn" = NOW() WHERE codigo = 'PR-M91';

-- [PR-M36] 1K Aluminio Extra Fino Brillante JW 1l
UPDATE productos SET "precioCompra" = 43.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-M36';

-- [PR-M37] 1K Aluminio Fino Brillante JW 3,75l
UPDATE productos SET "precioCompra" = 159.69, "actualizadoEn" = NOW() WHERE codigo = 'PR-M37';

-- [PR-M31] 1K Aluminio Fino JW 3,75l
UPDATE productos SET "precioCompra" = 137.94, "actualizadoEn" = NOW() WHERE codigo = 'PR-M31';

-- [PR-M35] 1K Aluminio Grueso Brillante  JW 3,75l
UPDATE productos SET "precioCompra" = 159.69, "actualizadoEn" = NOW() WHERE codigo = 'PR-M35';

-- [PR-M33A] 1K Aluminio Grueso Claro JW 3,75l
UPDATE productos SET "precioCompra" = 159.69, "actualizadoEn" = NOW() WHERE codigo = 'PR-M33A';

-- [PR-M34] 1K Aluminio Grueso JW 1l
UPDATE productos SET "precioCompra" = 43.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-M34';

-- [PR-M32] 1K Aluminio Mediano JW 1l
UPDATE productos SET "precioCompra" = 43.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-M32';

-- [PR-M38] 1K Aluminio Medio Brillante JW 3,75l
UPDATE productos SET "precioCompra" = 159.69, "actualizadoEn" = NOW() WHERE codigo = 'PR-M38';

-- [PR-M32A] 1K Aluminio Medio Claro JW 3,75l
UPDATE productos SET "precioCompra" = 159.69, "actualizadoEn" = NOW() WHERE codigo = 'PR-M32A';

-- [PR-M33] 1K Aluminio Medio Grueso JW 1l
UPDATE productos SET "precioCompra" = 43.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-M33';

-- [PR-M92] 1K Aluminio Naranja JW 1l
UPDATE productos SET "precioCompra" = 159.94, "actualizadoEn" = NOW() WHERE codigo = 'PR-M92';

-- [PR-M01] 1K Aluminio Rojo JW 1l
UPDATE productos SET "precioCompra" = 273.46, "actualizadoEn" = NOW() WHERE codigo = 'PR-M01';

-- [PR-M30] 1K Aluminio Super Fino JW 1l
UPDATE productos SET "precioCompra" = 38.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-M30';

-- [PR-M34A] 1K Aluminio Super Grueso JW 1l
UPDATE productos SET "precioCompra" = 43.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-M34A';

-- [PR-M78] 1K Amarillo Limón JW 1l
UPDATE productos SET "precioCompra" = 46, "actualizadoEn" = NOW() WHERE codigo = 'PR-M78';

-- [PR-M93] 1K Amarillo Medio JW 1l
UPDATE productos SET "precioCompra" = 46, "actualizadoEn" = NOW() WHERE codigo = 'PR-M93';

-- [PR-M77] 1K Amarillo Óxido JW 1l
UPDATE productos SET "precioCompra" = 38.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-M77';

-- [PR-P46A] 1K Amarillo Perlado Fino JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P46A';

-- [PR-P47] 1K Amarillo Perlado Fino JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P47';

-- [PR-M58] 1K Amarillo Transparente JW 1l
UPDATE productos SET "precioCompra" = 51.34, "actualizadoEn" = NOW() WHERE codigo = 'PR-M58';

-- [PR-M902] 1K Azul Cristal Perlado JW 1l
UPDATE productos SET "precioCompra" = 97.6, "actualizadoEn" = NOW() WHERE codigo = 'PR-M902';

-- [PR-M56] 1k Azul Estandar JW 1l
UPDATE productos SET "precioCompra" = 43.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-M56';

-- [PR-M53] 1k Azul Orgánico JW 3.75l
UPDATE productos SET "precioCompra" = 153.44, "actualizadoEn" = NOW() WHERE codigo = 'PR-M53';

-- [PR-P44A] 1K Azul Perlado Fino JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P44A';

-- [PR-P44] 1K Azul Perlado JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P44';

-- [PR-M52] 1k Azul Rojiso JW 1l
UPDATE productos SET "precioCompra" = 73.76, "actualizadoEn" = NOW() WHERE codigo = 'PR-M52';

-- [PR-M54] 1K Azul Verdoso JW 3,75l
UPDATE productos SET "precioCompra" = 240.54, "actualizadoEn" = NOW() WHERE codigo = 'PR-M54';

-- [PR-M55] 1K Azul Violetoso JW 1l
UPDATE productos SET "precioCompra" = 45.59, "actualizadoEn" = NOW() WHERE codigo = 'PR-M55';

-- [PR-M901] 1K Blanco Cristal Perlado JW 1l
UPDATE productos SET "precioCompra" = 79.34, "actualizadoEn" = NOW() WHERE codigo = 'PR-M901';

-- [PR-M71] 1K Blanco JW 3.5l
UPDATE productos SET "precioCompra" = 164.61, "actualizadoEn" = NOW() WHERE codigo = 'PR-M71';

-- [PR-P43A] 1K Blanco Perlado Fino JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P43A';

-- [PR-P43B] 1K Blanco Perlado Grueso JW 1l
UPDATE productos SET "precioCompra" = 54.67, "actualizadoEn" = NOW() WHERE codigo = 'PR-P43B';

-- [PR-P43] 1K Blanco Perlado JW 1l
UPDATE productos SET "precioCompra" = 49.75, "actualizadoEn" = NOW() WHERE codigo = 'PR-P43';

-- [PR-B150] 1K Clear Poliester JW 3,75l
UPDATE productos SET "precioCompra" = 135.44, "actualizadoEn" = NOW() WHERE codigo = 'PR-B150';

-- [PR-M904] 1K Cobre Cristal Perlado JW 1l
UPDATE productos SET "precioCompra" = 97.6, "actualizadoEn" = NOW() WHERE codigo = 'PR-M904';

-- [PR-P41A] 1K Cobre Perlado Fino JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P41A';

-- [PR-P41] 1K Cobre Perlado JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P41';

-- [PR-M905] 1K Dorado Cristal Perlado JW 1l
UPDATE productos SET "precioCompra" = 97.6, "actualizadoEn" = NOW() WHERE codigo = 'PR-M905';

-- [PR-P46B] 1K Dorado Perlado JW 1l
UPDATE productos SET "precioCompra" = 67.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-P46B';

-- [PR-M95] 1K Naranja Amarillo JW 1l
UPDATE productos SET "precioCompra" = 53.17, "actualizadoEn" = NOW() WHERE codigo = 'PR-M95';

-- [PR-M74] 1K Naranja JW 1l
UPDATE productos SET "precioCompra" = 55.5, "actualizadoEn" = NOW() WHERE codigo = 'PR-M74';

-- [PR-P20] 1K Naranja Perlado JW 1l
UPDATE productos SET "precioCompra" = 85.34, "actualizadoEn" = NOW() WHERE codigo = 'PR-P20';

-- [PR-M70] 1K Negro Azulado KW 1l
UPDATE productos SET "precioCompra" = 43.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-M70';

-- [PR-M69] 1K Negro Extra Azulado JW 1l
UPDATE productos SET "precioCompra" = 48.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-M69';

-- [PR-M50] 1k Negro JW 3,75l
UPDATE productos SET "precioCompra" = 153.44, "actualizadoEn" = NOW() WHERE codigo = 'PR-M50';

-- [PR-P46] 1K Oro Perlado JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P46';

-- [PR-M62] 1K Óro Transparente JW 1l
UPDATE productos SET "precioCompra" = 46.84, "actualizadoEn" = NOW() WHERE codigo = 'PR-M62';

-- [PR-B180] 1K Resina Mate JW 3,75l
UPDATE productos SET "precioCompra" = 184.19, "actualizadoEn" = NOW() WHERE codigo = 'PR-B180';

-- [PR-M82] 1K Rojo Brillante JW 3,75l
UPDATE productos SET "precioCompra" = 196.95, "actualizadoEn" = NOW() WHERE codigo = 'PR-M82';

-- [PR-M76] 1K Rojo brillante Transparente JW 1l
UPDATE productos SET "precioCompra" = 92.84, "actualizadoEn" = NOW() WHERE codigo = 'PR-M76';

-- [PR-M66] 1K Rojo Carmesi JW 1l
UPDATE productos SET "precioCompra" = 59.67, "actualizadoEn" = NOW() WHERE codigo = 'PR-M66';

-- [PR-M59] 1K Rojo clarete JW 1l
UPDATE productos SET "precioCompra" = 59.67, "actualizadoEn" = NOW() WHERE codigo = 'PR-M59';

-- [PR-M903] 1K Rojo Cristal Perlado JW 1l
UPDATE productos SET "precioCompra" = 97.6, "actualizadoEn" = NOW() WHERE codigo = 'PR-M903';

-- [PR-M61] 1K Rojo Granate JW 3,75l
UPDATE productos SET "precioCompra" = 268.38, "actualizadoEn" = NOW() WHERE codigo = 'PR-M61';

-- [PR-M80] 1K Rojo LLamativo JW 1l
UPDATE productos SET "precioCompra" = 49.75, "actualizadoEn" = NOW() WHERE codigo = 'PR-M80';

-- [PR-M67] 1K Rojo Marrón JW 1l
UPDATE productos SET "precioCompra" = 64.67, "actualizadoEn" = NOW() WHERE codigo = 'PR-M67';

-- [PR-M79] 1K Rojo Óxido JW 1l
UPDATE productos SET "precioCompra" = 40.5, "actualizadoEn" = NOW() WHERE codigo = 'PR-M79';

-- [PR-P42A] 1K Rojo perlado Fino JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P42A';

-- [PR-P48B] 1K Rojo Perlado Fino JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P48B';

-- [PR-P42] 1K Rojo Perlado JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P42';

-- [PR-M63] 1K Rojo Transoxido JW 1l
UPDATE productos SET "precioCompra" = 46.84, "actualizadoEn" = NOW() WHERE codigo = 'PR-M63';

-- [PR-M68A] 1K Rojo Transparente JW 1l
UPDATE productos SET "precioCompra" = 74.59, "actualizadoEn" = NOW() WHERE codigo = 'PR-M68A';

-- [PR-M65] 1K Rosa JW 1l
UPDATE productos SET "precioCompra" = 64.67, "actualizadoEn" = NOW() WHERE codigo = 'PR-M65';

-- [PR-M72] 1K Super Fino Blanco JW 1l
UPDATE productos SET "precioCompra" = 87.84, "actualizadoEn" = NOW() WHERE codigo = 'PR-M72';

-- [PR-M73] 1K Verde Amarillento JW 1L
UPDATE productos SET "precioCompra" = 63.01, "actualizadoEn" = NOW() WHERE codigo = 'PR-M73';

-- [PR-M57] 1K Verde JW 1l
UPDATE productos SET "precioCompra" = 46.42, "actualizadoEn" = NOW() WHERE codigo = 'PR-M57';

-- [PR-M90] 1K Verde Oliva JW 1l
UPDATE productos SET "precioCompra" = 59.67, "actualizadoEn" = NOW() WHERE codigo = 'PR-M90';

-- [PR-P45] 1K Verde Perlado Fino JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P45';

-- [PR-M51] 1k Violeta JW 1l
UPDATE productos SET "precioCompra" = 56.34, "actualizadoEn" = NOW() WHERE codigo = 'PR-M51';

-- [PR-M60A] 1K Violeta Oscuro JW 1l
UPDATE productos SET "precioCompra" = 81.18, "actualizadoEn" = NOW() WHERE codigo = 'PR-M60A';

-- [PR-P48] 1K Violeta Perlado JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P48';

-- [PR-P48A] 1K Violeta Perlado Oscuro JW 1l
UPDATE productos SET "precioCompra" = 48.09, "actualizadoEn" = NOW() WHERE codigo = 'PR-P48A';

-- [PR-M60] 1K Violeta Rojizo JW 1l
UPDATE productos SET "precioCompra" = 63.01, "actualizadoEn" = NOW() WHERE codigo = 'PR-M60';

-- [PR-B100] 2K Aglutinante JW 3,75l
UPDATE productos SET "precioCompra" = 103.68, "actualizadoEn" = NOW() WHERE codigo = 'PR-B100';

-- [PR-S01] 2K Blanco Puro JW 3.75l
UPDATE productos SET "precioCompra" = 128.52, "actualizadoEn" = NOW() WHERE codigo = 'PR-S01';

-- [PR-040] 2K Blanco Toyota 040 JW 1l
UPDATE productos SET "precioCompra" = 35.75, "actualizadoEn" = NOW() WHERE codigo = 'PR-040';

-- [PR-041] 2K Blanco Toyota 041 JW 1l
UPDATE productos SET "precioCompra" = 35.75, "actualizadoEn" = NOW() WHERE codigo = 'PR-041';

-- [PR-056] 2K Blanco Toyota 056 JW 1l
UPDATE productos SET "precioCompra" = 34.86, "actualizadoEn" = NOW() WHERE codigo = 'PR-056';

-- [PR-058] 2K Blanco Toyota 058 JW 1l
UPDATE productos SET "precioCompra" = 34.86, "actualizadoEn" = NOW() WHERE codigo = 'PR-058';

-- [PR-B160] Aglutinante Balance JW 3,75l
UPDATE productos SET "precioCompra" = 131.18, "actualizadoEn" = NOW() WHERE codigo = 'PR-B160';

-- [PR-3000L] Barniz MS 2:1 JW 1l
UPDATE productos SET "precioCompra" = 27.92, "actualizadoEn" = NOW() WHERE codigo = 'PR-3000L';

-- [PR-CAT-M] Catalizador Rápido  p/2:1 JW 500ml
UPDATE productos SET "precioCompra" = 27.08, "actualizadoEn" = NOW() WHERE codigo = 'PR-CAT-M';

-- [PR-CAT-L] Catalizador Rápido p/2:1  JW 1l
UPDATE productos SET "precioCompra" = 42.13, "actualizadoEn" = NOW() WHERE codigo = 'PR-CAT-L';

-- [PR-MPROM] Material Promocional - Catalogo de colores
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'PR-MPROM';

-- [PR-MPROM G] Material Promocional - Gorras
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'PR-MPROM G';

-- [PR-MPROM LL] Material Promocional - LLaveros
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'PR-MPROM LL';

-- [PR-MPROM P] Material Promocional - Poleras
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'PR-MPROM P';

-- [PR-MPROM R] Material Promocional - Reglas Aluminio
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'PR-MPROM R';

-- [R-CAT-CX] Catalizador Mek RQ 10gr
UPDATE productos SET "precioCompra" = 1.12, "actualizadoEn" = NOW() WHERE codigo = 'R-CAT-CX';

-- [R-CPU0411-CX1] Catalizador para Primer PU 411 RQ 225ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'R-CPU0411-CX1';

-- [R-CPU0511-CX1] Catalizador para Primer PU 511 RQ 150ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'R-CPU0511-CX1';

-- [R-BAP0900-CX1] Emborrachamiento Blanco RQ 900ml
UPDATE productos SET "precioCompra" = 14.29, "actualizadoEn" = NOW() WHERE codigo = 'R-BAP0900-CX1';

-- [R-BAP0900-CX2] Emborrachamiento Negro RQ 900ml
UPDATE productos SET "precioCompra" = 12.7, "actualizadoEn" = NOW() WHERE codigo = 'R-BAP0900-CX2';

-- [R-FRP0180-CX1] Fixputty Masa para pequeños reparos RQ
UPDATE productos SET "precioCompra" = 11.24, "actualizadoEn" = NOW() WHERE codigo = 'R-FRP0180-CX1';

-- [R-MANTA-500-CX1] Manta de Fibra de Vidrio  RQ 500gr
UPDATE productos SET "precioCompra" = 13.14, "actualizadoEn" = NOW() WHERE codigo = 'R-MANTA-500-CX1';

-- [R-MANTA-250-CX1] Manta de Fibra de Vidrio RQ 250gr
UPDATE productos SET "precioCompra" = 7.52, "actualizadoEn" = NOW() WHERE codigo = 'R-MANTA-250-CX1';

-- [R-MRF1000-CX1] Masa Rápida Gris RQ  1.25Kg
UPDATE productos SET "precioCompra" = 19.15, "actualizadoEn" = NOW() WHERE codigo = 'R-MRF1000-CX1';

-- [R-APL1000BR-CX12] Masilla Plástica Blanca (GFix) RQ 1kg
UPDATE productos SET "precioCompra" = 20.53, "actualizadoEn" = NOW() WHERE codigo = 'R-APL1000BR-CX12';

-- [R-APL1000CIZCX1] Masilla Plástica Gris (GFix) RQ 1kg
UPDATE productos SET "precioCompra" = 18.95, "actualizadoEn" = NOW() WHERE codigo = 'R-APL1000CIZCX1';

-- [R-APO750-CX1] Masilla Poliester Fixlight  RQ 750gr
UPDATE productos SET "precioCompra" = 20.68, "actualizadoEn" = NOW() WHERE codigo = 'R-APO750-CX1';

-- [R-APO900-CX1] Masilla Poliester Fixlight RQ 900gr
UPDATE productos SET "precioCompra" = 16.53, "actualizadoEn" = NOW() WHERE codigo = 'R-APO900-CX1';

-- [R-APM4000-GL1] Masilla Poliéster Premium RQ 4Kg
UPDATE productos SET "precioCompra" = 199.56, "actualizadoEn" = NOW() WHERE codigo = 'R-APM4000-GL1';

-- [R-APL1000CIZ-CX14] Masilla Poliéster Premium RQ 750 gr
UPDATE productos SET "precioCompra" = 41.88, "actualizadoEn" = NOW() WHERE codigo = 'R-APL1000CIZ-CX14';

-- [R-APSL2500-GL1] Masilla Super Light RQ 2.5kg
UPDATE productos SET "precioCompra" = 29.41, "actualizadoEn" = NOW() WHERE codigo = 'R-APSL2500-GL1';

-- [R-MPO0500-CX1] Massa de Pulir N"2 Base Agua RQ 500gr
UPDATE productos SET "precioCompra" = 10.71, "actualizadoEn" = NOW() WHERE codigo = 'R-MPO0500-CX1';

-- [R-MPO1000-CX1] Massa de Pulir N"2 Base Agua RQ 1000gr
UPDATE productos SET "precioCompra" = 21.42, "actualizadoEn" = NOW() WHERE codigo = 'R-MPO1000-CX1';

-- [R-PPU0411-CX1] Primer PU 411 RQ 900ml
UPDATE productos SET "precioCompra" = 43.87, "actualizadoEn" = NOW() WHERE codigo = 'R-PPU0411-CX1';

-- [R-PPU0511-CX1] Primer PU 511 RQ 750ml
UPDATE productos SET "precioCompra" = 13.69, "actualizadoEn" = NOW() WHERE codigo = 'R-PPU0511-CX1';

-- [R-PUC-GL1] Primer Universal Gris RQ 3.6l
UPDATE productos SET "precioCompra" = 60.47, "actualizadoEn" = NOW() WHERE codigo = 'R-PUC-GL1';

-- [R-PUC0900/3-CX] Primer Universal Gris RQ 900ml
UPDATE productos SET "precioCompra" = 16.38, "actualizadoEn" = NOW() WHERE codigo = 'R-PUC0900/3-CX';

-- [R-RPA1000-CX1] Removedor Pastoso RQ 1kg
UPDATE productos SET "precioCompra" = 14.4, "actualizadoEn" = NOW() WHERE codigo = 'R-RPA1000-CX1';

-- [R-RPA0500-CX1] Removedor Pastoso RQ 500gr
UPDATE productos SET "precioCompra" = 8.23, "actualizadoEn" = NOW() WHERE codigo = 'R-RPA0500-CX1';

-- [R-RPC0150-CX1] Repara Choque Componente A/B RQ
UPDATE productos SET "precioCompra" = 34.11, "actualizadoEn" = NOW() WHERE codigo = 'R-RPC0150-CX1';

-- [R-APLO800-CX1] Resina para Laminación RQ 800gr
UPDATE productos SET "precioCompra" = 26.2, "actualizadoEn" = NOW() WHERE codigo = 'R-APLO800-CX1';

-- [1600AD500017] AD 500 Poliéster Aditivo de Efecto SW 900ml
UPDATE productos SET "precioCompra" = 36.08, "actualizadoEn" = NOW() WHERE codigo = '1600AD500017';

-- [0500AL300523] Adhesivo Ligth SW 495ml
UPDATE productos SET "precioCompra" = 17.54, "actualizadoEn" = NOW() WHERE codigo = '0500AL300523';

-- [045008937442] Barniz Alto Sólido 8937 SW 900ml
UPDATE productos SET "precioCompra" = 32.54, "actualizadoEn" = NOW() WHERE codigo = '045008937442';

-- [045006100520] Barniz Poliuretano 6100 A+B (kit) SW 900ml
UPDATE productos SET "precioCompra" = 22.8, "actualizadoEn" = NOW() WHERE codigo = '045006100520';

-- [045B08000520] Barniz Poliuretano 8000 A+B (kit) SW 900ml
UPDATE productos SET "precioCompra" = 34.18, "actualizadoEn" = NOW() WHERE codigo = '045B08000520';

-- [155008050520] Barniz Poliuretano 8050 A+B (kit) SW 900ml
UPDATE productos SET "precioCompra" = 38.29, "actualizadoEn" = NOW() WHERE codigo = '155008050520';

-- [045B08500520] Barniz Poliuretano 8500 A+B (kit) SW 900ml
UPDATE productos SET "precioCompra" = 33.81, "actualizadoEn" = NOW() WHERE codigo = '045B08500520';

-- [807788816] Bonete p/Pulir Doble Cara Blanco 5" SW
UPDATE productos SET "precioCompra" = 68.14, "actualizadoEn" = NOW() WHERE codigo = '807788816';

-- [807789796] Bonete p/Pulir Doble Cara Blanco 8" SW
UPDATE productos SET "precioCompra" = 99.21, "actualizadoEn" = NOW() WHERE codigo = '807789796';

-- [809388817] Bonete p/Pulir Esponja #2 Doble Cara 5" SW
UPDATE productos SET "precioCompra" = 53.48, "actualizadoEn" = NOW() WHERE codigo = '809388817';

-- [809388818] Bonete p/Pulir Esponja #2 Doble Cara 8" SW
UPDATE productos SET "precioCompra" = 60.47, "actualizadoEn" = NOW() WHERE codigo = '809388818';

-- [807788821] Bonete p/Pulir Una Cara Blanco 5" SW
UPDATE productos SET "precioCompra" = 29, "actualizadoEn" = NOW() WHERE codigo = '807788821';

-- [807788822] Bonete p/Pulir Una Cara Blanco 8" SW
UPDATE productos SET "precioCompra" = 28.79, "actualizadoEn" = NOW() WHERE codigo = '807788822';

-- [046600055261] Catalizador p/Baja Temp. 055 SW 150ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '046600055261';

-- [056600H41645] Catalizador p/Primer H41 SW 180ml
UPDATE productos SET "precioCompra" = 20.18, "actualizadoEn" = NOW() WHERE codigo = '056600H41645';

-- [056600H51261] Catalizador p/Primer H51 SW 150ml
UPDATE productos SET "precioCompra" = 12.35, "actualizadoEn" = NOW() WHERE codigo = '056600H51261';

-- [056600H81262] Catalizador p/Primer H81 SW 100ml
UPDATE productos SET "precioCompra" = 7.38, "actualizadoEn" = NOW() WHERE codigo = '056600H81262';

-- [050000051015] Catalizador p/Wash P. y Negro Mate SW 300ml
UPDATE productos SET "precioCompra" = 7.55, "actualizadoEn" = NOW() WHERE codigo = '050000051015';

-- [808709519] Catalogo de Colores  Importados SW
UPDATE productos SET "precioCompra" = 304.12, "actualizadoEn" = NOW() WHERE codigo = '808709519';

-- [807986860] Copo con medida 450ml SW
UPDATE productos SET "precioCompra" = 2.3, "actualizadoEn" = NOW() WHERE codigo = '807986860';

-- [807986355] Copo con medida 1500ml SW
UPDATE productos SET "precioCompra" = 4.6, "actualizadoEn" = NOW() WHERE codigo = '807986355';

-- [050000075004] Emborrachamiento Automotivo Blanco SW 900ml
UPDATE productos SET "precioCompra" = 15.79, "actualizadoEn" = NOW() WHERE codigo = '050000075004';

-- [050000070004] Emborrachamiento Automotivo Negro SW 900ml
UPDATE productos SET "precioCompra" = 18.98, "actualizadoEn" = NOW() WHERE codigo = '050000070004';

-- [156689120175] Endurecedor p/Barniz 8937  SW 450ml
UPDATE productos SET "precioCompra" = 24.93, "actualizadoEn" = NOW() WHERE codigo = '156689120175';

-- [046600411133] Endurecedor para P411 SW 225ml
UPDATE productos SET "precioCompra" = 12.15, "actualizadoEn" = NOW() WHERE codigo = '046600411133';

-- [056600510261] Endurecedor para P510 SW 150ml
UPDATE productos SET "precioCompra" = 7.79, "actualizadoEn" = NOW() WHERE codigo = '056600510261';

-- [0566H350261] Endurecedor para PU KP350 5:1 SW 150ml
UPDATE productos SET "precioCompra" = 12.35, "actualizadoEn" = NOW() WHERE codigo = '0566H350261';

-- [807988801] Film Plástico con Masking SW
UPDATE productos SET "precioCompra" = 24.33, "actualizadoEn" = NOW() WHERE codigo = '807988801';

-- [808799638] Gama de Colores 2017 SW
UPDATE productos SET "precioCompra" = 304.12, "actualizadoEn" = NOW() WHERE codigo = '808799638';

-- [809399943] Kit de Proteccion SW
UPDATE productos SET "precioCompra" = 5.14, "actualizadoEn" = NOW() WHERE codigo = '809399943';

-- [010098379004] Laca Nitro Blanco 040 SW 900ml
UPDATE productos SET "precioCompra" = 27.78, "actualizadoEn" = NOW() WHERE codigo = '010098379004';

-- [010098380004] Laca Nitro Blanco 041 SW 900ml
UPDATE productos SET "precioCompra" = 27.78, "actualizadoEn" = NOW() WHERE codigo = '010098380004';

-- [010000901004] Laca Nitro Negro Cadilac SW 900ml
UPDATE productos SET "precioCompra" = 27.56, "actualizadoEn" = NOW() WHERE codigo = '010000901004';

-- [011000910004] Laca Nitro Negro Mate SW 900ml
UPDATE productos SET "precioCompra" = 27.94, "actualizadoEn" = NOW() WHERE codigo = '011000910004';

-- [807900050] Linterna p/ Acierto de Colores SW
UPDATE productos SET "precioCompra" = 2062.21, "actualizadoEn" = NOW() WHERE codigo = '807900050';

-- [0700LM401001] LM 401 Poliéster Negro SW 3.6l
UPDATE productos SET "precioCompra" = 169.5, "actualizadoEn" = NOW() WHERE codigo = '0700LM401001';

-- [0700LM402004] LM 402 Poliéster Blanco SW 900ml
UPDATE productos SET "precioCompra" = 35.37, "actualizadoEn" = NOW() WHERE codigo = '0700LM402004';

-- [0700LM403004] LM 403 Poliéster Azul Claro SW 900ml
UPDATE productos SET "precioCompra" = 42.69, "actualizadoEn" = NOW() WHERE codigo = '0700LM403004';

-- [0700LM404004] LM 404 Poliéster Azul Medio SW 900ml
UPDATE productos SET "precioCompra" = 66.77, "actualizadoEn" = NOW() WHERE codigo = '0700LM404004';

-- [0700LM405004] LM 405 Poliéster Azul Medio Oscuro SW 900ml
UPDATE productos SET "precioCompra" = 47.33, "actualizadoEn" = NOW() WHERE codigo = '0700LM405004';

-- [0700LM406004] LM 406 Poliéster Azul Oscuro SW 900ml
UPDATE productos SET "precioCompra" = 67.61, "actualizadoEn" = NOW() WHERE codigo = '0700LM406004';

-- [0700LM407001] LM 407 Poliéster Negro Claro SW 3.6l
UPDATE productos SET "precioCompra" = 128.97, "actualizadoEn" = NOW() WHERE codigo = '0700LM407001';

-- [0700LM408004] LM 408 Poliéster Azul SW 900ml
UPDATE productos SET "precioCompra" = 67.23, "actualizadoEn" = NOW() WHERE codigo = '0700LM408004';

-- [0700LM409017] LM 409 Poliéster Rojo Claro SW 900ml
UPDATE productos SET "precioCompra" = 83.05, "actualizadoEn" = NOW() WHERE codigo = '0700LM409017';

-- [0700LM410017] LM 410 Poliéster Rojo Medio SW 900ml
UPDATE productos SET "precioCompra" = 58.3, "actualizadoEn" = NOW() WHERE codigo = '0700LM410017';

-- [0700LM412017] LM 412 Poliéster Naranja SW 900ml
UPDATE productos SET "precioCompra" = 39.17, "actualizadoEn" = NOW() WHERE codigo = '0700LM412017';

-- [0700LM413017] LM 413 Poliéster Rojo Transparente SW 900ml
UPDATE productos SET "precioCompra" = 46.49, "actualizadoEn" = NOW() WHERE codigo = '0700LM413017';

-- [0700LM414017] LM 414 Poliéster Rojo Óxido SW 900ml
UPDATE productos SET "precioCompra" = 40.79, "actualizadoEn" = NOW() WHERE codigo = '0700LM414017';

-- [0700LM415017] LM 415 Poliéster Naranja Claro SW 900ml
UPDATE productos SET "precioCompra" = 73, "actualizadoEn" = NOW() WHERE codigo = '0700LM415017';

-- [0700LM417017] LM 417 Poliéster Rojo Rubí SW 900ml
UPDATE productos SET "precioCompra" = 94.43, "actualizadoEn" = NOW() WHERE codigo = '0700LM417017';

-- [0700LM418017] LM 418 Poliéster Amarillo Claro SW 900ml
UPDATE productos SET "precioCompra" = 53.59, "actualizadoEn" = NOW() WHERE codigo = '0700LM418017';

-- [0700LM419004] LM 419 Poliéster Amarillo Transparente SW 900ml
UPDATE productos SET "precioCompra" = 46.34, "actualizadoEn" = NOW() WHERE codigo = '0700LM419004';

-- [0700LM420017] LM 420 Poliéster Amarillo Óxido SW 900ml
UPDATE productos SET "precioCompra" = 38.97, "actualizadoEn" = NOW() WHERE codigo = '0700LM420017';

-- [0700LM421017] LM 421 Poliéster Amarillo Cromo SW 900ml
UPDATE productos SET "precioCompra" = 36.66, "actualizadoEn" = NOW() WHERE codigo = '0700LM421017';

-- [0700LM422017] LM 422 Poliéster Amarillo Verdoso SW 900ml
UPDATE productos SET "precioCompra" = 98.98, "actualizadoEn" = NOW() WHERE codigo = '0700LM422017';

-- [0700LM423004] LM 423 Poliéster Rojo Vivo SW 900ml
UPDATE productos SET "precioCompra" = 50.99, "actualizadoEn" = NOW() WHERE codigo = '0700LM423004';

-- [0700LM424017] LM 424 Poliéster Rojo Escarlata SW 900ml
UPDATE productos SET "precioCompra" = 48.2, "actualizadoEn" = NOW() WHERE codigo = '0700LM424017';

-- [0700LM425017] LM 425 Poliéster Marrón Claro SW 900ml
UPDATE productos SET "precioCompra" = 96.03, "actualizadoEn" = NOW() WHERE codigo = '0700LM425017';

-- [0700LM426017] LM 426 Poliéster Marrón Medio SW 900ml
UPDATE productos SET "precioCompra" = 85.01, "actualizadoEn" = NOW() WHERE codigo = '0700LM426017';

-- [0700LM428017] LM 428 Poliéster Marrón Oro SW 900ml
UPDATE productos SET "precioCompra" = 109.61, "actualizadoEn" = NOW() WHERE codigo = '0700LM428017';

-- [0700LM429017] LM 429 Poliéster Rosa SW 900ml
UPDATE productos SET "precioCompra" = 68.17, "actualizadoEn" = NOW() WHERE codigo = '0700LM429017';

-- [0700LM430001] LM 430 Poliéster Blanco Puro SW 3.6l
UPDATE productos SET "precioCompra" = 195.16, "actualizadoEn" = NOW() WHERE codigo = '0700LM430001';

-- [0700LM432004] LM 432 Poliéster Verde Claro SW 900ml
UPDATE productos SET "precioCompra" = 41.1, "actualizadoEn" = NOW() WHERE codigo = '0700LM432004';

-- [0700LM433017] LM 433 Poliéster Verde Oscuro SW 900ml
UPDATE productos SET "precioCompra" = 48.54, "actualizadoEn" = NOW() WHERE codigo = '0700LM433017';

-- [0700LM437017] LM 437 Poliéster Violeta Rojizo SW 900ml
UPDATE productos SET "precioCompra" = 64.5, "actualizadoEn" = NOW() WHERE codigo = '0700LM437017';

-- [0700LM439017] LM 439 Poliéster Violeta SW 900ml
UPDATE productos SET "precioCompra" = 64.12, "actualizadoEn" = NOW() WHERE codigo = '0700LM439017';

-- [0700LM440017] LM 440 Poliéster Blanco Micronizado SW 900ml
UPDATE productos SET "precioCompra" = 109.21, "actualizadoEn" = NOW() WHERE codigo = '0700LM440017';

-- [0700LM441017] LM 441 Poliéster Negro Azulado SW 900ml
UPDATE productos SET "precioCompra" = 58.3, "actualizadoEn" = NOW() WHERE codigo = '0700LM441017';

-- [0700LM442027] LM 442 Poliéster Negro Profundo SW 3.6l
UPDATE productos SET "precioCompra" = 240.74, "actualizadoEn" = NOW() WHERE codigo = '0700LM442027';

-- [0700LM446074] LM 446 Poliéster Azul Océano SW 900ml
UPDATE productos SET "precioCompra" = 94.75, "actualizadoEn" = NOW() WHERE codigo = '0700LM446074';

-- [0700LM447027] LM 447 Poliéster Clear SW 3.6l
UPDATE productos SET "precioCompra" = 135.37, "actualizadoEn" = NOW() WHERE codigo = '0700LM447027';

-- [0700LM451001] LM 451 Poliéster Aluminio Medio SW 3.6l
UPDATE productos SET "precioCompra" = 158.27, "actualizadoEn" = NOW() WHERE codigo = '0700LM451001';

-- [0700LM453004] LM 453 Poliéster Aluminio Medio Grueso SW 900ml
UPDATE productos SET "precioCompra" = 52.42, "actualizadoEn" = NOW() WHERE codigo = '0700LM453004';

-- [0700LM454017] LM 454 Poliéster Aluminio Brillante SW 900ml
UPDATE productos SET "precioCompra" = 38.36, "actualizadoEn" = NOW() WHERE codigo = '0700LM454017';

-- [0700LM456001] LM 456 Poliéster Aluminio Grueso Brillante SW 3.6l
UPDATE productos SET "precioCompra" = 229.11, "actualizadoEn" = NOW() WHERE codigo = '0700LM456001';

-- [0700LM457017] LM 457 Poliéster Aluminio Súper Fino SW 900ml
UPDATE productos SET "precioCompra" = 41.1, "actualizadoEn" = NOW() WHERE codigo = '0700LM457017';

-- [0700LM460017] LM 460 Poliéster Gold SW 900ml
UPDATE productos SET "precioCompra" = 92.16, "actualizadoEn" = NOW() WHERE codigo = '0700LM460017';

-- [0700LM462027] LM 462 Poliéster Aluminio Medio Fino SW 3.6l
UPDATE productos SET "precioCompra" = 178.44, "actualizadoEn" = NOW() WHERE codigo = '0700LM462027';

-- [0700LM463017] LM 463 Poliéster Perla Roja Fina SW 900ml
UPDATE productos SET "precioCompra" = 92.06, "actualizadoEn" = NOW() WHERE codigo = '0700LM463017';

-- [0700LM464017] LM 464 Poliéster Perla Blanca Fina SW 900ml
UPDATE productos SET "precioCompra" = 107.64, "actualizadoEn" = NOW() WHERE codigo = '0700LM464017';

-- [0700LM465017] LM 465 Poliéster Perla Azul Fina SW 900ml
UPDATE productos SET "precioCompra" = 117.29, "actualizadoEn" = NOW() WHERE codigo = '0700LM465017';

-- [0700LM466017] LM 466 Poliéster Perla Roja Gruesa SW 900ml
UPDATE productos SET "precioCompra" = 101.19, "actualizadoEn" = NOW() WHERE codigo = '0700LM466017';

-- [0700LM467017] LM 467 Poliéster Perla Azul Gruesa SW 900ml
UPDATE productos SET "precioCompra" = 84.93, "actualizadoEn" = NOW() WHERE codigo = '0700LM467017';

-- [0700LM468017] LM 468 Poliéster Perla Plata Brillante SW 900ml
UPDATE productos SET "precioCompra" = 72.17, "actualizadoEn" = NOW() WHERE codigo = '0700LM468017';

-- [0700LM469017] LM 469 Poliéster Perla Dorada Media SW 900ml
UPDATE productos SET "precioCompra" = 113.42, "actualizadoEn" = NOW() WHERE codigo = '0700LM469017';

-- [0700LM470017] LM 470 Poliéster Perla Violeta SW 900ml
UPDATE productos SET "precioCompra" = 142.24, "actualizadoEn" = NOW() WHERE codigo = '0700LM470017';

-- [0700LM472017] LM 472 Poliéster Perla Violeta Gruesa SW 900ml
UPDATE productos SET "precioCompra" = 112.47, "actualizadoEn" = NOW() WHERE codigo = '0700LM472017';

-- [0700LM473017] LM 473 Poliéster Perla Verde SW 900ml
UPDATE productos SET "precioCompra" = 79.61, "actualizadoEn" = NOW() WHERE codigo = '0700LM473017';

-- [0700LM474017] LM 474 Poliéster Perla Violeta Azulada SW 900ml
UPDATE productos SET "precioCompra" = 76.35, "actualizadoEn" = NOW() WHERE codigo = '0700LM474017';

-- [0700LM475017] LM 475 Poliéster Perla Verde Azulada SW 900ml
UPDATE productos SET "precioCompra" = 103.39, "actualizadoEn" = NOW() WHERE codigo = '0700LM475017';

-- [0700LM476017] LM 476 Poliéster Perla Bronce SW 900ml
UPDATE productos SET "precioCompra" = 81.83, "actualizadoEn" = NOW() WHERE codigo = '0700LM476017';

-- [0700LM477017] LM 477 Poliéster Perla Rosa SW 900ml
UPDATE productos SET "precioCompra" = 73.42, "actualizadoEn" = NOW() WHERE codigo = '0700LM477017';

-- [0700LM478017] LM 478 Poliéster Perla Oro SW 900 ml
UPDATE productos SET "precioCompra" = 71.66, "actualizadoEn" = NOW() WHERE codigo = '0700LM478017';

-- [0700LM479017] LM 479 Poliéster Grafite SW 900ml
UPDATE productos SET "precioCompra" = 63.52, "actualizadoEn" = NOW() WHERE codigo = '0700LM479017';

-- [0700LM482471] LM 482 Poliéster Perla Cristal SW 240ml
UPDATE productos SET "precioCompra" = 52.02, "actualizadoEn" = NOW() WHERE codigo = '0700LM482471';

-- [0700LM483471] LM 483 Poliéster Perla Bronce Brillante SW 240ml
UPDATE productos SET "precioCompra" = 52.02, "actualizadoEn" = NOW() WHERE codigo = '0700LM483471';

-- [0700LM484471] LM 484 Poliéster Perla Dorada Brillante SW 240ml
UPDATE productos SET "precioCompra" = 52.09, "actualizadoEn" = NOW() WHERE codigo = '0700LM484471';

-- [0700LM485471] LM 485 Poliéster Perla Azul Galaxia SW 240ml
UPDATE productos SET "precioCompra" = 51.94, "actualizadoEn" = NOW() WHERE codigo = '0700LM485471';

-- [0700LM486471] LM 486 Poliéster Perla Rojo Radiante SW 240ml
UPDATE productos SET "precioCompra" = 52.17, "actualizadoEn" = NOW() WHERE codigo = '0700LM486471';

-- [0700LM487471] LM 487 Poliéster Perla Verde Estelar SW 240ml
UPDATE productos SET "precioCompra" = 52.17, "actualizadoEn" = NOW() WHERE codigo = '0700LM487471';

-- [0700LM491001] LM 491 Poliéster Aluminio Fino SW 3.6l
UPDATE productos SET "precioCompra" = 171.3, "actualizadoEn" = NOW() WHERE codigo = '0700LM491001';

-- [0700LM492001] LM 492 Poliéster Aluminio Medio Brillante SW 3.6l
UPDATE productos SET "precioCompra" = 222.43, "actualizadoEn" = NOW() WHERE codigo = '0700LM492001';

-- [0700LM493027] LM 493 Poliéster Aluminio Extra Grueso SW 3.6l
UPDATE productos SET "precioCompra" = 184.37, "actualizadoEn" = NOW() WHERE codigo = '0700LM493027';

-- [0720LM493] LM 493 Poliéster Aluminio Extra Grueso SW 900ml
UPDATE productos SET "precioCompra" = 46.84, "actualizadoEn" = NOW() WHERE codigo = '0720LM493';

-- [806591993537] Maquina Pulidora Fastline 7" 1200W SW
UPDATE productos SET "precioCompra" = 304.04, "actualizadoEn" = NOW() WHERE codigo = '806591993537';

-- [050000106498] Masa de Pulir Base Agua Nro. 2 SW 900ml
UPDATE productos SET "precioCompra" = 25.9, "actualizadoEn" = NOW() WHERE codigo = '050000106498';

-- [050000102389] Masa de Pulir Blanca Nro. 2 SW 900ml
UPDATE productos SET "precioCompra" = 21.33, "actualizadoEn" = NOW() WHERE codigo = '050000102389';

-- [050000101389] Masa de Pulir Crema Nro. 1 SW 900ml
UPDATE productos SET "precioCompra" = 17, "actualizadoEn" = NOW() WHERE codigo = '050000101389';

-- [013000031391] Masa Rápida Gris SW 900ml
UPDATE productos SET "precioCompra" = 24.08, "actualizadoEn" = NOW() WHERE codigo = '013000031391';

-- [05000M500496] Masilla para Plástico SW 400ml
UPDATE productos SET "precioCompra" = 29.32, "actualizadoEn" = NOW() WHERE codigo = '05000M500496';

-- [0500M3500327] Masilla Poliester  SW 750g
UPDATE productos SET "precioCompra" = 28.83, "actualizadoEn" = NOW() WHERE codigo = '0500M3500327';

-- [0500M3500328] Masilla Poliester SW 1.5 Kg
UPDATE productos SET "precioCompra" = 53.37, "actualizadoEn" = NOW() WHERE codigo = '0500M3500328';

-- [050000085127] Masking Líquido SW 5kg
UPDATE productos SET "precioCompra" = 40.97, "actualizadoEn" = NOW() WHERE codigo = '050000085127';

-- [SW-MPROM G] Material Promocional - Gorras
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'SW-MPROM G';

-- [SW-MPROM] Material Promocional - Poleras cuello redondo
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'SW-MPROM';

-- [050000049016] Negro Mate Vinílico SW 600ml
UPDATE productos SET "precioCompra" = 18.91, "actualizadoEn" = NOW() WHERE codigo = '050000049016';

-- [807989966] Paño de Microfibra 40X40 Kit 4 SW
UPDATE productos SET "precioCompra" = 4.79, "actualizadoEn" = NOW() WHERE codigo = '807989966';

-- [807989711] Paño Gomoso (polvos y pelusas) SW
UPDATE productos SET "precioCompra" = 4.79, "actualizadoEn" = NOW() WHERE codigo = '807989711';

-- [807988795] Papel Kraft en Rollo 45cm SW 2.5k
UPDATE productos SET "precioCompra" = 50.03, "actualizadoEn" = NOW() WHERE codigo = '807988795';

-- [807988796] Papel Kraft en Rollo 90cm SW 5k
UPDATE productos SET "precioCompra" = 90.18, "actualizadoEn" = NOW() WHERE codigo = '807988796';

-- [807988800] Plástico  p/Enmascaramiento SW
UPDATE productos SET "precioCompra" = 200.56, "actualizadoEn" = NOW() WHERE codigo = '807988800';

-- [05300P411004] Primer PU 2K P411 SW 900ml
UPDATE productos SET "precioCompra" = 32.82, "actualizadoEn" = NOW() WHERE codigo = '05300P411004';

-- [0530KP350276] Primer PU 5:1 KP350 SW 750ml
UPDATE productos SET "precioCompra" = 19.3, "actualizadoEn" = NOW() WHERE codigo = '0530KP350276';

-- [053000P51276] Primer PU HS P51 SW 750ml
UPDATE productos SET "precioCompra" = 25.46, "actualizadoEn" = NOW() WHERE codigo = '053000P51276';

-- [053000P81280] Primer PU HS P81 SW 800ml
UPDATE productos SET "precioCompra" = 24.33, "actualizadoEn" = NOW() WHERE codigo = '053000P81280';

-- [053000P41654] Primer PU Multifiller HS P41 SW 720ml
UPDATE productos SET "precioCompra" = 33.29, "actualizadoEn" = NOW() WHERE codigo = '053000P41654';

-- [05300P510276] Primer PU P510 SW 750ml
UPDATE productos SET "precioCompra" = 19.3, "actualizadoEn" = NOW() WHERE codigo = '05300P510276';

-- [050000020004] Primer Ultrafill Alto Sólido SW 900ml
UPDATE productos SET "precioCompra" = 24.56, "actualizadoEn" = NOW() WHERE codigo = '050000020004';

-- [050000018004] Primer Universal Gris SW 900ml
UPDATE productos SET "precioCompra" = 25.37, "actualizadoEn" = NOW() WHERE codigo = '050000018004';

-- [0500BP201417] Protector (Antigravilla) Blanco SW 900ml
UPDATE productos SET "precioCompra" = 43.65, "actualizadoEn" = NOW() WHERE codigo = '0500BP201417';

-- [0500BP200417] Protector (Antigravilla) Gris SW 900ml
UPDATE productos SET "precioCompra" = 46.88, "actualizadoEn" = NOW() WHERE codigo = '0500BP200417';

-- [0500BP202417] Protector (Antigravilla) Negro SW 900ml
UPDATE productos SET "precioCompra" = 46.8, "actualizadoEn" = NOW() WHERE codigo = '0500BP202417';

-- [807980376] Regla de Aluminio Tradicional SW
UPDATE productos SET "precioCompra" = 13.26, "actualizadoEn" = NOW() WHERE codigo = '807980376';

-- [807988808] Regla Mezcladora con Escala SW
UPDATE productos SET "precioCompra" = 4.63, "actualizadoEn" = NOW() WHERE codigo = '807988808';

-- [800087873] Solda Plástico Instantáneo SW
UPDATE productos SET "precioCompra" = 116.23, "actualizadoEn" = NOW() WHERE codigo = '800087873';

-- [809386360] Soporte Disco con scrach  8"  SW
UPDATE productos SET "precioCompra" = 90.76, "actualizadoEn" = NOW() WHERE codigo = '809386360';

-- [806788825] Soporte en Goma Eva p/Bonete Blanco 5" SW
UPDATE productos SET "precioCompra" = 26.01, "actualizadoEn" = NOW() WHERE codigo = '806788825';

-- [806788826] Soporte Goma Eva p/Bonete Blanco 8" SW
UPDATE productos SET "precioCompra" = 31.41, "actualizadoEn" = NOW() WHERE codigo = '806788826';

-- [806199971] Spray Engomado Amarillo Luminoso SW 400g
UPDATE productos SET "precioCompra" = 45.65, "actualizadoEn" = NOW() WHERE codigo = '806199971';

-- [806199973] Spray Engomado Blanco Mate SW 400g
UPDATE productos SET "precioCompra" = 39.59, "actualizadoEn" = NOW() WHERE codigo = '806199973';

-- [806199975] Spray Engomado Naranja Luminoso SW 400g
UPDATE productos SET "precioCompra" = 45.65, "actualizadoEn" = NOW() WHERE codigo = '806199975';

-- [806199977] Spray Engomado Negro Br. SW 400g
UPDATE productos SET "precioCompra" = 39.59, "actualizadoEn" = NOW() WHERE codigo = '806199977';

-- [806199978] Spray Engomado Negro Mate SW 400g
UPDATE productos SET "precioCompra" = 39.59, "actualizadoEn" = NOW() WHERE codigo = '806199978';

-- [806199979] Spray Engomado Verde Luminoso SW 400g
UPDATE productos SET "precioCompra" = 45.65, "actualizadoEn" = NOW() WHERE codigo = '806199979';

-- [807987880] Vaso Plástico Transp. de 220ml SW
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = '807987880';

-- [050000045016] Wash Primer Fondo SW 600ml
UPDATE productos SET "precioCompra" = 18.53, "actualizadoEn" = NOW() WHERE codigo = '050000045016';

-- [0500LF045004] Wash Primer Monocomponente SW 900ml
UPDATE productos SET "precioCompra" = 36.68, "actualizadoEn" = NOW() WHERE codigo = '0500LF045004';

-- [7010650.90] Anticorrosivo Cinza Medio Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '7010650.90';

-- [2012653.60] Anticorrosivo Naranja Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2012653.60';

-- [2012650.90] Anticorrosivo Naranja Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2012650.90';

-- [1009650.90] Gavilux Fondo Blanco para Galvanizado Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '1009650.90';

-- [100264.60] Massa Acrilica Premium Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '100264.60';

-- [100364.60] Massa Corrida Premium Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '100364.60';

-- [8001663.60] Sintelux Alto Brillo Aluminio Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '8001663.60';

-- [8001660.90] Sintelux Alto Brillo Aluminio Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '8001660.90';

-- [2002663.6] Sintelux Alto Brillo Amarelo Ouro Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2002663.6';

-- [2020660.90] Sintelux Alto Brillo Areia Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2020660.90';

-- [4001663.60] Sintelux Alto Brillo Azul Celeste Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '4001663.60';

-- [4001660.90] Sintelux Alto Brillo Azul Celeste Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '4001660.90';

-- [4009663.60] Sintelux Alto Brillo Azul del Rey Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '4009663.60';

-- [4009660.90] Sintelux Alto Brillo Azul del Rey Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '4009660.90';

-- [4002663.60] Sintelux Alto Brillo Azul Franca Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '4002663.60';

-- [4002660.90] Sintelux Alto Brillo Azul Franca Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '4002660.90';

-- [1002663.60] Sintelux Alto Brillo Blanco Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '1002663.60';

-- [2005663.60] Sintelux Alto Brillo Ceramica Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2005663.60';

-- [2005660.90] Sintelux Alto Brillo Ceramica Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2005660.90';

-- [7001660.90] Sintelux Alto Brillo Cinza Escuro Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '7001660.90';

-- [7005660.90] Sintelux Alto Brillo Cinza Media  Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '7005660.90';

-- [6003663.60] Sintelux Alto Brillo Colorado Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '6003663.60';

-- [6003660.90] Sintelux Alto Brillo Colorado Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '6003660.90';

-- [2001663.60] Sintelux Alto Brillo Creme Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2001663.60';

-- [2004660.90] Sintelux Alto Brillo Laranja Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2004660.90';

-- [2007660.90] Sintelux Alto Brillo Marfim Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2007660.90';

-- [2034663.60] Sintelux Alto Brillo Pessego/Durazno Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2034663.60';

-- [2034660.90] Sintelux Alto Brillo Pessego/Durazno Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '2034660.90';

-- [7003663.60] Sintelux Alto Brillo Preto Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '7003663.60';

-- [7006660.90] Sintelux Alto Brillo Preto Fosco Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '7006660.90';

-- [6004663.60] Sintelux Alto Brillo Tabaco Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '6004663.60';

-- [5004663.60] Sintelux Alto Brillo Verde Colonial Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '5004663.60';

-- [5004660.90] Sintelux Alto Brillo Verde Colonial Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '5004660.90';

-- [5002663.60] Sintelux Alto Brillo Verde Folha Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '5002663.60';

-- [5002660.90] Sintelux Alto Brillo Verde Folha Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '5002660.90';

-- [5001663.60] Sintelux Alto Brillo Verde Nilo Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '5001663.60';

-- [5001660.90] Sintelux Alto Brillo Verde Nilo Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '5001660.90';

-- [3002663.60] Sintelux Alto Brillo Vermelho Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '3002663.60';

-- [3002660.90] Sintelux Alto Brillo Vermelho Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '3002660.90';

-- [3001663.60] Sintelux Alto Brillo Vino Chasis Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '3001663.60';

-- [1001660.90] Sintelux Blanco Acetinado Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '1001660.90';

-- [402260.60] Tinta Acrilica Economica Oceano Fosco Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '402260.60';

-- [500160.60] Tinta Acrilica Economica Verde Limao Fosco Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '500160.60';

-- [206269.60] Tinta Acrilica Pinta + Super Amarelo Girassol Fosco Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '206269.60';

-- [402269.60] Tinta Acrilica Pinta + Super Oceano Fosco Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '402269.60';

-- [700368.60] Tinta Acrilica Piso Dura + Cinza Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '700368.60';

-- [100262.60] Tinta Acrilica Premiun Super Lavavel Acetinado Branco Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '100262.60';

-- [102662.60] Tinta Emborrachada Super Protecao Branco Fosco Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '102662.60';

-- [0001650.90] Verniz Duplo Filtro Solar Brillante Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '0001650.90';

-- [0012653.60] Verniz Duplo Filtro Solar Cedro Brz 3.6l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '0012653.60';

-- [0012650.90] Verniz Duplo Filtro Solar Cedro Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '0012650.90';

-- [0003650.90] Verniz Duplo Filtro Solar Imbuia Brillante Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '0003650.90';

-- [0002650.90] Verniz Duplo Filtro Solar Mogno Brillante Brz 900ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = '0002650.90';

-- [VAR-BEL] Balanza Electrónica Sartorius
UPDATE productos SET "precioCompra" = 1, "actualizadoEn" = NOW() WHERE codigo = 'VAR-BEL';

-- [VAR-CB10] Cople p/ Bonete de Pulir VR pieza
UPDATE productos SET "precioCompra" = 28, "actualizadoEn" = NOW() WHERE codigo = 'VAR-CB10';

-- [VAR-EP-INNO] Embudo de papel Filtro
UPDATE productos SET "precioCompra" = 0.18, "actualizadoEn" = NOW() WHERE codigo = 'VAR-EP-INNO';

-- [VAR-EP-01] Embudo de Papel Filtro VR pieza
UPDATE productos SET "precioCompra" = 0.18, "actualizadoEn" = NOW() WHERE codigo = 'VAR-EP-01';

-- [VAR-PG-01] Paño Gomoso Antiestático VR pieza
UPDATE productos SET "precioCompra" = 0.08, "actualizadoEn" = NOW() WHERE codigo = 'VAR-PG-01';

-- [VAR-TM10] Taco de Lijar Mediano VR pieza
UPDATE productos SET "precioCompra" = 28, "actualizadoEn" = NOW() WHERE codigo = 'VAR-TM10';

-- [VY-H2001] H2000 Soplete Mini de Gravedad Semi-profesional VL 0.5mm-125ml
UPDATE productos SET "precioCompra" = 184.48, "actualizadoEn" = NOW() WHERE codigo = 'VY-H2001';

-- [VY-KSG867] KSG867 Soplete de Baja Presión VL 1.3mm
UPDATE productos SET "precioCompra" = 56.61, "actualizadoEn" = NOW() WHERE codigo = 'VY-KSG867';

-- [VY-LS30] LS30 Soplete de Gravedad Profesional Premium VL 1.4mm-600ml
UPDATE productos SET "precioCompra" = 245.91, "actualizadoEn" = NOW() WHERE codigo = 'VY-LS30';

-- [VY-N125] N125 Soplete Mini de Gravedad Profesional VL 0.5mm-125ml
UPDATE productos SET "precioCompra" = 130.84, "actualizadoEn" = NOW() WHERE codigo = 'VY-N125';

-- [VY-N2001] N2001 Soplete de Gravedad Profesional VL 1.4mm-600ml
UPDATE productos SET "precioCompra" = 184.48, "actualizadoEn" = NOW() WHERE codigo = 'VY-N2001';

-- [C-YTNSS1] Catalogo Yatu Nissan #1
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'C-YTNSS1';

-- [C-YTNSS2] Catalogo Yatu Nissan #2
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'C-YTNSS2';

-- [C-YTTOY1] Catalogo Yatu Toyota #1
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'C-YTTOY1';

-- [C-YTTOY2] Catalogo Yatu Toyota #2
UPDATE productos SET "precioCompra" = 0, "actualizadoEn" = NOW() WHERE codigo = 'C-YTTOY2';

-- [ZY-M10] Abridor de metal ZY
UPDATE productos SET "precioCompra" = 2.1, "actualizadoEn" = NOW() WHERE codigo = 'ZY-M10';

-- [ZY-COMPLEMENTO] Air Sander Adaptor ZY
UPDATE productos SET "precioCompra" = 8.91, "actualizadoEn" = NOW() WHERE codigo = 'ZY-COMPLEMENTO';

-- [ZY-ES] Balanza electrónica ZY 7.5Kg
UPDATE productos SET "precioCompra" = 6504.01, "actualizadoEn" = NOW() WHERE codigo = 'ZY-ES';

-- [ZY-DFP-W] Bonete de Esponja ZY 19cm*7cm.8 Blanco
UPDATE productos SET "precioCompra" = 67.29, "actualizadoEn" = NOW() WHERE codigo = 'ZY-DFP-W';

-- [ZY-DFP] Bonete de Esponja ZY 19cm*7cm.8´´
UPDATE productos SET "precioCompra" = 67.29, "actualizadoEn" = NOW() WHERE codigo = 'ZY-DFP';

-- [ZY-WPD-8] Bonete de Lana Doble Cara ZY 8p
UPDATE productos SET "precioCompra" = 81.14, "actualizadoEn" = NOW() WHERE codigo = 'ZY-WPD-8';

-- [ZY-WPS-8] Bonete de Lana Una Cara Scrach ZY 8p
UPDATE productos SET "precioCompra" = 68.21, "actualizadoEn" = NOW() WHERE codigo = 'ZY-WPS-8';

-- [ZY-MT653-24MM] Cinta Masking  Amarillo de 80° ZY 24mm*50m
UPDATE productos SET "precioCompra" = 5.9, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT653-24MM';

-- [ZY-MT653-6MM] Cinta Masking Amarillo de 80° ZY 6mm*50m
UPDATE productos SET "precioCompra" = 1.51, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT653-6MM';

-- [ZY-MT653-12MM] Cinta Masking Amarillo de 80° ZY 12mm*50m
UPDATE productos SET "precioCompra" = 2.95, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT653-12MM';

-- [ZY-MT653-18MM] Cinta Masking Amarillo de 80° ZY 18mm*50m
UPDATE productos SET "precioCompra" = 4.43, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT653-18MM';

-- [ZY-MT529-6MM] Cinta Masking Amarillo de 120° ZY 6mm*50m
UPDATE productos SET "precioCompra" = 2.61, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT529-6MM';

-- [ZY-MT529-12MM] Cinta Masking Amarillo de 120° ZY 12mm*50m
UPDATE productos SET "precioCompra" = 5.16, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT529-12MM';

-- [ZY-MT529-18MM] Cinta Masking Amarillo de 120° ZY 18mm*50m
UPDATE productos SET "precioCompra" = 7.75, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT529-18MM';

-- [ZY-MT653-36MM] Cinta Masking Amarrillo de 80° ZY 36mm*50m
UPDATE productos SET "precioCompra" = 8.86, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT653-36MM';

-- [ZY-MT653-48MM] Cinta Masking Amarrillo de 80° ZY 48mm*50m
UPDATE productos SET "precioCompra" = 12.16, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MT653-48MM';

-- [ZY-107BW] Cinta Masking Blanca de 60° ZY 18mm*50m
UPDATE productos SET "precioCompra" = 4.28, "actualizadoEn" = NOW() WHERE codigo = 'ZY-107BW';

-- [ZY-MC13LD] Copo de Medida Vaso 1.3 L ZY
UPDATE productos SET "precioCompra" = 3.75, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MC13LD';

-- [ZY-MC24LD] Copo de Medida Vaso ZY 2.4l
UPDATE productos SET "precioCompra" = 6.34, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MC24LD';

-- [ZY-MC-06LD] Copo de Medida Vaso ZY 650ml
UPDATE productos SET "precioCompra" = 2.48, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MC-06LD';

-- [ZY-PBP-14-5] Disco de respaldo para Pulidora ZY M14-5
UPDATE productos SET "precioCompra" = 37.32, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PBP-14-5';

-- [ZY-PBP-14-6] Disco de respaldo para Pulidora ZY M14-6
UPDATE productos SET "precioCompra" = 42.1, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PBP-14-6';

-- [ZY-PBP-14-7] Disco de respaldo para Pulidora ZY M14-7
UPDATE productos SET "precioCompra" = 34.13, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PBP-14-7';

-- [ZY-SWF-P60] Disco Flap P60 ZY
UPDATE productos SET "precioCompra" = 4.87, "actualizadoEn" = NOW() WHERE codigo = 'ZY-SWF-P60';

-- [ZY-SWF-P80] Disco Flap P80 ZY
UPDATE productos SET "precioCompra" = 4.77, "actualizadoEn" = NOW() WHERE codigo = 'ZY-SWF-P80';

-- [ZY-CSD] Disco Stript morado 115*22mm ZY
UPDATE productos SET "precioCompra" = 15.97, "actualizadoEn" = NOW() WHERE codigo = 'ZY-CSD';

-- [ZY-PML-L] Dosador de pintura ZY 1L
UPDATE productos SET "precioCompra" = 33.49, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PML-L';

-- [ZY-PML-S] Dosador de pintura ZY 4L
UPDATE productos SET "precioCompra" = 57.96, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PML-S';

-- [ZY-SC-O] Espátula de Goma ZY Naranja
UPDATE productos SET "precioCompra" = 6.62, "actualizadoEn" = NOW() WHERE codigo = 'ZY-SC-O';

-- [ZY-SC-T] Espátula de Goma ZY Trapezia Negro
UPDATE productos SET "precioCompra" = 6.07, "actualizadoEn" = NOW() WHERE codigo = 'ZY-SC-T';

-- [ZY-MS-SS] Espatula de Metal ZY
UPDATE productos SET "precioCompra" = 16.91, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MS-SS';

-- [ZY-ESPATULA] Espátula de Plástico Juego ZY 3pz
UPDATE productos SET "precioCompra" = 5.54, "actualizadoEn" = NOW() WHERE codigo = 'ZY-ESPATULA';

-- [ZY-PS1819] Filtro de Papel ZY 180g - 190 micrones
UPDATE productos SET "precioCompra" = 0.23, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PS1819';

-- [ZY-GSGF] Filtro para Soplete de Gravedad ZY
UPDATE productos SET "precioCompra" = 0.76, "actualizadoEn" = NOW() WHERE codigo = 'ZY-GSGF';

-- [ZY-NG-B] Guantes de Nitrilo ZY
UPDATE productos SET "precioCompra" = 0.71, "actualizadoEn" = NOW() WHERE codigo = 'ZY-NG-B';

-- [ZY-IPH-6] Interfaz de 6 pulgadas con scrach ZY
UPDATE productos SET "precioCompra" = 14.68, "actualizadoEn" = NOW() WHERE codigo = 'ZY-IPH-6';

-- [ZY-MS-SOC] Laminas de prueba de metal ZY 150*50mm
UPDATE productos SET "precioCompra" = 1.89, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MS-SOC';

-- [ZY-320-P80] Lija al agua Azul P80 ZY
UPDATE productos SET "precioCompra" = 1.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P80';

-- [ZY-320-P220] Lija al agua Azul P220 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P220';

-- [ZY-320-P320] Lija al agua Azul P320 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P320';

-- [ZY-320-P360] Lija al agua Azul P360 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P360';

-- [ZY-320-P400] Lija al agua Azul P400 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P400';

-- [ZY-320-P600] Lija al agua Azul P600 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P600';

-- [ZY-320-P1000] Lija al agua Azul P1000 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P1000';

-- [ZY-320-P1500] Lija al agua Azul P1500 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P1500';

-- [ZY-320-P2000] Lija al agua Azul P2000 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P2000';

-- [ZY-320-P3000] Lija al agua Azul P3000 ZY
UPDATE productos SET "precioCompra" = 1.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-320-P3000';

-- [ZY-638-P80] Lija en disco P80 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.72, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P80';

-- [ZY-638-P150] Lija en disco P150 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P150';

-- [ZY-638-P180] Lija en disco P180 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P180';

-- [ZY-638-P220] Lija en disco P220 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P220';

-- [ZY-638-P320] Lija en disco P320 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P320';

-- [ZY-638-P400] Lija en disco P400 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P400';

-- [ZY-638-P600] Lija en disco P600 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P600';

-- [ZY-638-P800] Lija en disco P800 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P800';

-- [ZY-638-P1000] Lija en disco P1000 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P1000';

-- [ZY-638-P2000] Lija en disco P2000 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P2000';

-- [ZY-638-P1500] Lija en disco P 1500 6 pulgadas multiperforadora ZY
UPDATE productos SET "precioCompra" = 2.55, "actualizadoEn" = NOW() WHERE codigo = 'ZY-638-P1500';

-- [ZY-739-P1000] Lija en disco trizact P1000 ZY
UPDATE productos SET "precioCompra" = 18.67, "actualizadoEn" = NOW() WHERE codigo = 'ZY-739-P1000';

-- [ZY-739-P2000] Lija en disco trizact P2000 ZY
UPDATE productos SET "precioCompra" = 18.67, "actualizadoEn" = NOW() WHERE codigo = 'ZY-739-P2000';

-- [ZY-739-P3000] Lija en disco trizact P3000 ZY
UPDATE productos SET "precioCompra" = 18.67, "actualizadoEn" = NOW() WHERE codigo = 'ZY-739-P3000';

-- [ZY-739-P4000] Lija en disco trizact P4000 ZY
UPDATE productos SET "precioCompra" = 18.67, "actualizadoEn" = NOW() WHERE codigo = 'ZY-739-P4000';

-- [ZY-QPD-S6] Lijadora  Roto Orbital PRO ZY 6 Huecos
UPDATE productos SET "precioCompra" = 261.25, "actualizadoEn" = NOW() WHERE codigo = 'ZY-QPD-S6';

-- [ZY-KWAIT] Lijadora Roto Orbital Neumático ZY
UPDATE productos SET "precioCompra" = 157.97, "actualizadoEn" = NOW() WHERE codigo = 'ZY-KWAIT';

-- [ZY-QPD-S17] Lijadora Roto Orbital PRO ZY 17 Huecos
UPDATE productos SET "precioCompra" = 475.61, "actualizadoEn" = NOW() WHERE codigo = 'ZY-QPD-S17';

-- [ZY-PD-6] Lijadora Roto Orbital ZY 6 Huecos
UPDATE productos SET "precioCompra" = 183.01, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PD-6';

-- [ZY-SGKY] Llavero de soplete de Metal ZY
UPDATE productos SET "precioCompra" = 4.2, "actualizadoEn" = NOW() WHERE codigo = 'ZY-SGKY';

-- [ZY-MF-110A] Masking Film Azul ZY 110cm*30cm
UPDATE productos SET "precioCompra" = 11.06, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MF-110A';

-- [ZY-MF-110V] Masking Film Verde ZY 110cm*30cm
UPDATE productos SET "precioCompra" = 11.06, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MF-110V';

-- [ZY-MF-38] Masking Film ZY 3.8m*100m
UPDATE productos SET "precioCompra" = 102.26, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MF-38';

-- [ZY-MF-055] Masking Film ZY 55cm*30m
UPDATE productos SET "precioCompra" = 7.86, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MF-055';

-- [ZY-MF-110] Masking Film ZY 110cm*30m
UPDATE productos SET "precioCompra" = 10.17, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MF-110';

-- [ZY-MF-140] Masking Film ZY 140cm*30m
UPDATE productos SET "precioCompra" = 12.88, "actualizadoEn" = NOW() WHERE codigo = 'ZY-MF-140';

-- [ZY-TM-179F] Molde de Pintar para muestras ZY
UPDATE productos SET "precioCompra" = 13.32, "actualizadoEn" = NOW() WHERE codigo = 'ZY-TM-179F';

-- [ZY-SP-6] Pad para Roto Orbital de 6" ZY
UPDATE productos SET "precioCompra" = 25.74, "actualizadoEn" = NOW() WHERE codigo = 'ZY-SP-6';

-- [ZY-CWT] Paño de Microfibra ZY 40*40cm
UPDATE productos SET "precioCompra" = 6.3, "actualizadoEn" = NOW() WHERE codigo = 'ZY-CWT';

-- [ZY-TCWAV] Paño gomoso amarillo 80cm*90cm ZY
UPDATE productos SET "precioCompra" = 5.87, "actualizadoEn" = NOW() WHERE codigo = 'ZY-TCWAV';

-- [ZY-P-KMP4] Papel Kraft con Masking ZY 45cm*200m
UPDATE productos SET "precioCompra" = 17.78, "actualizadoEn" = NOW() WHERE codigo = 'ZY-P-KMP4';

-- [ZY-P-KMP6] Papel Kraft con Masking ZY 60cm*200m
UPDATE productos SET "precioCompra" = 20.99, "actualizadoEn" = NOW() WHERE codigo = 'ZY-P-KMP6';

-- [ZY-PK-18] Papel Kraft ZY 45cm*200m
UPDATE productos SET "precioCompra" = 88.74, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PK-18';

-- [ZY-PK-24] Papel Kraft ZY 60cm*200m
UPDATE productos SET "precioCompra" = 118.49, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PK-24';

-- [ZY-PK-36] Papel Kraft ZY 90cm*200m
UPDATE productos SET "precioCompra" = 253.16, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PK-36';

-- [ZY-DC5-1] Protector Desechable Set 5 en 1 ZY
UPDATE productos SET "precioCompra" = 2.34, "actualizadoEn" = NOW() WHERE codigo = 'ZY-DC5-1';

-- [ZY-SG-9108] Pulidor (Maquina) ZY 600 - 3000r/min
UPDATE productos SET "precioCompra" = 380.56, "actualizadoEn" = NOW() WHERE codigo = 'ZY-SG-9108';

-- [ZY-APS] Regla de Aluminio ZY
UPDATE productos SET "precioCompra" = 10.82, "actualizadoEn" = NOW() WHERE codigo = 'ZY-APS';

-- [ZY-AF-RST] Respirador (Mascara de Pintar) ZY
UPDATE productos SET "precioCompra" = 119.5, "actualizadoEn" = NOW() WHERE codigo = 'ZY-AF-RST';

-- [ZY-LB-09] Soplete de Alta Viscosidad (Antigravilla) ZY
UPDATE productos SET "precioCompra" = 52.4, "actualizadoEn" = NOW() WHERE codigo = 'ZY-LB-09';

-- [ZY-YHSB-M6] Taco de Lijar con scratch 6 pulgadas ZY
UPDATE productos SET "precioCompra" = 26.52, "actualizadoEn" = NOW() WHERE codigo = 'ZY-YHSB-M6';

-- [ZY-YHSB-40] Taco de Lijar con scratch 67cm*400cm ZY
UPDATE productos SET "precioCompra" = 88.21, "actualizadoEn" = NOW() WHERE codigo = 'ZY-YHSB-40';

-- [ZY-YHSB-70] Taco de Lijar con scratch 70cm*198cm ZY
UPDATE productos SET "precioCompra" = 52.28, "actualizadoEn" = NOW() WHERE codigo = 'ZY-YHSB-70';

-- [ZY-DHSB-125] Taco de Lijar con scratch (succion de polvo) 125cm*70cm ZY
UPDATE productos SET "precioCompra" = 62.46, "actualizadoEn" = NOW() WHERE codigo = 'ZY-DHSB-125';

-- [ZY-DHSB-200] Taco de Lijar con scratch (succion de polvo) 200cm*70cm ZY
UPDATE productos SET "precioCompra" = 68.13, "actualizadoEn" = NOW() WHERE codigo = 'ZY-DHSB-200';

-- [ZY-DHSB-230] Taco de Lijar con scratch (succion de polvo) 230cm*115cm ZY
UPDATE productos SET "precioCompra" = 81.78, "actualizadoEn" = NOW() WHERE codigo = 'ZY-DHSB-230';

-- [ZY-DHSB-400] Taco de Lijar con scratch (succion de polvo) 400cm*70cm ZY
UPDATE productos SET "precioCompra" = 103.42, "actualizadoEn" = NOW() WHERE codigo = 'ZY-DHSB-400';

-- [ZY-TPMC-13] Tapa p/Copo de Medida ZY 1.3 L
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'ZY-TPMC-13';

-- [ZY-TPMC-24] Tapa p/Copo de Medida ZY 2.4l
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'ZY-TPMC-24';

-- [ZY-TPMC-06] Tapa p/Copo de Medida ZY 650ml
UPDATE productos SET "precioCompra" = 0.01, "actualizadoEn" = NOW() WHERE codigo = 'ZY-TPMC-06';

-- [ZY-PMC-10] Vaso para Pintura Caja  ZY 1l
UPDATE productos SET "precioCompra" = 1.26, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PMC-10';

-- [ZY-PMC-02] Vaso para Pintura Caja ZY 0.2l
UPDATE productos SET "precioCompra" = 0.61, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PMC-02';

-- [ZY-PMC-03] Vaso para Pintura Caja ZY 0.3l
UPDATE productos SET "precioCompra" = 0.5, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PMC-03';

-- [ZY-PMC-05] Vaso para Pintura Caja ZY 0.5l
UPDATE productos SET "precioCompra" = 0.79, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PMC-05';

-- [ZY-PMC-20] Vaso para Pintura Caja ZY 2l
UPDATE productos SET "precioCompra" = 2.48, "actualizadoEn" = NOW() WHERE codigo = 'ZY-PMC-20';

-- =================================================================
-- ACTUALIZACIÓN DE LOTES HISTÓRICOS / INVENTARIO INICIAL (PEPS / FIFO)
-- =================================================================
UPDATE lotes l 
SET "costoUnitario" = p."precioCompra",
    "actualizadoEn" = NOW()
FROM productos p 
WHERE l."productoId" = p.id 
  AND (l."costoUnitario" IS NULL OR l."costoUnitario" = 0)
  AND p."precioCompra" > 0;

-- VERIFICACIÓN FINAL: PRODUCTOS
SELECT 
    COUNT(*) as total_productos,
    COUNT(CASE WHEN "precioCompra" > 0 THEN 1 END) as con_precio_compra,
    COUNT(CASE WHEN "precioCompra" = 0 THEN 1 END) as con_precio_cero,
    MIN("precioCompra") as costo_minimo,
    MAX("precioCompra") as costo_maximo,
    ROUND(AVG("precioCompra"), 2) as costo_promedio
FROM productos;

-- VERIFICACIÓN FINAL: LOTES (COSTO UNITARIO PEPS)
SELECT 
    COUNT(*) as total_lotes,
    COUNT(CASE WHEN "costoUnitario" > 0 THEN 1 END) as lotes_con_costo,
    COUNT(CASE WHEN "costoUnitario" = 0 OR "costoUnitario" IS NULL THEN 1 END) as lotes_sin_costo
FROM lotes;

COMMIT;

