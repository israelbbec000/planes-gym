#!/usr/bin/env python3
"""Analiza voz.mp3: envolvente de volumen por frame (para la boca) y estadísticas.

Uso: python3 scripts/analizar_audio.py <audio> --fps 30 --salida envolvente.json
"""
import argparse, json, subprocess, sys
import numpy as np

SR = 16000


def leer_pcm(path):
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.int16).astype(np.float32) / 32768.0


def envolvente(x, ventana_s):
    n = max(1, int(SR * ventana_s))
    k = len(x) // n
    if k == 0:
        return np.zeros(0)
    return np.sqrt(np.mean(x[: k * n].reshape(k, n) ** 2, axis=1) + 1e-12)


def segmentos_voz(x, umbral_rel=0.06, hueco_min_s=0.18):
    """Devuelve [(ini_s, fin_s)] de tramos con voz, basándose en energía a 10 ms."""
    e = envolvente(x, 0.01)
    if e.size == 0:
        return []
    tope = np.percentile(e, 98)
    activo = e > max(tope * umbral_rel, 1e-4)
    segs, ini = [], None
    for i, a in enumerate(activo):
        if a and ini is None:
            ini = i
        if not a and ini is not None:
            segs.append([ini * 0.01, i * 0.01]); ini = None
    if ini is not None:
        segs.append([ini * 0.01, len(activo) * 0.01])
    fus = []
    for s in segs:
        if fus and s[0] - fus[-1][1] < hueco_min_s:
            fus[-1][1] = s[1]
        else:
            fus.append(s)
    return [tuple(s) for s in fus if s[1] - s[0] > 0.05]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--salida", required=True)
    a = ap.parse_args()
    x = leer_pcm(a.audio)
    e = envolvente(x, 1.0 / a.fps)
    tope = np.percentile(e, 95) if e.size else 1.0
    norm = np.clip(e / max(tope, 1e-6), 0, 1)
    # suavizado ligero para que la boca no parpadee
    norm = np.convolve(norm, np.array([0.25, 0.5, 0.25]), mode="same")
    pico = float(np.max(np.abs(x))) if x.size else 0.0
    out = {
        "fps": a.fps,
        "duracion_s": round(len(x) / SR, 3),
        "pico_dbfs": round(20 * np.log10(max(pico, 1e-9)), 2),
        "valores": [round(float(v), 3) for v in norm],
    }
    json.dump(out, open(a.salida, "w"))
    print(f"envolvente: {len(norm)} frames, {out['duracion_s']} s, pico {out['pico_dbfs']} dBFS")


if __name__ == "__main__":
    sys.exit(main())
