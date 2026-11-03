#!/usr/bin/env python3
"""Timestamps palabra por palabra de la narración.

Principal: faster-whisper local (word_timestamps=True).
Respaldo (solo si whisper no puede cargar y el config lo permite): estimación a partir de la
energía del audio + el texto del guion. Queda marcado con "fuente": "estimado" y el revisor lo reporta.

Uso: python3 scripts/transcribir.py <carpeta_episodio>
Salida: <carpeta>/palabras.json  {fuente, modelo, palabras:[{texto, inicio, fin}]}
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analizar_audio import leer_pcm, segmentos_voz  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def con_whisper(audio, cfg):
    from faster_whisper import WhisperModel  # import tardío: puede no estar instalado
    w = cfg["whisper"]
    modelo = WhisperModel(w["modelo"], device=w["dispositivo"], compute_type=w["compute_type"])
    segs, _ = modelo.transcribe(audio, language=w["idioma"], word_timestamps=True,
                                vad_filter=True, beam_size=5)
    palabras = []
    for s in segs:
        for p in s.words or []:
            t = p.word.strip()
            if t:
                palabras.append({"texto": t, "inicio": round(p.start, 3), "fin": round(p.end, 3)})
    return palabras


def estimar(audio, texto):
    """Reparte las palabras del guion sobre los tramos con voz, proporcional a su longitud."""
    x = leer_pcm(audio)
    segs = segmentos_voz(x)
    if not segs:
        raise RuntimeError("No se detectó voz en el audio")
    toks = [t for t in re.split(r"\s+", texto.strip()) if re.search(r"\w", t)]
    peso = [len(re.sub(r"\W", "", t)) + 1.5 for t in toks]
    total_voz = sum(f - i for i, f in segs)
    total_peso = sum(peso)
    # mapa "tiempo de voz acumulado" -> tiempo real
    def real(v):
        acc = 0.0
        for i, f in segs:
            if v <= acc + (f - i) or (i, f) == segs[-1]:
                return i + min(v - acc, f - i)
            acc += f - i
    out, cum = [], 0.0
    for t, p in zip(toks, peso):
        d = total_voz * p / total_peso
        out.append({"texto": t, "inicio": round(real(cum), 3), "fin": round(real(cum + d * 0.92), 3)})
        cum += d
    return out


def main():
    carpeta = sys.argv[1]
    cfg = json.load(open(os.path.join(RAIZ, "config.json")))
    audio = os.path.join(carpeta, cfg["voz"]["archivo"])
    esc = json.load(open(os.path.join(carpeta, "escenas.json")))
    texto = " ".join(f["texto"] for f in esc["frases"])
    try:
        palabras = con_whisper(audio, cfg)
        fuente, modelo = "whisper", cfg["whisper"]["modelo"]
    except Exception as e:  # noqa: BLE001
        if not cfg["whisper"].get("permitir_estimado_si_falla"):
            raise
        print(f"⚠ faster-whisper no disponible ({type(e).__name__}: {str(e)[:160]}).", file=sys.stderr)
        print("⚠ Usando timestamps ESTIMADOS. Instala faster-whisper y vuelve a correr para precisión real.", file=sys.stderr)
        palabras, fuente, modelo = estimar(audio, texto), "estimado", None
    json.dump({"fuente": fuente, "modelo": modelo, "palabras": palabras},
              open(os.path.join(carpeta, "palabras.json"), "w"), ensure_ascii=False, indent=1)
    print(f"✔ palabras.json: {len(palabras)} palabras (fuente: {fuente})")


if __name__ == "__main__":
    main()
