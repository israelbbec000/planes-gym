#!/usr/bin/env node
// Genera/valida la voz de un episodio.
//   node scripts/tts.mjs <slug>                → según config.voz.modo
//        "grabada"    → comprueba que exista voz.mp3 (la pones tú)
//        "elevenlabs" → genera voz.mp3 con la API (key en .env)
//   node scripts/tts.mjs <slug> --placeholder  → voz robótica local (espeak-ng) SOLO para probar el pipeline
import fs from 'node:fs';
import path from 'node:path';
import {cargarEnv, config, carpetaEpisodio, leerJson, textoNarrado, ejecutar, duracionAudio, args} from './lib.mjs';

cargarEnv();
const {pos, flags} = args();
const dir = carpetaEpisodio(pos[0]);
const cfg = config();
const salida = path.join(dir, cfg.voz.archivo);
const escenas = leerJson(path.join(dir, 'escenas.json'));
const texto = textoNarrado(escenas);

async function elevenlabs() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('Falta ELEVENLABS_API_KEY en .env');
  const e = cfg.voz.elevenlabs;
  if (!e.voice_id || e.voice_id.startsWith('PON_')) throw new Error('Configura voice.elevenlabs.voice_id en config.json');
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${e.voice_id}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg'},
    body: JSON.stringify({
      text: texto, model_id: e.model_id, language_code: 'es',
      voice_settings: {stability: e.stability, similarity_boost: e.similarity_boost, style: e.style, speed: e.speed, use_speaker_boost: true},
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 400)}`);
  fs.writeFileSync(salida, Buffer.from(await r.arrayBuffer()));
}

function placeholder() {
  const p = cfg.voz.placeholder;
  const wav = path.join(dir, 'tmp', 'placeholder.wav');
  fs.mkdirSync(path.dirname(wav), {recursive: true});
  // Pausas naturales: espeak respeta la puntuación; separamos frases con punto y coma suave
  ejecutar('espeak-ng', ['-v', p.voz, '-s', String(p.palabras_por_minuto), '-p', String(p.tono), '-g', '4', '-w', wav, texto]);
  ejecutar('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-16:TP=-2', '-ar', '44100', '-ac', '1', '-b:a', '128k', salida]);
}

try {
  if (flags.placeholder) {
    placeholder();
    console.log(`⚠ Voz PLACEHOLDER (robótica) generada: ${salida}. Reemplázala por tu grabación o ElevenLabs antes de publicar.`);
    fs.writeFileSync(path.join(dir, 'voz.placeholder'), 'La voz de este episodio es un placeholder de prueba.\n');
  } else if (cfg.voz.modo === 'elevenlabs') {
    await elevenlabs();
    fs.rmSync(path.join(dir, 'voz.placeholder'), {force: true});
  } else if (!fs.existsSync(salida)) {
    console.error(`Modo "grabada": falta ${salida}. Graba el guion y guarda el archivo con ese nombre.`);
    process.exit(2);
  }
  console.log(`✔ ${salida} (${duracionAudio(salida).toFixed(1)} s)`);
} catch (e) { console.error('✖', e.message); process.exit(1); }
