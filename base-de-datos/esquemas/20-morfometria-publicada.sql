-- ==================================================================
-- PARCHE 20: Base morfométrica publicada (2026-11)
-- GENERADO por base-de-datos/herramientas/gen20_morfometria.py desde
-- documentacion/24-11-26 Parametros morfometricos caprinos APP.xlsx.
-- No editar a mano: corregir el Excel y volver a generar.
--
-- 1. MORFO_FUENTE        : bibliografía (S01…S20).
-- 2. MORFO_PERFIL(_VALOR): medias publicadas por raza, sexo y edad con
--                          n, país, tipo de dato, dispersión (DE o EE),
--                          mínimos y máximos. Solo consulta: no califican.
-- 3. MORFO_ESTANDAR      : estándares de asociaciones (ADGA, ANGBA) y la
--                          escala CAPRIGRAN de la Murciano-Granadina.
-- 4. CLASIF_MEDIDA_CAT   : definición técnica (FAO 2012), advertencia y
--                          código de cada medida.
-- 5. RAZA_MEDIDA_REF     : las razas con medias publicadas por sexo
--                          (media ± DE, no preliminares) reemplazan los
--                          valores iniciales aproximados. NO pisa los
--                          valores que el docente ya cambió a mano.
--
-- Ejecutar como caprino_user. Es idempotente.
-- ==================================================================

SET DEFINE OFF;

DECLARE
    PROCEDURE ddl(p VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p;
    EXCEPTION WHEN OTHERS THEN
        IF SQLCODE IN (-955, -1430, -2260, -2261, -2275, -1442) THEN NULL; ELSE RAISE; END IF;
    END;
BEGIN
    ddl(q'[CREATE TABLE MORFO_FUENTE (
            codigo       VARCHAR2(5) PRIMARY KEY,
            referencia   VARCHAR2(600) NOT NULL,
            verificacion VARCHAR2(200),
            url          VARCHAR2(300)
        )]');
    ddl(q'[CREATE TABLE MORFO_PERFIL (
            id_perfil      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            clave          VARCHAR2(10) NOT NULL UNIQUE,
            raza           VARCHAR2(60) NOT NULL,
            sexo           VARCHAR2(6) NOT NULL CHECK (sexo IN ('HEMBRA','MACHO','AMBOS')),
            etapa          VARCHAR2(40),
            edad_meses     NUMBER(6,2),
            edad_publicada VARCHAR2(80),
            edad_min       NUMBER(6,2),
            edad_max       NUMBER(6,2),
            n              NUMBER,
            pais           VARCHAR2(80),
            tipo_dato      VARCHAR2(40),
            preliminar     CHAR(1) DEFAULT 'N' NOT NULL CHECK (preliminar IN ('S','N')),
            observaciones  VARCHAR2(500),
            verificacion   VARCHAR2(200),
            fuente         VARCHAR2(5) REFERENCES MORFO_FUENTE(codigo),
            localizacion   VARCHAR2(80),
            orden          NUMBER
        )]');
    ddl(q'[CREATE TABLE MORFO_PERFIL_VALOR (
            id_perfil       NUMBER NOT NULL REFERENCES MORFO_PERFIL(id_perfil) ON DELETE CASCADE,
            codigo_medida   VARCHAR2(20) NOT NULL,
            media           NUMBER(8,3) NOT NULL,
            dispersion      NUMBER(8,3),
            tipo_dispersion VARCHAR2(15),
            minimo          NUMBER(8,2),
            maximo          NUMBER(8,2),
            CONSTRAINT pk_morfo_perfil_valor PRIMARY KEY (id_perfil, codigo_medida)
        )]');
    ddl(q'[CREATE TABLE MORFO_ESTANDAR (
            id_estandar   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            raza          VARCHAR2(60) NOT NULL,
            sexo          VARCHAR2(6) NOT NULL CHECK (sexo IN ('HEMBRA','MACHO','AMBOS')),
            grupo         VARCHAR2(80),
            codigo_medida VARCHAR2(20) NOT NULL,
            tipo          VARCHAR2(60),
            minimo        NUMBER(8,2),
            maximo        NUMBER(8,2),
            optimo        NUMBER(8,2),
            observaciones VARCHAR2(400),
            fuente        VARCHAR2(5) REFERENCES MORFO_FUENTE(codigo),
            orden         NUMBER
        )]');
    ddl('ALTER TABLE CLASIF_MEDIDA_CAT ADD (codigo_ref VARCHAR2(5), definicion_tecnica VARCHAR2(400), advertencia VARCHAR2(300), fuente_metodo VARCHAR2(40))');
    ddl('ALTER TABLE RAZA_MEDIDA_REF MODIFY (fuente VARCHAR2(400))');
END;
/

COMMENT ON TABLE MORFO_PERFIL IS 'Medias morfométricas publicadas por raza, sexo y edad (consulta; no califican animales)';
COMMENT ON TABLE MORFO_ESTANDAR IS 'Estándares de asociaciones y escalas publicadas; no son medias ni límites biológicos';

-- Se recargan completas desde el Excel
DELETE FROM MORFO_PERFIL_VALOR;
DELETE FROM MORFO_PERFIL;
DELETE FROM MORFO_ESTANDAR;
DELETE FROM MORFO_FUENTE;

-- ------------------------------------------------------------------
-- 1. Bibliografía
-- ------------------------------------------------------------------
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S01', 'Salamanca-Carreño et al. (2026). Sexual dimorphism in the growth and morphometric allometry of the Santandereana Creole goat breed in Colombia. Veterinary Sciences, 13(5), 501.', 'Artículo; PubMed', 'https://doi.org/10.3390/vetsci13050501');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S02', 'Torres Ruda (2025). Estimación del potencial productivo de la cabra Santandereana a partir de mediciones morfométricas e índices corporales. Spei Domus.', 'Versión consultada: preprint; indexación no confirmada', 'https://doi.org/10.16925/2382-4247.2025.02.05');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S03', 'Yousuf, F. E., Apu, A. S., Talukder, K. U., Ali, M. Y., & Husain, S. S. (2020). Adaptation and morphometric characterization of Boer goat in Bangladesh. Journal of Bangladesh Agricultural University, 18(2), 428–434.', 'Artículo; indexación por verificar', 'https://doi.org/10.5455/JBAU.98621');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S04', 'Panayotov, D. (2022). Body weight, morphometric measurements and number of teats of Boer goat does, reared in Bulgaria. Bulgarian Journal of Agricultural Science, 28(2), 331–342.', 'Artículo; indexación por verificar', 'https://www.agrojournal.org/28/02-20.pdf');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S05', 'Fonseca et al. (2021). Correlations between body measures with live weight in young male goats. Acta Scientiarum. Animal Sciences, 43.', 'Artículo; SciELO', 'https://doi.org/10.4025/actascianimsci.v43i1.52881');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S06', 'Abd-Allah et al. (2019). Some body measurements as a management tool for Shami goats raised in subtropical areas in Egypt. Bulletin of the National Research Centre, 43.', 'Artículo; cotejo adicional de tabla pendiente', 'https://doi.org/10.1186/s42269-019-0042-9');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S07', 'Neri et al. (2018). Phenotypic diversity and carcass quality of creole goats with genetic potential for resistance to infection caused by worm. Pesquisa Agropecuária Brasileira, 53(7), 849–857.', 'Artículo; SciELO', 'https://doi.org/10.1590/S0100-204X2018000700009');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S08', 'Ford Jr., Okere & Bolden-Tiller (2009). Libido test scores, body conformation and testicular traits in Boer and Kiko goat bucks. ARPN Journal of Agricultural and Biological Science, 4(5), 54–61.', 'Artículo; indexación no confirmada', 'https://www.arpnjournals.com/jabs/research_papers/rp_2009/jabs_0909_155.pdf');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S09', 'Browning & Leite-Browning (2011). Birth to weaning kid traits from a complete diallel of Boer, Kiko, and Spanish meat goat breeds semi-intensively managed on humid subtropical pasture. Journal of Animal Science, 89(9), 2696–2707.', 'Artículo; revista indexada', 'https://academic.oup.com/jas/article/89/9/2696/4771628');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S10', 'Khanal, Leite-Browning & Browning (2019). Influence of crossbreeding on meat goat doe fitness when comparing Boer F1 with base breeds in the Southeastern United States. Journal of Animal Science, 97(1), 78–89.', 'Artículo; revista indexada', 'https://doi.org/10.1093/jas/sky421');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S11', 'Mokhtari et al. (2024). Early growth performance in the Murciano-Granadina goats: insights from genetic and phenotypic analyses. The Journal of Agricultural Science, 162, 165–172.', 'Artículo; revista indexada', 'https://doi.org/10.1017/S002185962400025X');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S12', 'Fernández Álvarez et al. (2020). Optimization and validation of a linear appraisal scoring system for milk production-linked zoometric traits in Murciano-Granadina dairy goats and bucks. Applied Sciences, 10(16), 5502.', 'Artículo; modelo de calificación', 'https://doi.org/10.3390/app10165502');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S13', 'Fernández Álvarez et al. (2023). Analysis of the genetic parameters for dairy linear appraisal and zoometric traits: A tool to enhance the applicability of Murciano-Granadina goats major areas evaluation system. Animals, 13(6), 1114.', 'Artículo; modelo de calificación', 'https://doi.org/10.3390/ani13061114');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S14', 'American Dairy Goat Association (ADGA). Breed standards.', 'Estándar técnico; no artículo indexado', 'https://adga.org/breed-standards/');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S15', 'American Nigora Goat Breeders Association (ANGBA). American Nigora breed standard (2024).', 'Estándar técnico; no artículo indexado', 'https://www.angba.org/read.php?content=2024010101');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S16', 'Rojo-Rubio et al. (2016). Lactation curves and body weight changes of Alpine, Saanen and Anglo-Nubian goats as well as pre-weaning growth of their kids. Journal of Applied Animal Research, 44, 331–337.', 'Artículo; revista indexada', 'https://doi.org/10.1080/09712119.2015.1031790');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S17', 'FAO (2012). Phenotypic characterization of animal genetic resources. FAO Animal Production and Health Guidelines No. 11.', 'Manual técnico', 'https://www.fao.org/4/i2686e/i2686e00.htm');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S18', 'Ferreira et al. (2013). Morphological traits and type of dairy goats registered in Brazil from 1976 to 2009. Revista Brasileira de Zootecnia, 42(12).', 'Artículo; SciELO', 'https://doi.org/10.1590/S1516-35982013001200004');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S19', 'ICAR. Standard trait definition for dairy goats. Conformation recording, Appendix 4.', 'Protocolo técnico', 'https://www.icar.org/Guidelines/05-Conformation-recording-Appendix-4.pdf');
INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ('S20', 'Luo, Wiggans & Hubbard (1997). Variance component estimation and multitrait genetic evaluation for type traits of dairy goats. Journal of Dairy Science, 80(3), 594–600.', 'Artículo; clasificación lineal, no medidas en cm', 'https://doi.org/10.3168/JDS.S0022-0302(97)75975-7');

-- ------------------------------------------------------------------
-- 2. Perfiles publicados y sus valores
-- ------------------------------------------------------------------
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P01', 'Alpina', 'HEMBRA', 'Agrupada / no exacta', NULL, 'Lactación; edad no desagregada', NULL, NULL, 15, 'México', 'Media observada', 'N', 'Peso de hembras en lactación; no equivale a estándar racial.', 'Artículo; revista indexada', 'S16', 'Tabla 4', 1);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 47.311, 0.716, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P01';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P02', 'Alpina', 'AMBOS', 'Agrupada / no exacta', NULL, '12–48 meses', 12, 48, 19, 'Brasil', 'Media observada', 'N', 'Sexo no desagregado; no asignar a machos ni hembras.', 'Artículo; SciELO', 'S07', 'Tabla de morfometría', 2);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 65.81, 4.65, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P02';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 67.05, 3.73, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P02';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 76.1, 5.27, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P02';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 64.78, 7.87, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P02';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 37.25, 9.74, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P02';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P03', 'Alpina', 'AMBOS', 'Agrupada / no exacta', NULL, '90 días', NULL, NULL, 20, 'México', 'Media observada', 'N', 'Sexos agrupados; edad en días, no imputar por sexo.', 'Artículo; revista indexada', 'S16', 'Tabla 5', 3);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 18.87, 0.396, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P03';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P04', 'Anglonubiana', 'HEMBRA', 'Agrupada / no exacta', NULL, 'Lactación; edad no desagregada', NULL, NULL, 8, 'México', 'Media observada', 'N', 'Peso de hembras en lactación; no equivale a estándar racial.', 'Artículo; revista indexada', 'S16', 'Tabla 4', 4);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 47.56, 0.623, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P04';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P05', 'Anglonubiana', 'AMBOS', 'Agrupada / no exacta', NULL, '12–48 meses', 12, 48, 13, 'Brasil', 'Media observada', 'N', 'Sexo no desagregado; no asignar a machos ni hembras.', 'Artículo; SciELO', 'S07', 'Tabla de morfometría', 5);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 67.46, 5.23, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P05';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 68.08, 4.85, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P05';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 74.92, 6.4, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P05';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 64.08, 6.8, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P05';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 34.44, 5.68, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P05';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P06', 'Anglonubiana', 'AMBOS', 'Agrupada / no exacta', NULL, '90 días', NULL, NULL, 13, 'México', 'Media observada', 'N', 'Sexos agrupados; edad en días, no imputar por sexo.', 'Artículo; revista indexada', 'S16', 'Tabla 5', 6);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 19.09, 0.511, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P06';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P07', 'Boer', 'HEMBRA', 'Nacimiento', 0, '0 meses', 0, 0, 16, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 4; peso: figura 1', 7);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 26.22, 0.82, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P07';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 21.44, 0.78, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P07';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 29.48, 0.5, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P07';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 2.29, 0.09, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P07';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P08', 'Boer', 'HEMBRA', 'Cría', 3, '3 meses', 3, 3, 14, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 4; peso: figura 1', 8);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 45.04, 0.29, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P08';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 44.88, 0.79, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P08';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 45.76, 0.38, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P08';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P09', 'Boer', 'HEMBRA', 'Cabretón', 6, '6 meses', 6, 6, 12, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 4; peso: figura 1', 9);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 50.98, 0.83, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P09';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 59.57, 1.13, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P09';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 50.42, 1.22, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P09';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 24.33, 0.97, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P09';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P10', 'Boer', 'HEMBRA', 'Cabretón', 9, '9 meses', 9, 9, 12, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 4; peso: figura 1', 10);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 55.21, 1.06, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P10';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 64.66, 1.18, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P10';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 59.79, 1.28, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P10';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P11', 'Boer', 'HEMBRA', 'Joven', 12, '12 meses', 12, 12, 11, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 4; peso: figura 1', 11);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 56.98, 0.96, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P11';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 75.83, 1.43, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P11';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 61.99, 1.21, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P11';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 32.78, 1.29, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P11';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P12', 'Boer', 'HEMBRA', 'Joven', 18, '18 meses', 18, 18, 27, 'Bulgaria; origen Austria', 'Media observada', 'N', 'Cohorte diferenciada por procedencia; no mezclar con otros grupos.', 'Artículo; indexación por verificar', 'S04', 'Tabla 1', 12);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 65.63, 0.562, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 63.04, 0.505, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 79, 0.973, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 82.74, 1.051, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 26.96, 0.299, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_PECHO', 17.89, 0.51, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 15.41, 0.209, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 22.96, 0.223, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 10.19, 0.16, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 44.7, 1.416, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P12';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P13', 'Boer', 'HEMBRA', 'Joven', 18, '18 meses', 18, 18, 20, 'Bulgaria; origen Alemania', 'Media observada', 'N', 'Cohorte diferenciada por procedencia; no mezclar con otros grupos.', 'Artículo; indexación por verificar', 'S04', 'Tabla 1', 13);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 63.65, 0.734, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 61.95, 0.816, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 80.2, 1.128, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 81.45, 1.219, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 26, 0.562, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_PECHO', 18.35, 0.425, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 15.65, 0.233, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 23.05, 0.394, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 10.45, 0.135, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 45.1, 1.52, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P13';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P14', 'Boer', 'HEMBRA', 'Joven', 18, '18 meses', 18, 18, 14, 'Bulgaria; origen Bulgaria', 'Media observada', 'N', 'Cohorte diferenciada por procedencia; no mezclar con otros grupos.', 'Artículo; indexación por verificar', 'S04', 'Tabla 1', 14);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 64.21, 0.556, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 62.5, 0.532, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 82, 1.016, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 83, 1.69, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 25.93, 0.963, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_PECHO', 20.14, 0.864, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 15.71, 0.496, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 23.29, 0.549, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 10.57, 0.251, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 47.46, 2.004, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P14';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P15', 'Boer', 'HEMBRA', 'Adulto de referencia', 30, '30 meses', 30, 30, 19, 'Bulgaria; origen Austria', 'Media observada', 'N', 'Cohorte diferenciada por procedencia; no mezclar con otros grupos.', 'Artículo; indexación por verificar', 'S04', 'Tabla 1', 15);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 68.26, 0.844, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 67.21, 0.833, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 87.11, 1.447, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 91.68, 1.875, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 30.47, 0.584, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_PECHO', 21.32, 0.73, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 17.26, 0.489, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 25.11, 0.477, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 11.05, 0.235, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 64.58, 3.363, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P15';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P16', 'Boer', 'HEMBRA', 'Adulto de referencia', 30, '30 meses', 30, 30, 10, 'Bulgaria; origen Alemania', 'Media observada', 'N', 'Cohorte diferenciada por procedencia; no mezclar con otros grupos.', 'Artículo; indexación por verificar', 'S04', 'Tabla 1', 16);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 65.3, 0.633, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 65.2, 0.696, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 83.4, 1.833, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 87.6, 1.881, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 28.5, 0.734, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_PECHO', 20.7, 0.932, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 15.7, 0.761, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 25.1, 0.657, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 11, 0.211, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 57.1, 3.304, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P16';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P17', 'Boer', 'HEMBRA', 'Agrupada / no exacta', NULL, 'Al apareamiento; edad agrupada', NULL, NULL, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Media ajustada por genotipo; edad numérica no desagregada.', 'Artículo; revista indexada', 'S10', 'Tabla de peso al apareamiento', 17);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 32.47, 1.75, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P17';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P18', 'Boer', 'MACHO', 'Nacimiento', 0, '0 meses', 0, 0, 15, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 3; peso: figura 1', 18);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 28.17, 1.03, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P18';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 23.19, 1.13, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P18';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 30.77, 0.88, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P18';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 2.9, 0.09, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P18';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 8.02, 0.44, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P18';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P19', 'Boer', 'MACHO', 'Cría', 3, '3 meses', 3, 3, 13, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 3; peso: figura 1', 19);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 46.17, 0.27, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P19';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 45.36, 1.21, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P19';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 47.92, 0.41, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P19';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 11.91, 0.54, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P19';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P20', 'Boer', 'MACHO', 'Cabretón', 6, '6 meses', 6, 6, 12, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 3; peso: figura 1', 20);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 57.19, 0.96, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P20';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 63.23, 1.09, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P20';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 65.2, 1.11, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P20';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 32.56, 0.69, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P20';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 21.78, 0.42, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P20';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P21', 'Boer', 'MACHO', 'Cabretón', 9, '9 meses', 9, 9, 11, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 3; peso: figura 1', 21);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 69.12, 0.88, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P21';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 72.13, 1.12, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P21';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 70.05, 1.18, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P21';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 24.43, 0.41, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P21';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P22', 'Boer', 'MACHO', 'Joven', 12, '12 meses', 12, 12, 11, 'Bangladesh', 'Media observada', 'N', 'Cohorte longitudinal; n corresponde a tabla morfométrica; verificar n específico de peso.', 'Artículo; indexación por verificar', 'S03', 'Tabla 3; peso: figura 1', 22);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 72.12, 0.84, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P22';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 86.33, 1.42, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P22';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 71.78, 1.01, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P22';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 45.56, 1.19, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P22';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 26.22, 0.4, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P22';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P23', 'Boer', 'MACHO', 'Agrupada / no exacta', NULL, '7,2 ± 2 meses (media global)', NULL, NULL, 24, 'Brasil', 'Media observada', 'N', 'Edad media global, no edad individual exacta.', 'Artículo; SciELO', 'S05', 'Tabla 1', 23);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 61.65, 1.37, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P23';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 65.83, 1.24, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P23';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 27.01, 1.48, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P23';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 21.77, 0.62, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P23';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P24', 'Boer', 'MACHO', 'Agrupada / no exacta', NULL, '9–12 meses', 9, 12, 4, 'Estados Unidos', 'Media preliminar', 'S', 'n=4 por raza; indexación no confirmada; longitud corporal no equivalente excluida.', 'Artículo; indexación no confirmada', 'S08', 'Tabla de conformación', 24);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 64.1, 3, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P24';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 85.72, 3.34, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P24';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 51.2, 7.1, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P24';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 27.3, 3.34, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P24';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P25', 'Boer', 'AMBOS', 'Nacimiento', 0, 'Nacimiento', 0, 0, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Medias ajustadas de genotipos puros; sexos agrupados.', 'Artículo; revista indexada', 'S09', 'Tabla 4', 25);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 3.22, 0.13, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P25';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P26', 'Boer', 'AMBOS', 'Agrupada / no exacta', NULL, '12–48 meses', 12, 48, 12, 'Brasil', 'Media observada', 'N', 'Sexo no desagregado; no asignar a machos ni hembras.', 'Artículo; SciELO', 'S07', 'Tabla de morfometría', 26);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 66.33, 4.51, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P26';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 66.66, 4.45, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P26';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 81.83, 6.57, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P26';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 69.58, 6.21, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P26';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 52, 7.68, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P26';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P27', 'Boer', 'AMBOS', 'Agrupada / no exacta', NULL, 'Destete (edad no confirmada)', NULL, NULL, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Medias ajustadas; no imputar edad de destete.', 'Artículo; revista indexada', 'S09', 'Tabla 4', 27);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 13.5, 0.62, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P27';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P28', 'Criolla Santandereana', 'HEMBRA', 'Agrupada / no exacta', NULL, '8–84 meses', 8, 84, 76, 'Colombia', 'Media observada', 'N', 'Edades agrupadas; no es un estándar adulto ni curva de crecimiento.', 'Artículo; PubMed', 'S01', 'Tabla 2', 28);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 62.1, 4, 'DE', 52.5, 75.4 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 63.8, 3.93, 'DE', 55.5, 75 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 64.6, 5.24, 'DE', 51, 77 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 73.8, 6.72, 'DE', 58, 88 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 34.9, 3.04, 'DE', 27, 42.5 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_PECHO', 15.5, 3.27, 'DE', 10.2, 23 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 13.9, 2.51, 'DE', 9, 20 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 14.9, 1.15, 'DE', 12, 17.5 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 8.2, 0.83, 'DE', 7, 12 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 30.5, 6.44, 'DE', 17, 45 FROM MORFO_PERFIL WHERE clave = 'P28';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P29', 'Criolla Santandereana', 'MACHO', 'Cría', 4, '4 meses', 4, 4, 9, 'Colombia', 'Media preliminar', 'S', 'PRELIMINAR: confirmar versión final, puntos anatómicos de cadera/grupa y equivalencia de circunferencia testicular con escrotal.', 'Versión consultada: preprint; indexación no confirmada', 'S02', 'Tabla 1', 29);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 53.78, 2.57, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P29';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 55.04, 2.55, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P29';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 55.24, 2.89, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P29';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 59.34, 2.14, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P29';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 10.51, 0.67, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P29';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 18.24, 1.66, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P29';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 16.6, 2.33, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P29';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 18.02, 1.66, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P29';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P30', 'Criolla Santandereana', 'MACHO', 'Cabretón', 8, '8 meses', 8, 8, 9, 'Colombia', 'Media preliminar', 'S', 'PRELIMINAR: confirmar versión final, puntos anatómicos de cadera/grupa y equivalencia de circunferencia testicular con escrotal.', 'Versión consultada: preprint; indexación no confirmada', 'S02', 'Tabla 1', 30);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 55.63, 1.48, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P30';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 58.73, 2.14, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P30';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 57.9, 1.93, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P30';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 64.6, 2.67, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P30';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 11.34, 0.57, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P30';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 16.69, 3.17, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P30';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 19.74, 2.63, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P30';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 18.69, 3.17, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P30';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P31', 'Criolla Santandereana', 'MACHO', 'Joven', 12, '12 meses', 12, 12, 9, 'Colombia', 'Media preliminar', 'S', 'PRELIMINAR: confirmar versión final, puntos anatómicos de cadera/grupa y equivalencia de circunferencia testicular con escrotal.', 'Versión consultada: preprint; indexación no confirmada', 'S02', 'Tabla 1', 31);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 64.04, 2.73, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P31';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 66.57, 1.85, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P31';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 68.98, 3.18, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P31';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 72.26, 2.62, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P31';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 14.03, 0.77, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P31';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 22.99, 1.06, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P31';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 28.74, 2.72, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P31';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 22.29, 1.06, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P31';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P32', 'Criolla Santandereana', 'MACHO', 'Agrupada / no exacta', NULL, '8–72 meses', 8, 72, 23, 'Colombia', 'Media observada', 'N', 'Edades agrupadas; no es un estándar adulto ni curva de crecimiento.', 'Artículo; PubMed', 'S01', 'Tabla 2', 32);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 62.8, 6.54, 'DE', 52, 77.1 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_GRUPA', 64.8, 7.49, 'DE', 52, 84 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 66.9, 10.42, 'DE', 53, 91 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 73.4, 11.96, 'DE', 60.5, 97 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 34.9, 6.25, 'DE', 26, 50 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_PECHO', 17.2, 4.48, 'DE', 12, 30 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ANCH_GRUPA', 14, 2.6, 'DE', 9.2, 19 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_GRUPA', 14.9, 1.67, 'DE', 11.9, 18 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 8.8, 1.39, 'DE', 6.5, 12 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 34.2, 16.01, 'DE', 18, 72 FROM MORFO_PERFIL WHERE clave = 'P32';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P33', 'Damascus', 'HEMBRA', 'Agrupada / no exacta', NULL, '1,4–3,5 años', 16.8, 42, 15, 'Egipto', 'Media pendiente de cotejo', 'S', 'Extracción previa: cotejo directo adicional pendiente. Longitud base de oreja a cola excluida por no equivalencia.', 'Artículo; cotejo adicional de tabla pendiente', 'S06', 'Tabla de mediciones por sexo', 33);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 65.13, 5.56, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P33';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 74.13, 8.03, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P33';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 33.86, 3.88, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P33';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 7.93, 0.7, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P33';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 33.46, 9.73, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P33';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P34', 'Damascus', 'MACHO', 'Agrupada / no exacta', NULL, '1,4–3,5 años', 16.8, 42, 15, 'Egipto', 'Media pendiente de cotejo', 'S', 'Extracción previa: cotejo directo adicional pendiente. Longitud base de oreja a cola excluida por no equivalencia.', 'Artículo; cotejo adicional de tabla pendiente', 'S06', 'Tabla de mediciones por sexo', 34);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 64.8, 7.54, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P34';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 78.73, 11.79, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P34';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PROF_PECHO', 35.8, 4.12, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P34';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_CANA', 8.86, 1.4, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P34';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 35.4, 11.82, 'DE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P34';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P35', 'Kiko', 'HEMBRA', 'Agrupada / no exacta', NULL, 'Al apareamiento; edad agrupada', NULL, NULL, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Media ajustada por genotipo; edad numérica no desagregada.', 'Artículo; revista indexada', 'S10', 'Tabla de peso al apareamiento', 35);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 38.39, 1.2, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P35';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P36', 'Kiko', 'MACHO', 'Agrupada / no exacta', NULL, '9–12 meses', 9, 12, 4, 'Estados Unidos', 'Media preliminar', 'S', 'n=4 por raza; indexación no confirmada; longitud corporal no equivalente excluida.', 'Artículo; indexación no confirmada', 'S08', 'Tabla de conformación', 36);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'ALZ_CRUZ', 65.1, 2.2, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P36';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 83.18, 1.21, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P36';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 45.1, 3.6, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P36';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 22.86, 1.03, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P36';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P37', 'Kiko', 'AMBOS', 'Nacimiento', 0, 'Nacimiento', 0, 0, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Medias ajustadas de genotipos puros; sexos agrupados.', 'Artículo; revista indexada', 'S09', 'Tabla 4', 37);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 2.88, 0.12, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P37';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P38', 'Kiko', 'AMBOS', 'Agrupada / no exacta', NULL, 'Destete (edad no confirmada)', NULL, NULL, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Medias ajustadas; no imputar edad de destete.', 'Artículo; revista indexada', 'S09', 'Tabla 4', 38);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 15.27, 0.6, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P38';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P39', 'Murciano-Granadina', 'HEMBRA', 'Nacimiento', 0, 'Nacimiento', 0, 0, 7756, 'Irán', 'Media observada', 'N', 'Peso neonatal; población estudiada.', 'Artículo; revista indexada', 'S11', 'Tabla 3', 39);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 2.31, 0.013, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P39';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P40', 'Murciano-Granadina', 'HEMBRA', 'Agrupada / no exacta', NULL, 'Destete (~80 días)', NULL, NULL, 3750, 'Irán', 'Media observada', 'N', 'Edad aproximada; no convertir en valor exacto de 3 meses.', 'Artículo; revista indexada', 'S11', 'Tabla 3', 40);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 9.96, 0.042, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P40';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P41', 'Murciano-Granadina', 'MACHO', 'Nacimiento', 0, 'Nacimiento', 0, 0, 7287, 'Irán', 'Media observada', 'N', 'Peso neonatal; población estudiada.', 'Artículo; revista indexada', 'S11', 'Tabla 3', 41);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 2.51, 0.013, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P41';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P42', 'Murciano-Granadina', 'MACHO', 'Agrupada / no exacta', NULL, 'Destete (~80 días)', NULL, NULL, 3551, 'Irán', 'Media observada', 'N', 'Edad aproximada; no convertir en valor exacto de 3 meses.', 'Artículo; revista indexada', 'S11', 'Tabla 3', 42);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 10.31, 0.042, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P42';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P43', 'Saanen', 'HEMBRA', 'Agrupada / no exacta', NULL, 'Lactación; edad no desagregada', NULL, NULL, 13, 'México', 'Media observada', 'N', 'Peso de hembras en lactación; no equivale a estándar racial.', 'Artículo; revista indexada', 'S16', 'Tabla 4', 43);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 44.037, 0.779, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P43';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P44', 'Saanen', 'MACHO', 'Agrupada / no exacta', NULL, '7,2 ± 2 meses (media global)', NULL, NULL, 38, 'Brasil', 'Media observada', 'N', 'Edad media global, no edad individual exacta.', 'Artículo; SciELO', 'S05', 'Tabla 1', 44);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'LONG_CORP', 61.71, 0.87, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P44';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PER_TOR', 63.72, 0.78, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P44';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 22.99, 0.75, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P44';
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'CIRC_ESCROTAL', 21.88, 0.35, '± informado', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P44';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P45', 'Saanen', 'AMBOS', 'Agrupada / no exacta', NULL, '90 días', NULL, NULL, 15, 'México', 'Media observada', 'N', 'Sexos agrupados; edad en días, no imputar por sexo.', 'Artículo; revista indexada', 'S16', 'Tabla 5', 45);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 19.22, 0.491, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P45';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P46', 'Spanish', 'HEMBRA', 'Agrupada / no exacta', NULL, 'Al apareamiento; edad agrupada', NULL, NULL, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Media ajustada por genotipo; edad numérica no desagregada.', 'Artículo; revista indexada', 'S10', 'Tabla de peso al apareamiento', 46);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 33.29, 1.2, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P46';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P47', 'Spanish', 'AMBOS', 'Nacimiento', 0, 'Nacimiento', 0, 0, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Medias ajustadas de genotipos puros; sexos agrupados.', 'Artículo; revista indexada', 'S09', 'Tabla 4', 47);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 2.83, 0.13, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P47';
INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)
  VALUES ('P48', 'Spanish', 'AMBOS', 'Agrupada / no exacta', NULL, 'Destete (edad no confirmada)', NULL, NULL, NULL, 'Estados Unidos', 'Media ajustada', 'N', 'Medias ajustadas; no imputar edad de destete.', 'Artículo; revista indexada', 'S09', 'Tabla 4', 48);
INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)
  SELECT id_perfil, 'PESO_VIVO', 13.52, 0.61, 'EE', NULL, NULL FROM MORFO_PERFIL WHERE clave = 'P48';

-- ------------------------------------------------------------------
-- 3. Estándares y escalas
-- ------------------------------------------------------------------
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Alpina', 'HEMBRA', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 76.2, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 1);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Alpina', 'HEMBRA', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 61.23, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 2);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Alpina', 'MACHO', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 81.28, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 3);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Alpina', 'MACHO', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 77.11, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 4);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Anglonubiana', 'HEMBRA', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 76.2, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 5);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Anglonubiana', 'HEMBRA', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 61.23, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 6);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Anglonubiana', 'MACHO', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 81.28, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 7);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Anglonubiana', 'MACHO', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 77.11, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 8);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Lamancha', 'HEMBRA', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 71.12, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 9);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Lamancha', 'HEMBRA', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 58.97, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 10);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Lamancha', 'MACHO', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 76.2, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 11);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Lamancha', 'MACHO', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 72.57, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 12);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Oberhasli', 'HEMBRA', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 71.12, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 13);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Oberhasli', 'HEMBRA', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 54.43, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 14);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Oberhasli', 'MACHO', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 76.2, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 15);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Oberhasli', 'MACHO', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 68.04, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 16);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Saanen', 'HEMBRA', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 76.2, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 17);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Saanen', 'HEMBRA', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 61.23, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 18);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Saanen', 'MACHO', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 81.28, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 19);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Saanen', 'MACHO', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 77.11, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 20);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Toggenburg', 'HEMBRA', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 66.04, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 21);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Toggenburg', 'HEMBRA', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 54.43, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 22);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Toggenburg', 'MACHO', 'Adulto; edad numérica no informada', 'ALZ_CRUZ', 'Mínimo racial ADGA', 71.12, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 23);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Toggenburg', 'MACHO', 'Adulto; edad numérica no informada', 'PESO_VIVO', 'Mínimo racial ADGA', 68.04, NULL, NULL, 'Conversión de pulgadas y libras; estándar técnico, no media ni límite de aptitud reproductiva.', 'S14', 24);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Nigora', 'AMBOS', 'Edad y sexo no especificados', 'ALZ_CRUZ', 'Intervalo estándar ANGBA', 48.26, 73.66, NULL, 'Conversión de 19–29 pulgadas; referencia técnica no indexada.', 'S15', 25);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'HEMBRA', 'Primípara', 'ALZ_CRUZ', 'Escala de calificación', 62, 78, 72, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 26);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'HEMBRA', 'Primípara', 'ANCH_PECHO', 'Escala de calificación', 15, 23, 20, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 27);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'HEMBRA', 'Primípara', 'ANCH_GRUPA', 'Escala de calificación', 13, 21, 18, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 28);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'HEMBRA', 'Multípara', 'ALZ_CRUZ', 'Escala de calificación', 62, 78, 74, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 29);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'HEMBRA', 'Multípara', 'ANCH_PECHO', 'Escala de calificación', 15, 23, 21, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 30);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'HEMBRA', 'Multípara', 'ANCH_GRUPA', 'Escala de calificación', 13, 21, 19, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 31);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'MACHO', 'Joven', 'ALZ_CRUZ', 'Escala de calificación', 68, 92, 83, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 32);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'MACHO', 'Joven', 'ANCH_PECHO', 'Escala de calificación', 15, 31, 25, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 33);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'MACHO', 'Joven', 'ANCH_GRUPA', 'Escala de calificación', 14, 22, 19, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 34);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'MACHO', 'Adulto', 'ALZ_CRUZ', 'Escala de calificación', 68, 92, 86, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 35);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'MACHO', 'Adulto', 'ANCH_PECHO', 'Escala de calificación', 15, 31, 27, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 36);
INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)
  VALUES ('Murciano-Granadina', 'MACHO', 'Adulto', 'ANCH_GRUPA', 'Escala de calificación', 14, 22, 20, 'Óptimo del modelo CAPRIGRAN, no intervalo observado; no extrapolar a otras razas.', 'S13', 37);

-- ------------------------------------------------------------------
-- 4. Ficha técnica de cada medida (diccionario)
-- ------------------------------------------------------------------
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'AC', definicion_tecnica = 'Vertical del suelo al punto superior de la cruz.', advertencia = 'Animal en estación, suelo nivelado.', fuente_metodo = 'S17; S18' WHERE codigo = 'ALZ_CRUZ';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'AG', definicion_tecnica = 'Vertical del suelo a la región superior de la grupa, punto sacro definido.', advertencia = 'Estandarizar punto sacro entre evaluadores.', fuente_metodo = 'S17; S18' WHERE codigo = 'ALZ_GRUPA';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'AN', definicion_tecnica = 'Vertical del suelo a la tuberosidad isquiática (punta de la nalga).', advertencia = 'Definición propuesta; falta referencia numérica equivalente localizada.', fuente_metodo = 'S17; S18' WHERE codigo = 'ALT_ISQUION';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'LC', definicion_tecnica = 'Distancia entre encuentro escapulohumeral y tuberosidad isquiática.', advertencia = 'Excluir protocolos base de oreja–cola u otros referentes no equivalentes.', fuente_metodo = 'S17; S18' WHERE codigo = 'LONG_CORP';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'PT', definicion_tecnica = 'Circunferencia torácica inmediatamente detrás de las extremidades anteriores.', advertencia = 'Cinta sin compresión excesiva; postura estable.', fuente_metodo = 'S17; S18' WHERE codigo = 'PER_TOR';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'PP', definicion_tecnica = 'Distancia vertical entre cruz y región esternal.', advertencia = 'No equivale a altura del esternón sobre el suelo.', fuente_metodo = 'S17; S18' WHERE codigo = 'PROF_PECHO';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'AP', definicion_tecnica = 'Distancia transversal del pecho entre referentes escapulohumerales definidos.', advertencia = 'No confundir con diámetro bicostal.', fuente_metodo = 'S17; S18' WHERE codigo = 'ANCH_PECHO';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'ANG', definicion_tecnica = 'Distancia transversal entre tuberosidades ilíacas.', advertencia = 'No confundir con ancho entre isquiones.', fuente_metodo = 'S17; S18' WHERE codigo = 'ANCH_GRUPA';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'LG', definicion_tecnica = 'Distancia entre tuberosidad ilíaca y tuberosidad isquiática del mismo lado.', advertencia = 'Confirmar equivalencia en cada publicación.', fuente_metodo = 'S17; S18' WHERE codigo = 'LONG_GRUPA';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'PC', definicion_tecnica = 'Circunferencia de la caña en el punto medio del metacarpo.', advertencia = 'No confundir con longitud de la caña.', fuente_metodo = 'S17; S18' WHERE codigo = 'PER_CANA';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'PV', definicion_tecnica = 'Peso corporal determinado mediante pesaje directo.', advertencia = 'Registrar gestación, alimentación y estado fisiológico.', fuente_metodo = 'S17; S18' WHERE codigo = 'PESO_VIVO';
UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = 'CE', definicion_tecnica = 'Circunferencia máxima del escroto con ambos testículos descendidos.', advertencia = 'Solo machos; examen andrológico complementario; no equivale a circunferencia de un testículo.', fuente_metodo = 'S05; S08' WHERE codigo = 'CIRC_ESCROTAL';

-- ------------------------------------------------------------------
-- 5. Referencias con las que se califica (media ± DE publicada)
--    Solo reemplaza filas que siguen con el valor inicial aproximado
--    o que puso este mismo parche (fuente que empieza por "S0"/"S1").
-- ------------------------------------------------------------------

-- Criolla Santandereana · hembra · 8–84 meses · Colombia (S01)
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'ALZ_CRUZ' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 62.1, t.de = 4, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 62.1, 4, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'ALZ_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 63.8, t.de = 3.93, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 63.8, 3.93, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'LONG_CORP' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 64.6, t.de = 5.24, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 64.6, 5.24, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'PER_TOR' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 73.8, t.de = 6.72, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 73.8, 6.72, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'PROF_PECHO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 34.9, t.de = 3.04, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 34.9, 3.04, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'ANCH_PECHO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 15.5, t.de = 3.27, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 15.5, 3.27, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'ANCH_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 13.9, t.de = 2.51, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 13.9, 2.51, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'LONG_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 14.9, t.de = 1.15, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 14.9, 1.15, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'PER_CANA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 8.2, t.de = 0.83, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 8.2, 0.83, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'PESO_VIVO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 30.5, t.de = 6.44, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 30.5, 6.44, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=76, 8–84 meses, Colombia · media ± DE');

-- Criolla Santandereana · macho · 8–72 meses · Colombia (S01)
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'ALZ_CRUZ' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 62.8, t.de = 6.54, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 62.8, 6.54, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'ALZ_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 64.8, t.de = 7.49, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 64.8, 7.49, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'LONG_CORP' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 66.9, t.de = 10.42, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 66.9, 10.42, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'PER_TOR' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 73.4, t.de = 11.96, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 73.4, 11.96, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'PROF_PECHO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 34.9, t.de = 6.25, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 34.9, 6.25, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'ANCH_PECHO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 17.2, t.de = 4.48, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 17.2, 4.48, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'ANCH_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 14, t.de = 2.6, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 14, 2.6, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'LONG_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 14.9, t.de = 1.67, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 14.9, 1.67, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'PER_CANA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 8.8, t.de = 1.39, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 8.8, 1.39, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'MACHO' sexo, 'PESO_VIVO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Criolla Santandereana')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 34.2, t.de = 16.01, t.fuente = 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 34.2, 16.01, 'S01 · Salamanca-Carreño et al. (2026), Tabla 2 · n=23, 8–72 meses, Colombia · media ± DE');

-- Boer · hembra · 30 meses · Bulgaria; origen Austria (S04)
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'ALZ_CRUZ' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 68.26, t.de = 3.68, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.844 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 68.26, 3.68, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.844 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'ALZ_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 67.21, t.de = 3.63, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.833 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 67.21, 3.63, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.833 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'LONG_CORP' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 87.11, t.de = 6.31, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (1.447 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 87.11, 6.31, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (1.447 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'PER_TOR' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 91.68, t.de = 8.17, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (1.875 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 91.68, 8.17, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (1.875 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'PROF_PECHO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 30.47, t.de = 2.55, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.584 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 30.47, 2.55, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.584 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'ANCH_PECHO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 21.32, t.de = 3.18, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.73 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 21.32, 3.18, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.73 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'ANCH_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 17.26, t.de = 2.13, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.489 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 17.26, 2.13, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.489 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'LONG_GRUPA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 25.11, t.de = 2.08, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.477 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 25.11, 2.08, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.477 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'PER_CANA' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 11.05, t.de = 1.02, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.235 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 11.05, 1.02, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (0.235 × √19)');
MERGE INTO RAZA_MEDIDA_REF t
USING (SELECT id_raza, 'HEMBRA' sexo, 'PESO_VIVO' codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER('Boer')) s
   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
 WHEN MATCHED THEN UPDATE SET t.media = 64.58, t.de = 14.66, t.fuente = 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (3.363 × √19)', t.fecha_modificacion = CURRENT_TIMESTAMP
      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{2} ')
 WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
      VALUES (s.id_raza, s.sexo, s.codigo_medida, 64.58, 14.66, 'S04 · Panayotov, D. (2022), Tabla 1 · n=19, 30 meses, Bulgaria; origen Austria · DE = EE × √n (3.363 × √19)');

COMMIT;
