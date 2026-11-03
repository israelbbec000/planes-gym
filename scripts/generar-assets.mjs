#!/usr/bin/env node
// Kit de arte SVG original: estilo plano "muñecos recortables", azul/morado, contorno negro.
// Todo se dibuja aquí (sin importar imágenes de terceros) → sin copyright.
//   node scripts/generar-assets.mjs            genera/actualiza el kit completo
//
// CONTRATO DEL RIG (todos los personajes, viewBox 0 0 400 640):
//   cuerpo.svg · brazo_i.svg · brazo_d.svg · ojos_abiertos.svg · ojos_cerrados.svg · ojos_sorpresa.svg
//   boca_0.svg (cerrada) · boca_1.svg (media) · boca_2.svg (abierta) · boca_3.svg (O)
//   Pivotes: hombro izq (105,340), hombro der (295,340). Pies en y≈625.
// Para añadir un personaje: copia una función de personaje, cambia colores/rasgos y mantén el contrato.
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from './lib.mjs';

const C = {
  tinta: '#111111', azul: '#3F7BF0', azulOsc: '#2347B5', azulCl: '#8FB8FF', morado: '#7A4DE0', moradoOsc: '#4B2A9E',
  lila: '#CDB8FF', lilaCl: '#E3D8FF', piel: '#F6C9A0', pielSombra: '#E5AE82', blanco: '#FFFFFF', amarillo: '#FFD23F',
  rosa: '#FF9AA2', boca: '#7A1F2B', gris: '#D9D9E8', pantalon: '#2B2F77',
};
const L = `stroke="${C.tinta}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;
const L5 = `stroke="${C.tinta}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

function rng(seed) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }
const svg = (w, h, cuerpo, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs}${cuerpo}</svg>\n`;
function escribir(rel, contenido) {
  const p = path.join(RAIZ, 'assets', rel);
  fs.mkdirSync(path.dirname(p), {recursive: true});
  fs.writeFileSync(p, contenido);
}

// ───────────── Cara compartida (mismas posiciones en todos los personajes) ─────────────
const OJOS = {
  abiertos: (extra = '') => `
    <ellipse cx="160" cy="188" rx="24" ry="30" fill="#fff" ${L5}/><ellipse cx="240" cy="188" rx="24" ry="30" fill="#fff" ${L5}/>
    <circle cx="164" cy="194" r="12" fill="${C.tinta}"/><circle cx="236" cy="194" r="12" fill="${C.tinta}"/>
    <circle cx="169" cy="188" r="4" fill="#fff"/><circle cx="241" cy="188" r="4" fill="#fff"/>${extra}`,
  cerrados: (extra = '') => `
    <path d="M136 192 Q160 212 184 192" fill="none" ${L}/><path d="M216 192 Q240 212 264 192" fill="none" ${L}/>${extra}`,
  sorpresa: (extra = '') => `
    <path d="M128 140 Q160 118 190 140" fill="none" ${L}/><path d="M210 140 Q240 118 272 140" fill="none" ${L}/>
    <ellipse cx="160" cy="190" rx="29" ry="37" fill="#fff" ${L5}/><ellipse cx="240" cy="190" rx="29" ry="37" fill="#fff" ${L5}/>
    <circle cx="160" cy="190" r="8" fill="${C.tinta}"/><circle cx="240" cy="190" r="8" fill="${C.tinta}"/>${extra}`,
};
const LENTES = `<circle cx="160" cy="190" r="36" fill="#ffffff22" ${L5}/><circle cx="240" cy="190" r="36" fill="#ffffff22" ${L5}/><path d="M196 188 H204" ${L5}/>`;
const BOCAS = [
  `<path d="M168 246 Q200 266 232 246" fill="none" ${L}/>`,
  `<ellipse cx="200" cy="252" rx="17" ry="11" fill="${C.boca}" ${L5}/>`,
  `<path d="M162 238 Q200 304 238 238 Z" fill="${C.boca}" ${L5}/><ellipse cx="200" cy="270" rx="18" ry="9" fill="${C.rosa}"/>`,
  `<ellipse cx="200" cy="258" rx="17" ry="24" fill="${C.boca}" ${L5}/>`,
];

function escribirPersonaje(id, {cuerpo, brazoI, brazoD, extraOjos = ''}) {
  const w = (c) => svg(400, 640, c);
  const d = `personajes/${id}`;
  escribir(`${d}/cuerpo.svg`, w(cuerpo));
  escribir(`${d}/brazo_i.svg`, w(brazoI));
  escribir(`${d}/brazo_d.svg`, w(brazoD));
  escribir(`${d}/ojos_abiertos.svg`, w(OJOS.abiertos(extraOjos)));
  escribir(`${d}/ojos_cerrados.svg`, w(OJOS.cerrados(extraOjos)));
  escribir(`${d}/ojos_sorpresa.svg`, w(OJOS.sorpresa(extraOjos)));
  BOCAS.forEach((b, i) => escribir(`${d}/boca_${i}.svg`, w(b)));
  escribir(`${d}/rig.json`, JSON.stringify({id, viewBox: [400, 640], pivotes: {brazo_i: [105, 340], brazo_d: [295, 340]}}, null, 2) + '\n');
}

// ───────────── Protagonista (chico/chica neutral con sudadera azul y pelo morado) ─────────────
escribirPersonaje('protagonista', {
  cuerpo: `
    <rect x="142" y="470" width="50" height="135" rx="16" fill="${C.pantalon}" ${L}/><rect x="208" y="470" width="50" height="135" rx="16" fill="${C.pantalon}" ${L}/>
    <ellipse cx="160" cy="610" rx="40" ry="18" fill="#fff" ${L}/><ellipse cx="240" cy="610" rx="40" ry="18" fill="#fff" ${L}/>
    <rect x="110" y="300" width="180" height="195" rx="42" fill="${C.azul}" ${L}/>
    <rect x="158" y="425" width="84" height="46" rx="12" fill="${C.azulOsc}" ${L5}/>
    <path d="M180 306 V360 M220 306 V360" ${L5} fill="none"/>
    <circle cx="200" cy="190" r="108" fill="${C.piel}" ${L}/>
    <circle cx="94" cy="198" r="22" fill="${C.piel}" ${L}/><circle cx="306" cy="198" r="22" fill="${C.piel}" ${L}/>
    <ellipse cx="128" cy="232" rx="20" ry="12" fill="${C.rosa}" opacity=".7"/><ellipse cx="272" cy="232" rx="20" ry="12" fill="${C.rosa}" opacity=".7"/>
    <path d="M92 175 Q84 66 200 66 Q316 66 308 175 Q286 118 236 128 Q200 100 160 128 Q112 118 92 175 Z" fill="${C.morado}" ${L}/>
    <path d="M150 80 L140 30 L184 70 M216 70 L262 28 L252 82" fill="${C.morado}" ${L} />`,
  brazoI: `<rect x="83" y="324" width="44" height="128" rx="22" fill="${C.azul}" ${L}/><circle cx="105" cy="462" r="23" fill="${C.piel}" ${L}/>`,
  brazoD: `<rect x="273" y="324" width="44" height="128" rx="22" fill="${C.azul}" ${L}/><circle cx="295" cy="462" r="23" fill="${C.piel}" ${L}/>`,
});

// ───────────── Abuela (pelo gris con chongo, lentes, vestido morado, chal azul) ─────────────
escribirPersonaje('abuela', {
  cuerpo: `
    <rect x="152" y="520" width="34" height="85" rx="12" fill="${C.piel}" ${L}/><rect x="214" y="520" width="34" height="85" rx="12" fill="${C.piel}" ${L}/>
    <ellipse cx="166" cy="612" rx="38" ry="16" fill="${C.moradoOsc}" ${L}/><ellipse cx="234" cy="612" rx="38" ry="16" fill="${C.moradoOsc}" ${L}/>
    <path d="M118 300 H282 L322 548 H78 Z" fill="${C.morado}" ${L}/>
    <path d="M110 300 Q200 350 290 300 L300 372 Q200 410 100 372 Z" fill="${C.azulCl}" ${L}/>
    <circle cx="200" cy="396" r="9" fill="${C.amarillo}" ${L5}/>
    <path d="M110 470 H290" stroke="${C.moradoOsc}" stroke-width="6" fill="none"/>
    <circle cx="200" cy="82" r="38" fill="${C.gris}" ${L}/>
    <circle cx="200" cy="190" r="102" fill="${C.piel}" ${L}/>
    <circle cx="100" cy="200" r="20" fill="${C.piel}" ${L}/><circle cx="300" cy="200" r="20" fill="${C.piel}" ${L}/>
    <ellipse cx="128" cy="236" rx="20" ry="12" fill="${C.rosa}" opacity=".75"/><ellipse cx="272" cy="236" rx="20" ry="12" fill="${C.rosa}" opacity=".75"/>
    <path d="M100 185 Q92 84 200 86 Q308 84 300 185 Q280 128 230 138 Q200 112 170 138 Q120 128 100 185 Z" fill="${C.gris}" ${L}/>`,
  brazoI: `<rect x="83" y="324" width="44" height="124" rx="22" fill="${C.azulCl}" ${L}/><circle cx="105" cy="458" r="22" fill="${C.piel}" ${L}/>`,
  brazoD: `<rect x="273" y="324" width="44" height="124" rx="22" fill="${C.azulCl}" ${L}/><circle cx="295" cy="458" r="22" fill="${C.piel}" ${L}/>`,
  extraOjos: LENTES,
});

// ───────────── Fondos 1080×1920 (suelo en y=1200) ─────────────
// CUARTO
{
  let s = `<rect width="1080" height="1920" fill="${C.lila}"/>`;
  for (let x = 0; x < 1080; x += 180) s += `<rect x="${x}" y="0" width="90" height="1200" fill="${C.lilaCl}"/>`;
  s += `<rect y="1200" width="1080" height="720" fill="${C.moradoOsc}"/>`;
  for (let y = 1260; y < 1920; y += 90) s += `<rect y="${y}" width="1080" height="6" fill="#3a2080"/>`;
  s += `<rect y="1180" width="1080" height="26" fill="#2B1A6B" ${L5}/>`;
  // ventana
  s += `<g transform="translate(690,460)"><rect width="300" height="350" rx="14" fill="#7CCBFF" ${L}/><circle cx="210" cy="90" r="42" fill="${C.amarillo}" ${L5}/>
        <ellipse cx="90" cy="150" rx="60" ry="26" fill="#fff" stroke="none"/><ellipse cx="130" cy="136" rx="44" ry="26" fill="#fff"/>
        <path d="M150 0 V350 M0 175 H300" ${L}/><rect x="-18" y="-18" width="336" height="26" rx="8" fill="${C.azulOsc}" ${L}/></g>`;
  s += `<path d="M640 440 Q690 640 660 830 H720 V440 Z" fill="${C.morado}" ${L}/><path d="M1040 440 Q990 640 1020 830 H960 V440 Z" fill="${C.morado}" ${L}/>`;
  // puerta
  s += `<g transform="translate(50,690)"><rect width="230" height="510" rx="12" fill="#B07A4F" ${L}/><rect x="28" y="36" width="174" height="190" rx="8" fill="#C99366" ${L5}/><rect x="28" y="266" width="174" height="190" rx="8" fill="#C99366" ${L5}/><circle cx="190" cy="270" r="14" fill="${C.amarillo}" ${L5}/></g>`;
  // repisa con libros
  const libros = [['#3F7BF0', 70], ['#FFD23F', 54], ['#7A4DE0', 80], ['#FF6B6B', 60], ['#3F7BF0', 66], ['#2347B5', 74]];
  let x = 330; s += `<g transform="translate(0,600)">`;
  for (const [c, h] of libros) { s += `<rect x="${x}" y="${-h}" width="38" height="${h}" fill="${c}" ${L5}/>`; x += 42; }
  s += `<rect x="310" y="0" width="300" height="20" rx="6" fill="#B07A4F" ${L}/></g>`;
  // póster original (planeta con anillo)
  s += `<g transform="translate(340,780)"><rect width="190" height="250" rx="8" fill="${C.azulOsc}" ${L}/><circle cx="95" cy="115" r="46" fill="${C.amarillo}" ${L5}/><ellipse cx="95" cy="115" rx="84" ry="18" fill="none" ${L5} transform="rotate(-20 95 115)"/><path d="M30 215 H160" stroke="#fff" stroke-width="6"/></g>`;
  // alfombra
  s += `<ellipse cx="540" cy="1380" rx="440" ry="70" fill="${C.morado}" ${L}/><ellipse cx="540" cy="1380" rx="340" ry="48" fill="none" stroke="${C.lila}" stroke-width="6"/>`;
  escribir('fondos/cuarto.svg', svg(1080, 1920, s));
}
// CIUDAD
{
  const r = rng(11);
  const defs = `<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C9BFF"/><stop offset="1" stop-color="#DDF0FF"/></linearGradient></defs>`;
  let s = `<rect width="1080" height="1200" fill="url(#c)"/>`;
  s += `<circle cx="850" cy="560" r="90" fill="${C.amarillo}" ${L}/>`;
  for (const [x, y] of [[120, 520], [520, 450], [330, 700], [780, 800]]) s += `<g fill="#fff"><ellipse cx="${x}" cy="${y}" rx="90" ry="32"/><ellipse cx="${x + 50}" cy="${y - 20}" rx="60" ry="30"/><ellipse cx="${x - 40}" cy="${y - 12}" rx="46" ry="24"/></g>`;
  const capa = (n, fill, outline, hmin, hmax, ventanas) => {
    let x = -20, o = '';
    while (x < 1100) {
      const w = 90 + r() * 90, h = hmin + r() * (hmax - hmin);
      o += `<rect x="${x}" y="${1200 - h}" width="${w}" height="${h}" fill="${fill}" ${outline ? L5 : ''}/>`;
      if (ventanas) for (let yy = 1200 - h + 24; yy < 1170; yy += 46) for (let xx = x + 16; xx < x + w - 24; xx += 36) o += `<rect x="${xx}" y="${yy}" width="18" height="24" rx="3" fill="${r() > 0.35 ? C.amarillo : C.azulOsc}" opacity=".9"/>`;
      x += w - 4;
    }
    return o;
  };
  s += capa(0, '#9CB8F2', false, 250, 520, false);
  s += capa(1, C.morado, true, 180, 430, true);
  s += capa(2, C.azul, true, 90, 250, true);
  s += `<rect y="1200" width="1080" height="60" fill="#B8B8D8" ${L5}/><rect y="1260" width="1080" height="660" fill="#34345A"/>`;
  for (let x = 20; x < 1080; x += 200) s += `<rect x="${x}" y="1560" width="110" height="14" rx="4" fill="${C.amarillo}"/>`;
  s += `<rect y="1256" width="1080" height="8" fill="${C.tinta}"/>`;
  escribir('fondos/ciudad.svg', svg(1080, 1920, s, defs));
}
// ESPACIO
{
  const r = rng(5);
  const defs = `<defs><linearGradient id="e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090924"/><stop offset="1" stop-color="#241070"/></linearGradient>
    <radialGradient id="sol"><stop offset="0" stop-color="#FFF3A0"/><stop offset="1" stop-color="#FFB02E"/></radialGradient></defs>`;
  let s = `<rect width="1080" height="1920" fill="url(#e)"/>`;
  for (let i = 0; i < 160; i++) { const x = r() * 1080, y = r() * 1920, rad = 1 + r() * 3; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`; }
  s += `<circle cx="930" cy="560" r="120" fill="url(#sol)" ${L}/>`;
  s += `<circle cx="210" cy="720" r="86" fill="#C9C9DD" ${L}/><circle cx="180" cy="700" r="18" fill="#A5A5C2"/><circle cx="240" cy="750" r="24" fill="#A5A5C2"/><circle cx="226" cy="684" r="10" fill="#A5A5C2"/>`;
  s += `<g transform="translate(170,1010)"><circle r="56" fill="${C.morado}" ${L}/><ellipse rx="110" ry="22" fill="none" stroke="${C.tinta}" stroke-width="16" transform="rotate(-18)"/><ellipse rx="110" ry="22" fill="none" stroke="${C.amarillo}" stroke-width="8" transform="rotate(-18)"/></g>`;
  s += `<g transform="translate(800,1330)"><circle r="270" fill="${C.azul}" ${L}/><path d="M-170 -60 Q-120 -190 -20 -150 Q40 -100 -30 -40 Q-90 20 -170 -60Z M60 40 Q150 -20 200 70 Q170 170 80 140 Q30 100 60 40Z M-120 120 Q-60 90 -20 150 Q-60 220 -120 120Z" fill="#59C27D" ${L5}/><path d="M-250 -60 Q-100 -140 60 -230" fill="none" stroke="#fff" stroke-width="12" opacity=".5"/></g>`;
  escribir('fondos/espacio.svg', svg(1080, 1920, s, defs));
}
// Marco de gráfica
escribir('graficas/marco.svg', svg(900, 560,
  `<rect x="6" y="6" width="888" height="548" rx="36" fill="#fff" ${L}/><path d="M80 470 H840" ${L}/><path d="M80 80 V470" ${L}/>`));

// Catálogo legible por los agentes
const lista = (d, ext) => fs.readdirSync(path.join(RAIZ, 'assets', d)).filter((f) => f.endsWith(ext)).map((f) => f.replace(ext, ''));
const pers = fs.readdirSync(path.join(RAIZ, 'assets/personajes'), {withFileTypes: true}).filter((x) => x.isDirectory()).map((x) => x.name);
fs.writeFileSync(path.join(RAIZ, 'assets/CATALOGO.md'),
`# Catálogo de assets (generado por scripts/generar-assets.mjs)

- **Personajes**: ${pers.join(', ')}  (rig: cuerpo, brazo_i, brazo_d, ojos_abiertos|cerrados|sorpresa, boca_0..3)
- **Fondos**: ${lista('fondos', '.svg').join(', ')}
- **Gráficas**: marco.svg + barras dibujadas por src/Grafica.tsx
- **SFX**: ${lista('sfx', '.wav').join(', ')}
- **Música**: ${lista('musica', '.wav').join(', ')}
- **Acciones de personaje**: idle, saluda, sorpresa, grita, corre, cae, senala, piensa, feliz, caido
- **Posiciones**: izq, centro, der
`);
console.log('✔ Kit de arte generado en assets/ — personajes:', pers.join(', '));
