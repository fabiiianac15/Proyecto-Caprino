#!/usr/bin/env python3
"""Genera base-de-datos/esquemas/20-morfometria-publicada.sql a partir del Excel
documentacion/24-11-26 Parametros morfometricos caprinos APP.xlsx.

Uso (necesita openpyxl):
    python3 base-de-datos/herramientas/gen20_morfometria.py [ruta.xlsx] [salida.sql]

Si el Excel cambia, se vuelve a correr y se ejecuta el .sql en el servidor.
"""
import math
import re
import sys
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parents[2]
XLSX = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / 'documentacion' / '24-11-26 Parametros morfometricos caprinos APP.xlsx'
SALIDA = Path(sys.argv[2]) if len(sys.argv) > 2 else RAIZ / 'base-de-datos' / 'esquemas' / '20-morfometria-publicada.sql'

# Código del Excel -> código de la aplicación (CLASIF_MEDIDA_CAT)
CODIGOS = {
    'AC': 'ALZ_CRUZ', 'AG': 'ALZ_GRUPA', 'AN': 'ALT_ISQUION', 'LC': 'LONG_CORP', 'PT': 'PER_TOR',
    'PP': 'PROF_PECHO', 'AP': 'ANCH_PECHO', 'ANG': 'ANCH_GRUPA', 'LG': 'LONG_GRUPA', 'PC': 'PER_CANA',
    'PV': 'PESO_VIVO', 'CE': 'CIRC_ESCROTAL',
}
NOMBRE_A_CODIGO = {}  # 'Alzada a la cruz (cm)' -> 'AC' (se llena con el diccionario)
SEXOS = {'Hembra': 'HEMBRA', 'Macho': 'MACHO', 'No desagregado': 'AMBOS'}
RAZAS = {'LaMancha': 'Lamancha'}  # nombre del Excel -> nombre en la tabla RAZA
PRELIMINARES = {'Media preliminar', 'Media pendiente de cotejo'}

# Perfiles publicados que pasan a ser la referencia con la que se califica
# (media ± DE de adultos, por sexo, no preliminares). Clave: (raza, sexo, edad publicada, país).
# Si la tabla solo trae el error estándar (EE), la DE se calcula como EE × √n.
REFERENCIAS = [
    ('Criolla Santandereana', 'Hembra', '8–84 meses', 'Colombia'),
    ('Criolla Santandereana', 'Macho', '8–72 meses', 'Colombia'),
    ('Boer', 'Hembra', '30 meses', 'Bulgaria; origen Austria'),
]


def q(v):
    """Literal SQL."""
    if v is None or v == '':
        return 'NULL'
    if isinstance(v, (int, float)):
        return repr(round(float(v), 4)).rstrip('0').rstrip('.') if isinstance(v, float) else str(v)
    return "'" + str(v).replace("'", "''") + "'"


def filas(ws):
    rs = list(ws.iter_rows(values_only=True))
    cab = [str(c).strip() if c is not None else '' for c in rs[0]]
    return [dict(zip(cab, r)) for r in rs[1:] if any(c is not None for c in r)]


def partir_biblio(texto):
    """'S01 | Autor (2026)... | Tabla 2 | https://doi...' -> ('S01', 'Tabla 2')."""
    partes = [p.strip() for p in str(texto or '').split('|')]
    cod = partes[0] if partes and re.fullmatch(r'S\d\d', partes[0]) else None
    loc = next((p for p in partes[1:] if re.match(r'(Tabla|Figura|Cuadro|Anexo|p\.)', p, re.I)), None)
    return cod, loc


def num(v):
    return None if v is None or v == '' else float(v)


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    sql = []
    w = sql.append

    # ---------------- Diccionario ----------------
    dic = filas(wb['Diccionario'])
    for d in dic:
        NOMBRE_A_CODIGO[d['Medida APP']] = d['Código']

    # ---------------- Bibliografía ----------------
    fuentes = filas(wb['Bibliografía'])
    citas = {f['ID']: f['Referencia bibliográfica'] for f in fuentes}

    # ---------------- Evidencia (dispersión, mín, máx) ----------------
    evid = {}
    for e in filas(wb['Evidencia']):
        cod, _ = partir_biblio(e['Bibliografía y localización'])
        clave = (e['Raza'], e['Sexo'], e['Edad publicada'], e['País / cohorte'], cod, e['Código'])
        evid[clave] = e

    # ---------------- Perfiles publicados ----------------
    perfiles = []
    for i, p in enumerate(filas(wb['Perfiles publicados']), start=1):
        cod, loc = partir_biblio(p['Bibliografía y localización'])
        obs = str(p['Estado / observaciones'] or '')
        obs_txt, _, verif = obs.partition(' | ')
        valores = []
        for nombre, c in NOMBRE_A_CODIGO.items():
            media = num(p.get(nombre))
            if media is None:
                continue
            e = evid.get((p['Raza'], p['Sexo'], p['Edad publicada'], p['País / cohorte'], cod, c), {})
            valores.append({
                'codigo': CODIGOS[c], 'media': media, 'disp': num(e.get('Dispersión')),
                'tipo': e.get('Tipo dispersión'), 'min': num(e.get('Mínimo observado')), 'max': num(e.get('Máximo observado')),
            })
        perfiles.append({
            'clave': f'P{i:02d}', 'raza': RAZAS.get(p['Raza'], p['Raza']), 'razaXls': p['Raza'], 'sexo': SEXOS[p['Sexo']],
            'sexoXls': p['Sexo'], 'etapa': p['Etapa'], 'edad': num(p['Edad (meses)']), 'edadPub': p['Edad publicada'],
            'edadMin': num(p['Edad mín. (meses)']), 'edadMax': num(p['Edad máx. (meses)']), 'n': p['n'],
            'pais': p['País / cohorte'], 'tipo': p['Tipo de dato'], 'prelim': 'S' if p['Tipo de dato'] in PRELIMINARES else 'N',
            'obs': obs_txt.strip(), 'verif': verif.strip() or None, 'fuente': cod, 'loc': loc, 'valores': valores,
        })

    # ---------------- Estándares ----------------
    estandares = filas(wb['Estándares'])

    # =================================================================
    w("""-- ==================================================================
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
""")

    w('-- ------------------------------------------------------------------\n-- 1. Bibliografía\n-- ------------------------------------------------------------------')
    for f in fuentes:
        w(f"INSERT INTO MORFO_FUENTE (codigo, referencia, verificacion, url) VALUES ({q(f['ID'])}, {q(f['Referencia bibliográfica'])}, {q(f['Tipo y verificación'])}, {q(f['DOI o URL'])});")

    w('\n-- ------------------------------------------------------------------\n-- 2. Perfiles publicados y sus valores\n-- ------------------------------------------------------------------')
    for k, p in enumerate(perfiles, start=1):
        w(f"INSERT INTO MORFO_PERFIL (clave, raza, sexo, etapa, edad_meses, edad_publicada, edad_min, edad_max, n, pais, tipo_dato, preliminar, observaciones, verificacion, fuente, localizacion, orden)\n"
          f"  VALUES ({q(p['clave'])}, {q(p['raza'])}, {q(p['sexo'])}, {q(p['etapa'])}, {q(p['edad'])}, {q(p['edadPub'])}, {q(p['edadMin'])}, {q(p['edadMax'])}, {q(p['n'])}, {q(p['pais'])}, {q(p['tipo'])}, {q(p['prelim'])}, {q(p['obs'])}, {q(p['verif'])}, {q(p['fuente'])}, {q(p['loc'])}, {k});")
        for v in p['valores']:
            w(f"INSERT INTO MORFO_PERFIL_VALOR (id_perfil, codigo_medida, media, dispersion, tipo_dispersion, minimo, maximo)\n"
              f"  SELECT id_perfil, {q(v['codigo'])}, {q(v['media'])}, {q(v['disp'])}, {q(v['tipo'])}, {q(v['min'])}, {q(v['max'])} FROM MORFO_PERFIL WHERE clave = {q(p['clave'])};")

    w('\n-- ------------------------------------------------------------------\n-- 3. Estándares y escalas\n-- ------------------------------------------------------------------')
    for k, e in enumerate(estandares, start=1):
        cod, _ = partir_biblio(e['Bibliografía y localización'])
        w(f"INSERT INTO MORFO_ESTANDAR (raza, sexo, grupo, codigo_medida, tipo, minimo, maximo, optimo, observaciones, fuente, orden)\n"
          f"  VALUES ({q(RAZAS.get(e['Raza'], e['Raza']))}, {q(SEXOS[e['Sexo']])}, {q(e['Grupo fisiológico / edad'])}, {q(CODIGOS[e['Código']])}, {q(e['Tipo'])}, "
          f"{q(num(e['Mínimo estándar / escala']))}, {q(num(e['Máximo estándar / escala']))}, {q(num(e['Óptimo del modelo']))}, {q(e['Observaciones'])}, {q(cod)}, {k});")

    w('\n-- ------------------------------------------------------------------\n-- 4. Ficha técnica de cada medida (diccionario)\n-- ------------------------------------------------------------------')
    for d in dic:
        fm = '; '.join(re.findall(r'\bS\d\d\b', str(d['Bibliografía metodológica'] or '')))
        w(f"UPDATE CLASIF_MEDIDA_CAT SET codigo_ref = {q(d['Código'])}, definicion_tecnica = {q(d['Definición operativa propuesta'])}, "
          f"advertencia = {q(d['Advertencia'])}, fuente_metodo = {q(fm)} WHERE codigo = {q(CODIGOS[d['Código']])};")

    w('\n-- ------------------------------------------------------------------\n-- 5. Referencias con las que se califica (media ± DE publicada)\n'
      '--    Solo reemplaza filas que siguen con el valor inicial aproximado\n'
      '--    o que puso este mismo parche (fuente que empieza por "S0"/"S1").\n'
      '-- ------------------------------------------------------------------')
    for raza, sexo, edad, pais in REFERENCIAS:
        p = next(x for x in perfiles if x['razaXls'] == raza and x['sexoXls'] == sexo and x['edadPub'] == edad and x['pais'] == pais)
        autor = citas[p['fuente']].split('(')[0].strip().rstrip(',')
        anio = re.search(r'\((\d{4})\)', citas[p['fuente']]).group(1)
        w(f"\n-- {p['raza']} · {p['sexo'].lower()} · {edad} · {pais} ({p['fuente']})")
        for v in p['valores']:
            if v['tipo'] == 'DE':
                de, como = v['disp'], 'media ± DE'
            elif v['tipo'] == 'EE' and p['n']:
                de, como = v['disp'] * math.sqrt(p['n']), f"DE = EE × √n ({v['disp']} × √{p['n']})"
            else:
                continue
            de = round(de, 2)
            texto = (f"{p['fuente']} · {autor} ({anio}), {p['loc'] or 'tabla'} · n={p['n']}, {edad}, {pais} · {como}")[:400]
            w(f"MERGE INTO RAZA_MEDIDA_REF t\n"
              f"USING (SELECT id_raza, {q(p['sexo'])} sexo, {q(v['codigo'])} codigo_medida FROM RAZA WHERE UPPER(nombre_raza) = UPPER({q(p['raza'])})) s\n"
              f"   ON (t.id_raza = s.id_raza AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)\n"
              f" WHEN MATCHED THEN UPDATE SET t.media = {q(round(v['media'], 2))}, t.de = {q(de)}, t.fuente = {q(texto)}, t.fecha_modificacion = CURRENT_TIMESTAMP\n"
              f"      WHERE t.fuente IS NULL OR t.fuente LIKE 'Valor inicial aproximado%' OR REGEXP_LIKE(t.fuente, '^S[0-9]{{2}} ')\n"
              f" WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)\n"
              f"      VALUES (s.id_raza, s.sexo, s.codigo_medida, {q(round(v['media'], 2))}, {q(de)}, {q(texto)});")

    w('\nCOMMIT;\n')
    SALIDA.write_text('\n'.join(sql), encoding='utf-8')
    print(f'{SALIDA}: {len(fuentes)} fuentes, {len(perfiles)} perfiles, '
          f"{sum(len(p['valores']) for p in perfiles)} valores, {len(estandares)} estándares, {len(dic)} medidas")


if __name__ == '__main__':
    main()
