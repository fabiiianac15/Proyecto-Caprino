"""Ilustraciones isométricas de los módulos sin imagen (mismo lenguaje que las demás)."""
import sys
OUT = sys.argv[1]
U = (0.862, 0.506)    # eje isométrico hacia abajo-derecha
V = (-0.862, 0.506)   # eje isométrico hacia abajo-izquierda
C = (672, 400)

def iso(a, b, z=0):
    return (C[0] + a * U[0] + b * V[0], C[1] + a * U[1] + b * V[1] - z)

def pts(lista):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in lista)

def poly(lista, fill, extra=''):
    return f'<polygon points="{pts(lista)}" fill="{fill}" {extra}/>'

def losa():
    r = 215
    arriba = [iso(-r, -r), iso(r, -r), iso(r, r), iso(-r, r)]
    lado = [(x, y + 26) for x, y in arriba]
    j = 'stroke-linejoin="round" stroke-width="44"'
    return (poly(lado, '#8fbf5a', f'stroke="#8fbf5a" {j}') + poly(arriba, '#b9dc85', f'stroke="#b9dc85" {j}'))

def mechon(a, b):
    x, y = iso(a, b)
    return f'<path d="M{x-6:.0f},{y:.0f} l3,-9 M{x:.0f},{y:.0f} l0,-11 M{x+6:.0f},{y:.0f} l-3,-9" stroke="#8fbf5a" stroke-width="2.5" stroke-linecap="round" fill="none"/>'

def flor(a, b, color='#f6a5b8'):
    x, y = iso(a, b)
    return (f'<path d="M{x:.0f},{y:.0f} v-16" stroke="#6fa043" stroke-width="2.5"/>'
            + ''.join(f'<circle cx="{x+dx:.0f}" cy="{y-18+dy:.0f}" r="4" fill="{color}"/>' for dx, dy in [(-4, 0), (4, 0), (0, -4), (0, 4)])
            + f'<circle cx="{x:.0f}" cy="{y-18:.0f}" r="2.6" fill="#f7d154"/>')

def cabra(a, b, s=1.0, color='blanca', mira=1, ubre=False):
    """Cabra de perfil apoyada en el punto (a, b) de la losa. mira=1 derecha, -1 izquierda."""
    x, y = iso(a, b)
    c = {'blanca': ('#f7f2ec', '#e3dad0', '#cfc4b8'), 'cafe': ('#9a6447', '#7f4f37', '#6a402c'), 'crema': ('#e9cfa6', '#d6b888', '#bf9f6f')}[color]
    g = f'<g transform="translate({x:.1f},{y:.1f}) scale({mira * s:.2f},{s:.2f})">'
    g += '<ellipse cx="0" cy="2" rx="46" ry="9" fill="#000" opacity="0.10"/>'
    for lx, tono in [(-24, c[1]), (-13, c[0]), (14, c[1]), (25, c[0])]:
        g += f'<rect x="{lx-4}" y="-36" width="8" height="36" rx="3.5" fill="{tono}"/><rect x="{lx-4.5}" y="-6" width="9" height="7" rx="2" fill="#5b4636"/>'
    if ubre:
        g += '<ellipse cx="-14" cy="-33" rx="9" ry="8" fill="#f6b7b7"/>'
    g += f'<ellipse cx="0" cy="-48" rx="36" ry="20" fill="{c[0]}"/>'
    g += f'<path d="M-34,-56 q-12,-8 -8,-18 q8,6 12,12 z" fill="{c[0]}"/>'                       # cola
    g += f'<path d="M22,-58 L38,-86 L52,-78 L36,-44 Z" fill="{c[0]}"/>'                          # cuello
    g += f'<path d="M34,-98 q-10,-18 -24,-20 q10,10 12,24 z" fill="#d8c7a8"/>'                   # cuerno
    g += f'<ellipse cx="50" cy="-88" rx="17" ry="12.5" transform="rotate(18 50 -88)" fill="{c[0]}"/>'
    g += f'<ellipse cx="63" cy="-82" rx="8" ry="6.5" fill="{c[1]}"/>'                            # hocico
    g += f'<path d="M36,-94 q-16,2 -20,12 q14,2 22,-4 z" fill="{c[2]}"/>'                        # oreja
    g += f'<path d="M56,-76 q2,12 -3,16 q-4,-8 -3,-15 z" fill="{c[2]}"/>'                        # barba
    g += '<circle cx="52" cy="-92" r="2.6" fill="#3a2a20"/><circle cx="67" cy="-83" r="1.4" fill="#3a2a20"/>'
    return g + '</g>'

def persona(a, b, s=1.0, mira=1, tabla=True):
    x, y = iso(a, b)
    g = f'<g transform="translate({x:.1f},{y:.1f}) scale({mira * s:.2f},{s:.2f})">'
    g += '<ellipse cx="0" cy="2" rx="26" ry="7" fill="#000" opacity="0.10"/>'
    g += '<rect x="-15" y="-62" width="12" height="60" rx="5" fill="#3f6fb5"/><rect x="2" y="-62" width="12" height="60" rx="5" fill="#4a7fc9"/>'
    g += '<rect x="-17" y="-6" width="15" height="8" rx="3" fill="#6b4a36"/><rect x="1" y="-6" width="15" height="8" rx="3" fill="#6b4a36"/>'
    g += '<rect x="-19" y="-116" width="38" height="58" rx="12" fill="#f4f1ec"/>'              # camisa
    g += '<path d="M-14,-58 v-36 h28 v36 z" fill="#4a7fc9"/><rect x="-12" y="-112" width="5" height="22" fill="#4a7fc9"/><rect x="7" y="-112" width="5" height="22" fill="#4a7fc9"/>'
    g += '<rect x="-27" y="-112" width="11" height="34" rx="5.5" fill="#f4f1ec"/><circle cx="-21" cy="-76" r="6" fill="#f0c4a0"/>'
    g += '<path d="M16,-110 q14,6 20,22" stroke="#f4f1ec" stroke-width="11" stroke-linecap="round" fill="none"/><circle cx="36" cy="-86" r="6" fill="#f0c4a0"/>'
    if tabla:
        g += '<rect x="24" y="-104" width="26" height="32" rx="3" transform="rotate(14 37 -88)" fill="#3d4f66"/><rect x="28" y="-99" width="18" height="22" rx="1.5" transform="rotate(14 37 -88)" fill="#fff"/>'
    g += '<circle cx="0" cy="-132" r="17" fill="#f0c4a0"/><circle cx="6" cy="-134" r="1.8" fill="#3a2a20"/><path d="M2,-125 q5,4 10,0" stroke="#3a2a20" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    g += '<ellipse cx="0" cy="-145" rx="30" ry="7" fill="#e8b85a"/><path d="M-17,-146 q0,-20 17,-20 q17,0 17,20 z" fill="#f2c96b"/><path d="M-17,-148 h34 v5 h-34 z" fill="#d9534f"/>'
    return g + '</g>'

def cerca(a0, b0, a1, b1, postes=5):
    g = ''
    P = [iso(a0 + (a1 - a0) * i / (postes - 1), b0 + (b1 - b0) * i / (postes - 1)) for i in range(postes)]
    for h in (14, 28):
        g += f'<path d="M{P[0][0]:.1f},{P[0][1]-h:.1f} L{P[-1][0]:.1f},{P[-1][1]-h:.1f}" stroke="#c98d52" stroke-width="7" stroke-linecap="round"/>'
    for x, y in P:
        g += f'<rect x="{x-5:.1f}" y="{y-40:.1f}" width="10" height="42" rx="3" fill="#a9703c"/><rect x="{x-5:.1f}" y="{y-40:.1f}" width="10" height="6" rx="3" fill="#d9a56a"/>'
    return g

def caja(a, b, la, lb, h, techo, izq, der, z=0):
    """Caja isométrica con esquina trasera en (a, b)."""
    A, B, Cc, D = iso(a, b, z), iso(a + la, b, z), iso(a + la, b + lb, z), iso(a, b + lb, z)
    s = lambda p: (p[0], p[1] - h)
    return (poly([D, Cc, s(Cc), s(D)], izq) + poly([B, Cc, s(Cc), s(B)], der) + poly([s(A), s(B), s(Cc), s(D)], techo))

def letrero(a, b, texto):
    x, y = iso(a, b)
    return (f'<rect x="{x-5:.0f}" y="{y-78:.0f}" width="10" height="80" rx="3" fill="#a9703c"/>'
            f'<rect x="{x-58:.0f}" y="{y-104:.0f}" width="116" height="44" rx="6" fill="#c98d52"/><rect x="{x-58:.0f}" y="{y-104:.0f}" width="116" height="7" rx="3" fill="#d9a56a"/>'
            f'<text x="{x:.0f}" y="{y-75:.0f}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="{17 if len(texto) < 9 else 15}" fill="#fff8ec">{texto}</text>')

def lienzo(contenido):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="272 70 800 600" width="1200" height="900">{losa()}{contenido}</svg>')

# ── Corrales y lotes ──────────────────────────────────────────────────────────
def corrales():
    g = mechon(-190, 150) + mechon(180, -170) + flor(-200, 40) + flor(190, 120, '#ffffff')
    # establo al fondo
    g += caja(-200, -200, 150, 120, 78, '#e7dccb', '#e9c79a', '#d9b281')
    T = [iso(-212, -212, 78), iso(-38, -212, 78), iso(-38, -68, 78), iso(-212, -68, 78)]
    cumbre = [iso(-125, -212, 138), iso(-125, -68, 138)]
    g += poly([T[3], T[2], cumbre[1]], '#e9c79a') + poly([T[1], T[2], cumbre[1], cumbre[0]], '#c9584c') + poly([T[0], T[3], cumbre[1], cumbre[0]], '#de6b5e')
    px, py = iso(-90, -80)
    g += f'<path d="M{px-20:.0f},{py+8:.0f} v-44 q20,-16 40,0 v44 z" fill="#7a5236" transform="skewY(30) translate(0,{-px*0.577+ (py*0) :.0f})" opacity="0"/>'
    # corral trasero
    g += cerca(-20, -190, 190, -190) + cerca(-20, -190, -20, -20)
    g += cabra(60, -110, 0.78, 'cafe', 1) + cabra(140, -60, 0.72, 'blanca', -1)
    g += cerca(190, -190, 190, -20) + cerca(-20, -20, 70, -20, 3) + cerca(120, -20, 190, -20, 2)
    # corral delantero
    g += cerca(-190, 10, 30, 10) + cerca(-190, 10, -190, 190)
    g += cabra(-110, 80, 0.86, 'blanca', 1, ubre=True) + cabra(-40, 140, 0.62, 'crema', -1) + cabra(-150, 150, 0.58, 'cafe', 1)
    g += cerca(30, 10, 30, 190) + cerca(-190, 190, -90, 190, 3) + cerca(-40, 190, 30, 190, 2)
    # bebedero y letrero
    g += caja(90, 80, 70, 30, 16, '#7cc4ea', '#b7b7b7', '#9e9e9e')
    g += letrero(150, 175, 'CORRALES')
    return lienzo(g)

# ── Bienestar animal ─────────────────────────────────────────────────────────
def bienestar():
    g = mechon(-185, 170) + mechon(170, -185) + flor(-205, 90) + flor(60, 200, '#ffffff') + flor(200, 40)
    # sombrío: cuatro postes y techo
    esquinas = [(-190, -190), (-30, -190), (-30, -60), (-190, -60)]
    for a, b in esquinas[:2]:
        x, y = iso(a, b); g += f'<rect x="{x-5:.0f}" y="{y-120:.0f}" width="10" height="122" rx="3" fill="#a9703c"/>'
    g += cabra(-110, -120, 0.74, 'cafe', 1)
    for a, b in esquinas[2:]:
        x, y = iso(a, b); g += f'<rect x="{x-5:.0f}" y="{y-120:.0f}" width="10" height="122" rx="3" fill="#b97d45"/>'
    R = [iso(-205, -205, 122), iso(-15, -205, 122), iso(-15, -45, 122), iso(-205, -45, 122)]
    g += poly([(x, y + 9) for x, y in [R[3], R[2], R[1]]] + [R[1], R[2], R[3]], '#3f8f5a') + poly(R, '#58b877', 'stroke="#58b877" stroke-width="6" stroke-linejoin="round"')
    # bebedero con agua y comedero con forraje
    g += caja(60, -170, 110, 36, 20, '#7cc4ea', '#bdbdbd', '#a3a3a3')
    g += caja(120, -80, 80, 34, 22, '#8fbf5a', '#c98d52', '#a9703c')
    hx, hy = iso(160, -63, 22); g += f'<ellipse cx="{hx:.0f}" cy="{hy-4:.0f}" rx="34" ry="12" fill="#a7d06e"/>'
    # cabra sana, persona con tabla
    g += cabra(20, 60, 1.0, 'blanca', -1, ubre=True) + cabra(150, 130, 0.6, 'crema', -1)
    g += persona(-120, 110, 1.0, 1)
    # escudo con chulo y corazón
    sx, sy = iso(170, 30); sy -= 150
    g += f'<path d="M{sx},{sy-52} l44,16 v34 q0,40 -44,58 q-44,-18 -44,-58 v-34 z" fill="#2f9e5b"/><path d="M{sx},{sy-52} l44,16 v34 q0,40 -44,58 z" fill="#27874d"/>'
    g += f'<path d="M{sx-20},{sy+2} l14,14 l28,-30" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    cx, cy = sx + 78, sy - 30
    g += f'<path d="M{cx},{cy+16} q-26,-18 -18,-34 q8,-12 18,0 q10,-12 18,0 q8,16 -18,34 z" fill="#ef6b7b"/>'
    return lienzo(g)

# ── Clasificación lineal ─────────────────────────────────────────────────────
def clasificacion():
    g = mechon(-190, 160) + mechon(185, -165) + flor(-205, 60) + flor(205, 100, '#ffffff')
    # tarima
    g += caja(-70, -70, 160, 130, 18, '#e9e4dc', '#c98d52', '#a9703c')
    # regla vertical detrás de la cabra
    rx, ry = iso(-60, -60, 18)
    g += f'<rect x="{rx-9:.0f}" y="{ry-190:.0f}" width="18" height="192" rx="3" fill="#f7d154"/>'
    g += ''.join(f'<rect x="{rx-9:.0f}" y="{ry-10-i*18:.0f}" width="{12 if i % 2 else 7}" height="2.5" fill="#6b5a1e"/>' for i in range(10))
    # cabra sobre la tarima (se levanta 18 px)
    x, y = iso(10, 0, 18)
    g += f'<g transform="translate(0,-18)">{cabra(10, 0, 1.12, "blanca", 1, ubre=True)}</g>'
    # líneas de medición: altura a la cruz y largo del cuerpo
    g += f'<path d="M{x-58:.0f},{y-140:.0f} h118" stroke="#d9534f" stroke-width="3.5" stroke-dasharray="9 7"/>'
    g += f'<path d="M{x-58:.0f},{y-150:.0f} v20 M{x+60:.0f},{y-150:.0f} v20" stroke="#d9534f" stroke-width="3.5" stroke-linecap="round"/>'
    g += f'<path d="M{x+92:.0f},{y-108:.0f} v104" stroke="#3f6fb5" stroke-width="3.5" stroke-dasharray="9 7"/>'
    g += f'<path d="M{x+82:.0f},{y-108:.0f} h20 M{x+82:.0f},{y-4:.0f} h20" stroke="#3f6fb5" stroke-width="3.5" stroke-linecap="round"/>'
    # cámara en trípode
    tx, ty = iso(195, 150)
    g += f'<path d="M{tx:.0f},{ty-78:.0f} L{tx-24:.0f},{ty:.0f} M{tx:.0f},{ty-78:.0f} L{tx+24:.0f},{ty:.0f} M{tx:.0f},{ty-78:.0f} L{tx:.0f},{ty+8:.0f}" stroke="#55606e" stroke-width="5" stroke-linecap="round"/>'
    g += f'<rect x="{tx-30:.0f}" y="{ty-116:.0f}" width="60" height="40" rx="7" fill="#3d4f66"/><rect x="{tx-12:.0f}" y="{ty-124:.0f}" width="22" height="10" rx="3" fill="#3d4f66"/>'
    g += f'<circle cx="{tx-4:.0f}" cy="{ty-96:.0f}" r="13" fill="#dfe7ee"/><circle cx="{tx-4:.0f}" cy="{ty-96:.0f}" r="7.5" fill="#55606e"/><circle cx="{tx+20:.0f}" cy="{ty-106:.0f}" r="3" fill="#f7d154"/>'
    # persona anotando y tarjeta de puntaje
    g += persona(-150, 120, 1.0, 1)
    px, py = iso(110, -150); py -= 150
    g += f'<rect x="{px-62:.0f}" y="{py-40:.0f}" width="124" height="92" rx="12" fill="#fff" stroke="#e6e0d8" stroke-width="3"/>'
    for i, (w, col) in enumerate([(84, '#2f9e5b'), (58, '#f2b84b'), (72, '#3f6fb5')]):
        g += f'<rect x="{px-46:.0f}" y="{py-24+i*24:.0f}" width="92" height="11" rx="5.5" fill="#eeeae4"/><rect x="{px-46:.0f}" y="{py-24+i*24:.0f}" width="{w}" height="11" rx="5.5" fill="{col}"/>'
    return lienzo(g)


# ── Piezas sueltas ───────────────────────────────────────────────────────────
def corazon(x, y, s=1.0, color='#ef6b7b'):
    return f'<path transform="translate({x:.0f},{y:.0f}) scale({s})" d="M0,16 q-26,-18 -18,-34 q8,-12 18,0 q10,-12 18,0 q8,16 -18,34 z" fill="{color}"/>'

def balde(a, b, s=1.0, leche=True):
    x, y = iso(a, b)
    g = f'<g transform="translate({x:.0f},{y:.0f}) scale({s})"><ellipse cx="0" cy="2" rx="22" ry="6" fill="#000" opacity="0.10"/>'
    g += '<path d="M-20,-34 L-15,0 q15,7 30,0 L20,-34 z" fill="#b9c2cc"/><path d="M4,-30 L6,3 q5,-1 9,-3 L20,-34 z" fill="#9aa5b1"/>'
    g += f'<ellipse cx="0" cy="-34" rx="20" ry="7" fill="{"#ffffff" if leche else "#8d98a5"}" stroke="#d5dbe2" stroke-width="3"/>'
    g += '<path d="M-20,-34 q20,-34 40,0" stroke="#7d8793" stroke-width="3" fill="none"/>'
    return g + '</g>'

def cantina(a, b, s=1.0):
    x, y = iso(a, b)
    g = f'<g transform="translate({x:.0f},{y:.0f}) scale({s})"><ellipse cx="0" cy="2" rx="24" ry="7" fill="#000" opacity="0.10"/>'
    g += '<path d="M-21,0 v-48 q0,-10 9,-14 v-10 h24 v10 q9,4 9,14 v48 q-21,8 -42,0 z" fill="#c9d1da"/><path d="M6,-72 h6 v10 q9,4 9,14 v48 q-7,3 -15,4 z" fill="#a9b3bf"/>'
    g += '<ellipse cx="0" cy="-72" rx="14" ry="5" fill="#e3e8ee"/><rect x="-21" y="-40" width="42" height="5" fill="#8f9aa7" opacity="0.6"/>'
    return g + '</g>'

def calendario(x, y, s=1.0, marca='#ef6b7b'):
    g = f'<g transform="translate({x:.0f},{y:.0f}) scale({s})">'
    g += '<rect x="-46" y="-40" width="92" height="84" rx="10" fill="#fff" stroke="#e6e0d8" stroke-width="3"/><path d="M-46,-30 q0,-10 10,-10 h72 q10,0 10,10 v12 h-92 z" fill="#d9534f"/>'
    g += '<rect x="-28" y="-48" width="7" height="16" rx="3.5" fill="#6b4a36"/><rect x="21" y="-48" width="7" height="16" rx="3.5" fill="#6b4a36"/>'
    for i in range(3):
        for j in range(4):
            g += f'<rect x="{-36 + j * 20}" y="{-10 + i * 16}" width="12" height="10" rx="2.5" fill="{marca if (i, j) == (1, 2) else "#eeeae4"}"/>'
    return g + '</g>'

def tarjeta(x, y, w, h):
    return f'<rect x="{x - w / 2:.0f}" y="{y - h / 2:.0f}" width="{w}" height="{h}" rx="12" fill="#fff" stroke="#e6e0d8" stroke-width="3"/>'

# ── Mis cabras ───────────────────────────────────────────────────────────────
def cabras():
    g = mechon(-190, 165) + mechon(175, -180) + flor(-205, 20) + flor(205, 150, '#ffffff') + flor(90, 205)
    g += cerca(-200, -200, 60, -200, 6) + cerca(-200, -200, -200, 40, 5)
    g += cabra(-110, -140, 0.78, 'cafe', 1) + cabra(40, -120, 0.74, 'crema', -1)
    g += caja(120, -190, 70, 46, 30, '#f2d27a', '#e3bb55', '#cfa641')                       # paca de heno
    g += cabra(-60, -20, 1.0, 'blanca', 1, ubre=True) + cabra(130, -10, 0.82, 'cafe', -1)
    g += persona(-160, 110, 1.0, 1)
    g += cabra(60, 100, 0.9, 'crema', -1, ubre=True) + cabra(-40, 150, 0.56, 'blanca', 1) 
    g += letrero(200, 120, 'MIS CABRAS')
    return lienzo(g)

# ── Reproducción ─────────────────────────────────────────────────────────────
def reproduccion():
    g = mechon(-190, 160) + mechon(180, -175) + flor(-205, 70) + flor(200, 110, '#ffffff') + flor(-60, 205)
    g += caja(-200, -200, 150, 110, 70, '#e7dccb', '#f1c9c4', '#e3b0aa')                    # paridera
    T = [iso(-212, -212, 70), iso(-38, -212, 70), iso(-38, -78, 70), iso(-212, -78, 70)]
    cumbre = [iso(-125, -212, 124), iso(-125, -78, 124)]
    g += poly([T[3], T[2], cumbre[1]], '#f1c9c4') + poly([T[1], T[2], cumbre[1], cumbre[0]], '#d86a8c') + poly([T[0], T[3], cumbre[1], cumbre[0]], '#e983a2')
    hx, hy = iso(40, 100); g += f'<ellipse cx="{hx:.0f}" cy="{hy:.0f}" rx="150" ry="62" fill="#f2d27a"/><ellipse cx="{hx:.0f}" cy="{hy - 5:.0f}" rx="132" ry="52" fill="#f7dd95"/>'   # cama de paja
    g += cabra(110, -110, 1.02, 'cafe', -1)                                                    # macho
    g += cabra(-30, 40, 1.0, 'blanca', 1, ubre=True)                                           # madre
    g += cabra(90, 110, 0.52, 'blanca', -1) + cabra(20, 150, 0.48, 'crema', 1) + cabra(140, 60, 0.45, 'cafe', -1)
    cx, cy = 850, 395
    g += corazon(cx, cy - 150, 2.0) + corazon(cx + 60, cy - 186, 1.0, '#f6a5b8') + corazon(cx - 56, cy - 180, 0.8, '#f6a5b8')
    px, py = iso(-170, 150); g += calendario(px, py - 96, 0.95)
    g += f'<rect x="{px - 4:.0f}" y="{py - 56:.0f}" width="8" height="58" rx="3" fill="#a9703c"/>'
    return lienzo(g)

# ── Salud y vacunas ──────────────────────────────────────────────────────────
def vacunas():
    g = mechon(-185, 170) + mechon(185, -170) + flor(-205, 40) + flor(205, 90, '#ffffff')
    g += caja(-190, -190, 120, 90, 60, '#f4f7fa', '#dfe7ee', '#c9d5df')                        # puesto veterinario
    kx, ky = iso(-130, -100, 60)
    g += f'<rect x="{kx - 34:.0f}" y="{ky - 78:.0f}" width="68" height="50" rx="8" fill="#fff" stroke="#e6e0d8" stroke-width="3"/><path d="M{kx - 6:.0f},{ky - 68:.0f} h12 v9 h9 v12 h-9 v9 h-12 v-9 h-9 v-12 h9 z" fill="#d9534f"/>'
    g += cabra(30, -90, 0.8, 'cafe', -1) + cabra(150, -30, 0.7, 'crema', -1)
    g += cabra(40, 70, 1.05, 'blanca', -1, ubre=True)
    g += persona(-110, 80, 1.02, 1, tabla=False)
    # jeringa en la mano
    jx, jy = iso(-110, 80); jx += 44; jy -= 96
    g += f'<g transform="translate({jx:.0f},{jy:.0f}) rotate(-24)"><rect x="-4" y="-8" width="62" height="16" rx="5" fill="#eaf4fb" stroke="#7fb3d6" stroke-width="3"/><rect x="10" y="-5" width="30" height="10" rx="3" fill="#59b3e6"/><rect x="-18" y="-3" width="16" height="6" fill="#7d8793"/><rect x="-22" y="-11" width="6" height="22" rx="2" fill="#55606e"/><path d="M58,0 h24" stroke="#7d8793" stroke-width="3" stroke-linecap="round"/></g>'
    # botiquín y escudo
    g += caja(110, 120, 70, 44, 40, '#f4f7fa', '#e06a62', '#c9534c')
    bx, by = iso(145, 142, 40); g += f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="0"/>' + f'<path d="M{bx - 5:.0f},{by - 12:.0f} h10 v7 h9 v9 h-9 v7 h-10 v-7 h-9 v-9 h9 z" fill="#d9534f"/>' + f'<path d="M{bx - 34:.0f},{by - 6:.0f} h10 v-8 h9 v8 h10 v9 h-10 v8 h-9 v-8 h-10 z" fill="#fff" transform="skewY(-30) translate(0,{bx * 0.577 - 20:.0f})" opacity="0"/>'
    sx, sy = iso(160, -150); sy -= 150
    g += f'<path d="M{sx},{sy - 52} l44,16 v34 q0,40 -44,58 q-44,-18 -44,-58 v-34 z" fill="#3f8fd0"/><path d="M{sx},{sy - 52} l44,16 v34 q0,40 -44,58 z" fill="#3279b5"/>'
    g += f'<path d="M{sx - 8},{sy - 26} h16 v14 h14 v16 h-14 v14 h-16 v-14 h-14 v-16 h14 z" fill="#fff"/>'
    return lienzo(g)

# ── Producción de leche ──────────────────────────────────────────────────────
def leche():
    g = mechon(-190, 165) + mechon(185, -170) + flor(-205, 30) + flor(200, 60, '#ffffff')
    g += caja(-200, -200, 160, 100, 64, '#e7dccb', '#f4e3b4', '#e6cf93')                      # sala de ordeño
    T = [iso(-212, -212, 64), iso(-28, -212, 64), iso(-28, -88, 64), iso(-212, -88, 64)]
    cumbre = [iso(-120, -212, 116), iso(-120, -88, 116)]
    g += poly([T[3], T[2], cumbre[1]], '#f4e3b4') + poly([T[1], T[2], cumbre[1], cumbre[0]], '#d99a2b') + poly([T[0], T[3], cumbre[1], cumbre[0]], '#eeb144')
    g += cantina(90, -160, 1.0) + cantina(140, -130, 0.92)
    g += caja(-60, -20, 150, 110, 24, '#d9a56a', '#a9703c', '#8f5c30')                        # tarima de ordeño
    g += f'<g transform="translate(0,-24)">{cabra(20, 40, 1.12, "blanca", 1, ubre=True)}</g>'
    g += balde(-20, 130, 1.25)
    gx, gy = iso(-6, 60, 24)
    g += f'<path d="M{gx - 22:.0f},{gy - 34:.0f} q-6,26 -30,44" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" stroke-dasharray="2 9"/>'
    g += persona(-170, 110, 0.98, 1, tabla=False)
    g += cabra(160, 60, 0.74, 'cafe', -1, ubre=True) + cabra(120, 160, 0.66, 'crema', -1, ubre=True)
    # botella y gota
    bx, by = 1000, 250
    g += tarjeta(bx, by, 112, 112)
    g += f'<path d="M{bx - 12},{by - 40} h24 v14 q14,10 14,26 v32 q0,8 -8,8 h-36 q-8,0 -8,-8 v-32 q0,-16 14,-26 z" fill="#eaf4fb" stroke="#7fb3d6" stroke-width="3"/><path d="M{bx - 23},{by + 6} h46 v26 q0,5 -5,5 h-36 q-5,0 -5,-5 z" fill="#fff"/><rect x="{bx - 14}" y="{by - 46}" width="28" height="10" rx="4" fill="#f2b84b"/>'
    return lienzo(g)

# ── Control de peso ──────────────────────────────────────────────────────────
def peso():
    g = mechon(-190, 165) + mechon(185, -170) + flor(-205, 30) + flor(205, 120, '#ffffff') + flor(60, 205)
    g += cerca(-200, -200, 40, -200, 5)
    g += cabra(-120, -130, 0.78, 'cafe', 1) + cabra(-10, -150, 0.7, 'crema', 1)
    # báscula: plataforma, poste y pantalla
    g += caja(-50, -50, 170, 130, 14, '#dfe5ec', '#c98d52', '#a9703c')
    g += caja(-36, -36, 142, 102, 6, '#f4f7fa', '#b9c2cc', '#9aa5b1', z=14)
    ox, oy = iso(150, -70)
    g += f'<rect x="{ox - 6:.0f}" y="{oy - 150:.0f}" width="12" height="152" rx="4" fill="#b9c2cc"/>'
    g += f'<rect x="{ox - 46:.0f}" y="{oy - 208:.0f}" width="92" height="64" rx="10" fill="#3d4f66"/><rect x="{ox - 36:.0f}" y="{oy - 198:.0f}" width="72" height="44" rx="6" fill="#bfe7c4"/>'
    g += f'<text x="{ox:.0f}" y="{oy - 167:.0f}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="24" fill="#1f5f32">42 kg</text>'
    g += f'<g transform="translate(0,-20)">{cabra(30, 20, 1.1, "blanca", 1, ubre=True)}</g>'
    g += persona(-160, 100, 1.0, 1)
    g += cabra(120, 150, 0.62, 'crema', -1) + cabra(-50, 170, 0.5, 'cafe', 1)
    # tarjeta con la curva de crecimiento
    tx, ty = 1000, 215
    g += tarjeta(tx, ty, 124, 92)
    g += f'<path d="M{tx - 44},{ty + 28} L{tx - 20},{ty + 10} L{tx + 4},{ty + 14} L{tx + 26},{ty - 8} L{tx + 46},{ty - 26}" stroke="#7c5cc4" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    g += ''.join(f'<circle cx="{tx + dx}" cy="{ty + dy}" r="5" fill="#7c5cc4"/>' for dx, dy in [(-44, 28), (-20, 10), (4, 14), (26, -8), (46, -26)])
    return lienzo(g)

# ── Genealogía ───────────────────────────────────────────────────────────────
def genealogia():
    g = mechon(-190, 170) + mechon(190, -165) + flor(-205, 60) + flor(205, 40, '#ffffff')
    # árbol frondoso al fondo
    ax, ay = iso(-150, -150)
    g += f'<ellipse cx="{ax:.0f}" cy="{ay + 2:.0f}" rx="46" ry="12" fill="#000" opacity="0.10"/><rect x="{ax - 11:.0f}" y="{ay - 96:.0f}" width="22" height="98" rx="8" fill="#a9703c"/>'
    g += f'<circle cx="{ax - 34:.0f}" cy="{ay - 118:.0f}" r="44" fill="#3f9e63"/><circle cx="{ax + 36:.0f}" cy="{ay - 122:.0f}" r="48" fill="#58b877"/><circle cx="{ax:.0f}" cy="{ay - 162:.0f}" r="50" fill="#6cc98a"/>'
    # caminos que unen padres e hija (sobre el pasto)
    A, B, Hc = iso(-40, -120), iso(130, -20), iso(40, 120)
    M = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
    g += f'<path d="M{A[0]:.0f},{A[1]:.0f} L{B[0]:.0f},{B[1]:.0f} M{M[0]:.0f},{M[1]:.0f} L{Hc[0]:.0f},{Hc[1]:.0f}" stroke="#f7efd9" stroke-width="16" stroke-linecap="round"/>'
    g += f'<path d="M{A[0]:.0f},{A[1]:.0f} L{B[0]:.0f},{B[1]:.0f} M{M[0]:.0f},{M[1]:.0f} L{Hc[0]:.0f},{Hc[1]:.0f}" stroke="#2f9e8f" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 12"/>'
    g += cabra(-40, -120, 0.95, 'cafe', 1) + cabra(130, -20, 0.92, 'blanca', -1, ubre=True)
    g += cabra(40, 120, 0.62, 'crema', 1)
    g += persona(-170, 110, 0.98, 1)
    # diagrama del árbol genealógico
    dx, dy = iso(150, -170); dy -= 150
    g += tarjeta(dx, dy, 150, 124)
    nodos = [(-44, -34, '#9a6447'), (44, -34, '#e3dad0'), (0, 30, '#e9cfa6')]
    g += f'<path d="M{dx - 44},{dy - 34} V{dy - 4} H{dx + 44} V{dy - 34} M{dx},{dy - 4} V{dy + 30}" stroke="#2f9e8f" stroke-width="4" fill="none" stroke-linejoin="round"/>'
    g += ''.join(f'<circle cx="{dx + x}" cy="{dy + y}" r="17" fill="{c}" stroke="#2f9e8f" stroke-width="4"/>' for x, y, c in nodos)
    return lienzo(g)

# ── Reportes ─────────────────────────────────────────────────────────────────
def reportes():
    g = mechon(-190, 170) + mechon(190, -165) + flor(-205, 60) + flor(205, 120, '#ffffff') + flor(-40, 205)
    g += caja(-190, -190, 130, 80, 56, '#d9a56a', '#c98d52', '#a9703c')                       # escritorio
    lx, ly = iso(-125, -150, 56)
    g += f'<rect x="{lx - 38:.0f}" y="{ly - 52:.0f}" width="76" height="50" rx="6" fill="#3d4f66"/><rect x="{lx - 31:.0f}" y="{ly - 46:.0f}" width="62" height="36" rx="3" fill="#cfe3f5"/>'
    g += ''.join(f'<rect x="{lx - 24 + i * 14:.0f}" y="{ly - 16 - h:.0f}" width="9" height="{h}" fill="{c}"/>' for i, (h, c) in enumerate([(12, '#4a7fc9'), (22, '#2f9e5b'), (16, '#f2b84b'), (26, '#7c5cc4')]))
    # informe grande en un atril
    rx, ry = iso(70, -60)
    g += f'<path d="M{rx - 54:.0f},{ry:.0f} L{rx:.0f},{ry - 60:.0f} L{rx + 54:.0f},{ry:.0f}" stroke="#a9703c" stroke-width="8" stroke-linecap="round" fill="none"/>'
    g += f'<rect x="{rx - 92:.0f}" y="{ry - 268:.0f}" width="184" height="214" rx="12" fill="#fff" stroke="#e6e0d8" stroke-width="4"/><rect x="{rx - 30:.0f}" y="{ry - 280:.0f}" width="60" height="22" rx="8" fill="#55606e"/>'
    g += ''.join(f'<rect x="{rx - 70 + i * 30:.0f}" y="{ry - 156 - h:.0f}" width="20" height="{h}" rx="4" fill="{c}"/>' for i, (h, c) in enumerate([(34, '#4a7fc9'), (58, '#2f9e5b'), (44, '#f2b84b'), (76, '#5b6fd6'), (62, '#ef6b7b')]))
    g += f'<path d="M{rx - 76},{ry - 152} h152" stroke="#cfc9c0" stroke-width="3"/>'
    for i, w in enumerate([140, 110, 124]):
        g += f'<rect x="{rx - 70:.0f}" y="{ry - 134 + i * 20:.0f}" width="{w}" height="9" rx="4.5" fill="#eeeae4"/>'
    g += f'<circle cx="{rx + 50:.0f}" cy="{ry - 88:.0f}" r="0" fill="none"/>'
    g += persona(-80, 60, 1.02, 1)
    g += cabra(120, 120, 0.9, 'blanca', -1, ubre=True) + cabra(-10, 170, 0.56, 'cafe', 1)
    # torta de porcentajes
    tx, ty = 1000, 300
    g += f'<circle cx="{tx:.0f}" cy="{ty:.0f}" r="40" fill="#5b6fd6"/><path d="M{tx:.0f},{ty:.0f} L{tx:.0f},{ty - 40:.0f} A40,40 0 0 1 {tx + 38:.0f},{ty + 12:.0f} Z" fill="#f2b84b"/><path d="M{tx:.0f},{ty:.0f} L{tx + 38:.0f},{ty + 12:.0f} A40,40 0 0 1 {tx - 6:.0f},{ty + 39.5:.0f} Z" fill="#2f9e5b"/><circle cx="{tx:.0f}" cy="{ty:.0f}" r="15" fill="#fff"/>'
    return lienzo(g)

# ── Alertas ──────────────────────────────────────────────────────────────────
def alertas():
    g = mechon(-190, 170) + mechon(190, -165) + flor(-205, 60) + flor(205, 120, '#ffffff') + flor(-30, 205)
    g += cerca(-200, -200, 20, -200, 5) + cerca(-200, -200, -200, -20, 4)
    g += cabra(-110, -120, 0.8, 'cafe', 1)
    # poste con campana
    bx, by = iso(60, -90)
    g += f'<ellipse cx="{bx:.0f}" cy="{by + 2:.0f}" rx="30" ry="8" fill="#000" opacity="0.10"/><rect x="{bx - 7:.0f}" y="{by - 210:.0f}" width="14" height="212" rx="5" fill="#a9703c"/><rect x="{bx - 7:.0f}" y="{by - 200:.0f}" width="96" height="12" rx="5" fill="#b97d45"/>'
    cx, cy = bx + 70, by - 130
    g += f'<path d="M{cx},{cy - 60} v-8" stroke="#6b4a36" stroke-width="5"/><path d="M{cx - 46},{cy + 22} q10,-10 10,-34 q0,-44 36,-48 q36,4 36,48 q0,24 10,34 z" fill="#f7a23b"/><path d="M{cx},{cy - 60} q36,4 36,48 q0,24 10,34 h-46 z" fill="#e58a1f"/>'
    g += f'<rect x="{cx - 52}" y="{cy + 18}" width="104" height="13" rx="6.5" fill="#d97a12"/><circle cx="{cx}" cy="{cy + 42}" r="11" fill="#6b4a36"/>'
    g += f'<circle cx="{cx + 40}" cy="{cy - 46}" r="20" fill="#d9534f" stroke="#fff" stroke-width="4"/><text x="{cx + 40}" y="{cy - 38}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="24" fill="#fff">3</text>'
    g += f'<path d="M{cx - 66},{cy - 30} q-12,16 -4,36 M{cx - 82},{cy - 40} q-18,26 -6,56" stroke="#f7a23b" stroke-width="5" stroke-linecap="round" fill="none"/>'
    g += cabra(30, 70, 1.0, 'blanca', -1, ubre=True) + cabra(150, 90, 0.62, 'crema', -1)
    g += persona(-130, 110, 1.0, 1)
    g += calendario(372, 190, 1.05, '#f7a23b')
    g += cabra(60, 170, 0.5, 'cafe', 1)
    return lienzo(g)

for nombre, f in [('ModuloCorrales', corrales), ('ModuloBienestar', bienestar), ('ModuloClasificacion', clasificacion),
                  ('ModuloCabras', cabras), ('ModuloReproduccion', reproduccion), ('ModuloVacunas', vacunas), ('ModuloLeche', leche),
                  ('ModuloPeso', peso), ('ModuloGenealogia', genealogia), ('ModuloReportes', reportes), ('ModuloAlertas', alertas)]:
    open(f'{OUT}/{nombre}.svg', 'w').write(f())
