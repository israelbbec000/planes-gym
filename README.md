# Videos "¿Y si…?" para TikTok — equipo de subagentes de Claude Code

Pipeline semiautomático que produce videos verticales **1080×1920, 70–100 s**, animación 2D plana (muñecos recortables), narración en **español de México**, título fijo arriba y **subtítulos grandes palabra por palabra**. Nicho: preguntas de ciencia y matemáticas ("¿Y si tu tamaño se duplicara cada día?").

```
/nuevo-video "tema opcional"
  ideas → guion → ⏸ apruebas guion (+ pones voz) → arte → animación → edición → revisión → ⏸ apruebas → borrador en TikTok
```

## Estructura

```
.claude/agents/     investigador-ideas · guionista · director-arte · animador · editor · publicador · revisor
.claude/commands/   /nuevo-video · /lote
config.json         voz (grabada | elevenlabs), audio, whisper, render, tiktok
.env                claves (ElevenLabs, TikTok)  ← cópialo de .env.example
scripts/            soporte (voz, whisper, sincronía, audio, render, verificación, TikTok, historial)
src/                composición Remotion (React + TypeScript)
assets/             kit SVG, música y sfx propios (CC0)
episodios/
  historial.csv     tema, fecha, duración y estado de cada episodio
  _ideas/           listas de ideas del investigador
  AAAA-MM-DD-slug/  idea.md · guion.md · escenas.json · voz.mp3 · palabras.json · render-props.json
                    audio_final.m4a · final.mp4 · reporte.md · descripcion.txt
```

## Instalación

Requisitos: **Node 20+**, **Python 3.9+**, **ffmpeg** (con `ffprobe`), y una máquina con unos 4 GB libres de RAM.

```bash
# 1. Dependencias de Node (incluye Remotion)
npm install
```
```bash
# 2. Dependencias de Python (faster-whisper + numpy), idealmente en un entorno virtual
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```
```bash
# 3. ffmpeg
#   macOS:   brew install ffmpeg
#   Ubuntu:  sudo apt install ffmpeg
#   Windows: winget install ffmpeg
ffmpeg -version
```
```bash
# 4. Claves
cp .env.example .env     # y rellena lo que vayas a usar
```
```bash
# 5. (Opcional) regenerar el kit de arte y el audio libre de derechos
node scripts/generar-assets.mjs
python3 scripts/generar_audio_assets.py
```

- **Remotion** descarga su propio Chromium la primera vez. Si tienes uno instalado, ponlo en `config.json → render.navegador` (o variable `REMOTION_BROWSER`).
- **faster-whisper** descarga el modelo (`small`, ~500 MB) la primera vez desde Hugging Face; después funciona sin internet. Para más precisión usa `"medium"` en `config.json → whisper.modelo`. Con GPU: `"dispositivo": "cuda"`, `"compute_type": "float16"`.
- **Fuente de los subtítulos**: se usa *Inter* si está instalada (con *DejaVu Sans* de respaldo). Instala una fuente gruesa (Inter, Montserrat Black…) para el mejor resultado.
- Si Remotion falla como `root` en Linux/Docker, asegúrate de que el navegador acepte `--no-sandbox` (el repo ya usa el Chromium del sistema si está en `/opt/pw-browsers/chromium`).

## Cómo se usa

1. Abre Claude Code en esta carpeta y escribe `/nuevo-video` (o `/nuevo-video "¿Y si la Luna desapareciera?"`).
2. **Pausa 1 – guion**: léelo y apruébalo. Después pon la voz:
   - **Modo `"grabada"`** (por defecto): graba el guion y guarda `episodios/<slug>/voz.mp3`.
   - **Modo `"elevenlabs"`**: pon `ELEVENLABS_API_KEY` en `.env` y tu `voice_id` en `config.json`; se genera sola.
3. Arte → animación → edición → revisión corren solos. Tarda unos 10–20 min por el render.
4. **Pausa 2 – publicación**: revisa `final.mp4` y `reporte.md`; si apruebas, el publicador sube **borrador/privado** y tú lo publicas desde la app.
5. `/lote 5` prepara 5 guiones a la vez; luego retómalos uno por uno con `/nuevo-video <slug>`.

Comandos sueltos útiles (todos reciben el slug de `episodios/`):

| Comando | Qué hace |
|---|---|
| `node scripts/validar-escenas.mjs <slug>` | valida guion (180–250 palabras) y escenas.json |
| `node scripts/tts.mjs <slug> [--placeholder]` | genera voz (ElevenLabs) o voz robótica de prueba |
| `python3 scripts/transcribir.py episodios/<slug>` | timestamps palabra por palabra (faster-whisper) |
| `node scripts/sincronizar.mjs <slug> [--sin-audio]` | arma `render-props.json` |
| `node scripts/audio.mjs <slug>` | mezcla voz + música + sfx |
| `node scripts/render.mjs <slug> [--stills] [--escala=0.5]` | render / vistas previas |
| `node scripts/verificar.mjs <slug>` | comprobaciones técnicas del `final.mp4` |
| `node scripts/historial.mjs list` | ver el registro |
| `npm run studio` | previsualizar la composición en Remotion Studio |

## Formato del guion y de `escenas.json`

Las instrucciones completas están en `.claude/agents/guionista.md`. Resumen: cada **frase** trae `texto`, `escena` (fondo), `personajes` (pos, acción, escala, `habla`), `camara` (fija/zoom/paneo), `sfx`, `claves` (palabras resaltadas) y `grafica` opcional. Acciones: `idle saluda sorpresa grita corre cae caido senala piensa feliz`.

## TikTok (publicador)

1. Crea una app en <https://developers.tiktok.com/>, añade el producto **Content Posting API** y los scopes `video.upload` (borrador) y/o `video.publish`. Registra el *Redirect URI* `http://localhost:8765/callback` y copia `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` al `.env`.
2. `node scripts/tiktok.mjs auth` (una vez) y luego `node scripts/tiktok.mjs subir <slug> --simular` para ver qué se enviaría.
3. Mientras tu app **no esté auditada**, TikTok solo permite contenido privado: por eso se sube como **borrador** (`modo_subida: "borrador"`) o **privado** (`"privado"`), y tú lo publicas a mano. Publicar público está bloqueado por configuración.
4. El script **siempre pide confirmación** y se niega a subir si `reporte.md` falta o dice RECHAZADO.

> ⚠ La integración sigue la documentación pública de la API pero **no se pudo probar contra TikTok real** al construirla; pruébala primero con `--simular` y con un video corto.

## Originalidad y Creator Rewards

- Todo el arte, la música y los efectos de este repo son **sintetizados/dibujados por scripts propios (CC0)**; los guiones los redacta el guionista desde cero con datos verificados por el investigador y el revisor. Si añades música o imágenes externas, anótalas en `assets/LICENCIAS.md`.
- Para el **Creator Rewards Program** TikTok exige videos originales de más de 1 minuto y cumplir sus requisitos de elegibilidad (seguidores, vistas, país…); consulta los vigentes. Evita contenido repetitivo o plantillado: **varía formato, personajes y estructura**, y usa **tu propia voz** (o una voz clonada tuya) en vez de la voz robótica de prueba. TikTok también pide etiquetar contenido generado con IA (el publicador lo marca en la descripción).

## Notas técnicas

- La composición es **dirigida por datos**: `render-props.json` = escenas + tiempos de whisper + envolvente de volumen (para la boca) + sfx. El render es silencioso y el audio se mezcla con ffmpeg y se une al final.
- Si faster-whisper no puede cargar, `transcribir.py` usa una **estimación** a partir de la energía del audio y lo marca (`fuente: "estimado"`); el revisor lo reporta como aviso. Con whisper real la sincronía de subtítulos es la correcta.
- Límite de audio: −16 LUFS, pico ≤ −1 dBFS (`config.json → audio`). `verificar.mjs` falla si hay saturación o el video dura ≤ 60 s.
