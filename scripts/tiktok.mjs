#!/usr/bin/env node
// Content Posting API oficial de TikTok (OAuth 2.0 + PKCE). NUNCA publica sin confirmación.
//   node scripts/tiktok.mjs auth                    → login OAuth (abre URL, recibe el callback en localhost)
//   node scripts/tiktok.mjs subir <slug> [--simular] [--yes]
//   node scripts/tiktok.mjs estado <slug>           → consulta el estado de la última subida
//
// Modo (config.json → tiktok.modo_subida):
//   "borrador" → /v2/post/publish/inbox/video/init/  (scope video.upload): llega a tu bandeja de TikTok y lo publicas a mano
//   "privado"  → /v2/post/publish/video/init/        (scope video.publish): privacy_level SELF_ONLY
// Mientras la app no esté auditada por TikTok, solo se permite contenido privado.
// ⚠ Esta integración está escrita según la documentación pública de TikTok pero NO se pudo probar contra la API real
//   (requiere tu cuenta y tu app). Usa primero --simular y revisa la documentación vigente:
//   https://developers.tiktok.com/doc/content-posting-api-get-started
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import {RAIZ, cargarEnv, config, carpetaEpisodio, leerJson, escribirJson, args} from './lib.mjs';
import {cambiarEstado} from './historial.mjs';

cargarEnv();
const cfg = config().tiktok;
const API = 'https://open.tiktokapis.com';
const TOKENS = path.join(RAIZ, '.tiktok-tokens.json');
const {pos, flags} = args();
const [cmd, slug] = pos;

const req = (k) => { const v = process.env[k]; if (!v) throw new Error(`Falta ${k} en .env`); return v; };
const b64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function post(url, body, token, form = false) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {...(token ? {Authorization: `Bearer ${token}`} : {}), 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json; charset=UTF-8'},
    body: form ? new URLSearchParams(body).toString() : JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || (j.error && j.error.code && j.error.code !== 'ok')) throw new Error(`TikTok ${r.status}: ${JSON.stringify(j.error ?? j).slice(0, 500)}`);
  return j;
}

async function auth() {
  const key = req('TIKTOK_CLIENT_KEY'), secret = req('TIKTOK_CLIENT_SECRET'), redirect = req('TIKTOK_REDIRECT_URI');
  const scope = cfg.modo_subida === 'privado' ? 'user.info.basic,video.publish,video.upload' : 'user.info.basic,video.upload';
  const verifier = b64u(crypto.randomBytes(48));
  const challenge = b64u(crypto.createHash('sha256').update(verifier).digest());
  const state = b64u(crypto.randomBytes(16));
  const url = `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({client_key: key, scope, response_type: 'code', redirect_uri: redirect, state, code_challenge: challenge, code_challenge_method: 'S256'})}`;
  console.log('\nAbre esta URL en tu navegador, inicia sesión y autoriza:\n\n' + url + '\n');
  const code = await new Promise((res, rej) => {
    const srv = http.createServer((q, s) => {
      const u = new URL(q.url, redirect);
      if (u.pathname !== new URL(redirect).pathname) { s.end(); return; }
      s.end('Listo, ya puedes cerrar esta pestaña.');
      srv.close();
      if (u.searchParams.get('state') !== state) rej(new Error('state inválido')); else if (u.searchParams.get('error')) rej(new Error(u.searchParams.get('error_description') ?? 'error OAuth')); else res(u.searchParams.get('code'));
    }).listen(cfg.puerto_oauth);
    setTimeout(() => rej(new Error('Tiempo agotado esperando el login')), 300000);
  });
  const t = await post(`${API}/v2/oauth/token/`, {client_key: key, client_secret: secret, code, grant_type: 'authorization_code', redirect_uri: redirect, code_verifier: verifier}, null, true);
  escribirJson(TOKENS, {...t, obtenido: Date.now()});
  fs.chmodSync(TOKENS, 0o600);
  console.log('✔ Autorizado. Tokens guardados en .tiktok-tokens.json (ignorado por git).');
}

async function tokenValido() {
  if (!fs.existsSync(TOKENS)) throw new Error('No hay sesión. Corre: node scripts/tiktok.mjs auth');
  let t = leerJson(TOKENS);
  if (Date.now() > t.obtenido + (t.expires_in - 300) * 1000) {
    const n = await post(`${API}/v2/oauth/token/`, {client_key: req('TIKTOK_CLIENT_KEY'), client_secret: req('TIKTOK_CLIENT_SECRET'), grant_type: 'refresh_token', refresh_token: t.refresh_token}, null, true);
    t = {...n, obtenido: Date.now()}; escribirJson(TOKENS, t); fs.chmodSync(TOKENS, 0o600);
  }
  return t.access_token;
}

function leerDescripcion(dir) {
  const f = path.join(dir, 'descripcion.txt');
  if (!fs.existsSync(f)) throw new Error('Falta descripcion.txt (lo prepara el agente publicador).');
  const t = fs.readFileSync(f, 'utf8');
  const g = (k) => (t.match(new RegExp(`^${k}:\\s*(.+)$`, 'mi')) ?? [])[1]?.trim() ?? '';
  return {titulo: g('TÍTULO'), descripcion: g('DESCRIPCIÓN'), hashtags: g('HASHTAGS'), ia: /^s[ií]/i.test(g('CONTENIDO_IA'))};
}

async function subir() {
  const dir = carpetaEpisodio(slug);
  const video = path.join(dir, 'final.mp4');
  if (!fs.existsSync(video)) throw new Error('Falta final.mp4');
  const reporte = path.join(dir, 'reporte.md');
  if (!fs.existsSync(reporte) || /VEREDICTO:\s*RECHAZADO/i.test(fs.readFileSync(reporte, 'utf8'))) throw new Error('reporte.md ausente o RECHAZADO: no se sube.');
  const d = leerDescripcion(dir);
  const texto = `${d.descripcion} ${d.hashtags}`.trim().slice(0, 2200);
  const size = fs.statSync(video).size;
  const CHUNK = Math.min(size, 64 * 1024 * 1024); // 5–64 MB por trozo (el último puede ser mayor)
  const trozos = Math.max(1, Math.floor(size / CHUNK));
  const modo = flags.publico ? 'publico' : cfg.modo_subida;
  if (modo === 'publico' && !cfg.permitir_publico) throw new Error('Publicar público está deshabilitado (tiktok.permitir_publico=false). Publica a mano desde la app.');

  const resumen = {modo, episodio: path.basename(dir), titulo: d.titulo, texto, tamano_MB: +(size / 1e6).toFixed(1), trozos, contenido_ia: cfg.etiquetar_contenido_ia && d.ia};
  console.log(JSON.stringify(resumen, null, 2));
  if (flags.simular) { console.log('\n(simulación: no se envió nada)'); return; }

  if (!flags.yes) {
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    const r = (await rl.question(`\n¿Subir "${d.titulo}" a TikTok como ${modo.toUpperCase()}? (y/N) `)).trim().toLowerCase();
    rl.close();
    if (r !== 'y' && r !== 's') { console.log('Cancelado. No se subió nada.'); return; }
  }

  const token = await tokenValido();
  const source_info = {source: 'FILE_UPLOAD', video_size: size, chunk_size: CHUNK, total_chunk_count: trozos};
  let init;
  if (modo === 'borrador') {
    init = await post(`${API}/v2/post/publish/inbox/video/init/`, {source_info}, token);
  } else {
    const ci = await post(`${API}/v2/post/publish/creator_info/query/`, {}, token);
    const niveles = ci.data?.privacy_level_options ?? [];
    const nivel = modo === 'privado' ? 'SELF_ONLY' : 'PUBLIC_TO_EVERYONE';
    if (!niveles.includes(nivel)) throw new Error(`Tu cuenta no permite ${nivel}. Opciones: ${niveles.join(', ')}`);
    init = await post(`${API}/v2/post/publish/video/init/`, {
      post_info: {title: texto, privacy_level: nivel, disable_duet: false, disable_comment: false, disable_stitch: false, video_cover_timestamp_ms: 1500, ...(resumen.contenido_ia ? {is_aigc: true} : {})},
      source_info,
    }, token);
  }
  const {publish_id, upload_url} = init.data;
  const buf = fs.readFileSync(video);
  for (let i = 0; i < trozos; i++) {
    const ini = i * CHUNK, fin = i === trozos - 1 ? size : ini + CHUNK;
    const r = await fetch(upload_url, {method: 'PUT', headers: {'Content-Type': 'video/mp4', 'Content-Length': String(fin - ini), 'Content-Range': `bytes ${ini}-${fin - 1}/${size}`}, body: buf.subarray(ini, fin)});
    if (!r.ok && r.status !== 206) throw new Error(`Subida del trozo ${i + 1} falló: ${r.status} ${await r.text()}`);
  }
  escribirJson(path.join(dir, 'tmp', 'tiktok-publish.json'), {publish_id, modo, fecha: new Date().toISOString()});
  try { cambiarEstado(path.basename(dir), 'borrador_tiktok'); } catch { /* sin registro */ }
  console.log(`✔ Subido (publish_id ${publish_id}). Quedó como ${modo.toUpperCase()}: ${modo === 'borrador' ? 'revisa las notificaciones/borradores de la app de TikTok' : 'visible solo para ti'} y publícalo TÚ a mano.`);
}

async function estado() {
  const dir = carpetaEpisodio(slug);
  const {publish_id} = leerJson(path.join(dir, 'tmp', 'tiktok-publish.json'));
  const r = await post(`${API}/v2/post/publish/status/fetch/`, {publish_id}, await tokenValido());
  console.log(JSON.stringify(r.data, null, 2));
}

try {
  if (cmd === 'auth') await auth();
  else if (cmd === 'subir') await subir();
  else if (cmd === 'estado') await estado();
  else console.log('Uso: auth | subir <slug> [--simular] | estado <slug>');
} catch (e) { console.error('✖', e.message); process.exit(1); }
