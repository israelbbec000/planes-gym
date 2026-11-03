# Reporte de revisión — ¿Y si tu tamaño se duplicara cada día?

VEREDICTO: APROBADO CON AVISOS (episodio de PRUEBA del pipeline — no publicar tal cual)

## Técnico
| Check | Resultado |
|---|---|
| Duración > 60 s (ideal 70–100) | ✔ 89,2 s |
| 1080×1920, H.264 + AAC 44,1 kHz | ✔ |
| Audio y video sincronizados (±0,5 s) | ✔ |
| Saturación: pico −1,48 dBFS, 0 muestras recortadas | ✔ |
| Volumen −15,6 LUFS (objetivo −16) | ✔ |
| Timestamps de whisper reales | ⚠ ESTIMADOS (faster-whisper no pudo descargar su modelo en este entorno) |
| Voz real | ⚠ Voz PLACEHOLDER (espeak-ng, robótica) |

## Datos científicos (estatura base 1,7 m; día N = 1,7·2^N)
- ✔ Día 1 = 3,4 m («tres metros y medio», redondeo).
- ✔ Duplicar la altura → peso ×8 (volumen, k³) y sección de huesos ×4 (área, k²): ley del cuadrado-cubo; Galileo la describe en *Dos nuevas ciencias* (1638, «casi cuatrocientos años»). El guion dice «describió», no «descubrió».
- ✔ Día 3 = 13,6 m ≈ «catorce metros»; ≈ 4–5 pisos (⚠ aproximado).
- ✔ Día 5 = 54,4 m > Estatua de la Libertad (figura ≈ 46 m; con pedestal ≈ 93 m, por eso se aclara «sin contar su base»).
- ✔ Día 8 = 435 m > Torre Eiffel (≈ 330 m). ✔ Día 9 = 870 m > Burj Khalifa (828 m).
- ✔ Día 13 = 13,9 km ≈ «catorce kilómetros» > Everest (8,85 km) y altura de crucero de aviones (≈ 11 km).
- ✔ Día 23 = 14 260 km > diámetro de la Tierra (12 742 km). ✔ Día 28 = 456 000 km > distancia a la Luna (384 400 km).
- ✔ Día 30 = 1,83 millones de km > diámetro del Sol (1,39 millones de km); 2³⁰ = 1 073 741 824 («más de mil millones»).
- ✔ El guion admite que físicamente te caerías mucho antes (chiste honesto). Gráfica: barras 3,4–218 m correctas.
- Pendiente humano: confirmar la altura del Burj Khalifa y la distancia Tierra–Luna con fuente al publicar (WebSearch no se usó en este entorno de prueba; cifras de conocimiento general).

## Ortografía
Sin hallazgos en las 152 palabras únicas (acentos, ¿ ¡, números en palabras). El título lleva «duplicara» (subjuntivo, sin tilde) correcto.

## Copyright
Fondos, personajes, gráficas, música y 10 sfx: generados por scripts propios, cubiertos como CC0 en `assets/LICENCIAS.md`. 0 términos sospechosos de marcas. Sin material de terceros. Guion original.

## Avisos y acciones recomendadas
1. **Reemplazar la voz placeholder** por tu grabación o ElevenLabs y volver a correr editor (whisper real).
2. Instalar el modelo de faster-whisper (requiere acceso a Hugging Face) para subtítulos sincronizados con precisión.
3. El gancho dura ≈ 2,2 s; correcto.
