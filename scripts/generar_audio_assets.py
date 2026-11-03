#!/usr/bin/env python3
"""Sintetiza música y efectos de sonido ORIGINALES (sin samples ni copyright).

Todo lo que sale de aquí se genera con matemáticas puras (numpy), así que no hay
derechos de terceros. Licencia: CC0 / dominio público.
Uso: python3 scripts/generar_audio_assets.py
"""
import os, wave
import numpy as np

SR = 44100
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)


def guardar(nombre, x, carpeta):
    x = np.clip(x, -1, 1)
    p = os.path.join(RAIZ, "assets", carpeta, nombre + ".wav")
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with wave.open(p, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print("  ", p, f"{len(x) / SR:.2f}s")


def t(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def exp_dec(d, k): return np.exp(-k * t(d))
def filtro_paso_bajo(x, c):
    y = np.zeros_like(x); a = 0.0
    for i, v in enumerate(x): a += c * (v - a); y[i] = a
    return y


# ----- Efectos -----
def pop():
    d = 0.18; tt = t(d); f = 900 * np.exp(-tt * 18) + 200
    return 0.8 * np.sin(2 * np.pi * np.cumsum(f) / SR) * exp_dec(d, 22)

def whoosh():
    d = 0.55; n = rng.standard_normal(int(SR * d))
    x = filtro_paso_bajo(n, 0.05) - filtro_paso_bajo(n, 0.5) * 0.0
    x = x * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2
    return 1.8 * x / (np.max(np.abs(x)) + 1e-9) * 0.7

def boom():
    d = 1.1; tt = t(d); f = 70 * np.exp(-tt * 2.2) + 35
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * exp_dec(d, 3.2)
    ruido = filtro_paso_bajo(rng.standard_normal(len(tt)), 0.08) * exp_dec(d, 6)
    return 0.9 * (x + 0.5 * ruido)

def ding():
    d = 0.9; tt = t(d)
    x = sum(a * np.sin(2 * np.pi * f * tt) for f, a in [(1318, 1), (2637, 0.35), (3951, 0.15)])
    return 0.45 * x * exp_dec(d, 5)

def crack():
    d = 0.35; n = rng.standard_normal(int(SR * d))
    x = (n - filtro_paso_bajo(n, 0.15)) * exp_dec(d, 28)
    x += 0.5 * np.sin(2 * np.pi * 180 * t(d)) * exp_dec(d, 30)
    return 0.8 * x / (np.max(np.abs(x)) + 1e-9)

def trombon():
    notas = [(293.7, 0.35), (277.2, 0.35), (261.6, 0.35), (233.1, 0.9)]
    out = []
    for i, (f, d) in enumerate(notas):
        tt = t(d); fm = f * (1 - 0.06 * (tt / d) ** 2 if i == 3 else 1)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(np.full_like(tt, f)) / SR + (0.0 if i < 3 else 6 * np.sin(2 * np.pi * 5 * tt) * 0.2)))
        x = filtro_paso_bajo(x, 0.12) * env(len(tt), 0.02, 0.08)
        out.append(x)
    return 0.7 * np.concatenate(out)

def tada():
    notas = [(523.3, 0.12), (659.3, 0.12), (784.0, 0.12), (1046.5, 0.8)]
    out = []
    for f, d in notas:
        tt = t(d); x = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 2 * f * tt)
        out.append(x * env(len(tt), 0.005, min(0.3, d * 0.8)))
    return 0.4 * np.concatenate(out)

def zoom():
    d = 0.7; tt = t(d); f = 200 * np.exp(tt * 3.2)
    return 0.45 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.05, 0.25)

def campana():
    d = 1.4; tt = t(d)
    x = sum(a * np.sin(2 * np.pi * f * tt) for f, a in [(440, 1), (1100, 0.6), (1760, 0.3)])
    return 0.4 * x * exp_dec(d, 3)

def tick():
    d = 0.06; return 0.6 * np.sin(2 * np.pi * 1800 * t(d)) * exp_dec(d, 70)


# ----- Música: loop original, 8 compases, 104 bpm, do mayor pentatónica -----
def musica():
    bpm = 104; b = 60 / bpm; compases = 8; total = compases * 4 * b
    out = np.zeros(int(SR * total) + SR)
    def nota(inicio, f, dur, amp, timbre="marimba"):
        tt = t(dur); i0 = int(inicio * SR)
        if timbre == "marimba":
            x = np.sin(2 * np.pi * f * tt) * exp_dec(dur, 7) + 0.3 * np.sin(2 * np.pi * 4 * f * tt) * exp_dec(dur, 18)
        else:  # bajo
            x = np.sin(2 * np.pi * f * tt) * env(len(tt), 0.01, 0.15) * exp_dec(dur, 2.5)
        out[i0:i0 + len(x)] += amp * x
    C = {"C3": 130.8, "G2": 98.0, "A2": 110.0, "F2": 87.3, "C4": 261.6, "D4": 293.7, "E4": 329.6, "G4": 392.0, "A4": 440.0, "C5": 523.3, "D5": 587.3, "E5": 659.3}
    prog = [("C3", ["C4", "E4", "G4", "E4"]), ("A2", ["A4", "E4", "C4", "E4"]), ("F2", ["A4", "C5", "A4", "E4"]), ("G2", ["G4", "D4", "E4", "D4"])]
    for c in range(compases):
        bajo, arp = prog[c % 4]
        base = c * 4 * b
        nota(base, C[bajo], 2 * b, 0.5, "bajo"); nota(base + 2 * b, C[bajo], 2 * b, 0.4, "bajo")
        for k in range(8):  # corcheas
            nota(base + k * b / 2, C[arp[k % 4]], b, 0.28)
        if c % 2 == 1:      # melodía simple
            for k, n_ in enumerate(["E5", "D5", "C5", "D5"]):
                nota(base + (2 + k * 0.5) * b, C[n_], b * 0.8, 0.22)
    loop = out[:int(SR * total)]
    cola = out[int(SR * total):]
    loop[:len(cola)] += cola  # cierra la cola para que el loop sea continuo
    fade = int(0.01 * SR); loop[:fade] *= np.linspace(0, 1, fade); loop[-fade:] *= np.linspace(1, 0, fade)
    return 0.5 * loop / np.max(np.abs(loop))


if __name__ == "__main__":
    print("Efectos:")
    for n, f in [("pop", pop), ("whoosh", whoosh), ("boom", boom), ("ding", ding), ("crack", crack),
                 ("trombon", trombon), ("tada", tada), ("zoom", zoom), ("campana", campana), ("tick", tick)]:
        guardar(n, f(), "sfx")
    print("Música:")
    guardar("loop_curioso", musica(), "musica")
    open(os.path.join(RAIZ, "assets", "LICENCIAS.md"), "w").write(
        "# Licencias de assets\n\n"
        "- `assets/sfx/*.wav` y `assets/musica/*.wav`: sintetizados por `scripts/generar_audio_assets.py` "
        "(señales matemáticas propias, sin samples). **CC0 / dominio público.**\n"
        "- `assets/personajes`, `assets/fondos`, `assets/graficas`: dibujados como SVG propios por "
        "`scripts/generar-assets.mjs`. Personajes originales, sin parecido con personajes o marcas registradas. **CC0.**\n\n"
        "Si agregas música o efectos externos, anótalos aquí con su fuente y licencia (el `revisor` lo comprueba).\n")
