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
// ───────────── Tema "viajes en el tiempo": máquina del tiempo + fondos ─────────────
const f1 = (n) => +n.toFixed(1);
// Reloj plano: marcas, manecillas y contorno de 7 px
function reloj(cx, cy, r, h = 300, m = 60, {fill = C.blanco, borde = C.amarillo, marcas = true} = {}) {
  let o = `<g transform="translate(${cx},${cy})"><circle r="${r}" fill="${borde}" ${L}/><circle r="${f1(r * 0.82)}" fill="${fill}" ${L5}/>`;
  if (marcas) for (let i = 0; i < 12; i++) {
    const a = (i * 30 - 90) * Math.PI / 180, big = i % 3 === 0;
    o += `<circle cx="${f1(Math.cos(a) * r * 0.66)}" cy="${f1(Math.sin(a) * r * 0.66)}" r="${f1(r * (big ? 0.07 : 0.04))}" fill="${C.tinta}"/>`;
  }
  const mano = (ang, len, w) => { const a = (ang - 90) * Math.PI / 180; return `<path d="M0 0 L${f1(Math.cos(a) * r * len)} ${f1(Math.sin(a) * r * len)}" stroke="${C.tinta}" stroke-width="${w}" stroke-linecap="round"/>`; };
  o += mano(h, 0.42, Math.max(5, r * 0.09)) + mano(m, 0.62, Math.max(4, r * 0.06)) + `<circle r="${f1(Math.max(5, r * 0.07))}" fill="${C.rosa}" ${L5}/></g>`;
  return o;
}
// Engranaje plano
function engranaje(cx, cy, r, dientes, fill, rot = 0) {
  let p = '';
  for (let i = 0; i < dientes; i++) {
    const a0 = (i / dientes) * 2 * Math.PI, w = Math.PI / dientes;
    for (const [da, rr] of [[-0.55, 0.82], [-0.35, 1.0], [0.35, 1.0], [0.55, 0.82]]) {
      const a = a0 + da * w; p += `${p ? 'L' : 'M'}${f1(Math.cos(a) * r * rr)} ${f1(Math.sin(a) * r * rr)} `;
    }
  }
  return `<g transform="translate(${cx},${cy}) rotate(${rot})"><path d="${p}Z" fill="${fill}" ${L}/><circle r="${f1(r * 0.35)}" fill="${C.lilaCl}" ${L5}/><circle r="${f1(r * 0.12)}" fill="${C.tinta}"/></g>`;
}
// MÁQUINA DEL TIEMPO (origen = centro de la base, pies en y=0, alto ≈ 780)
function maquinaTiempo() {
  let o = '';
  // plataforma con luces
  o += `<ellipse cx="0" cy="-8" rx="290" ry="46" fill="${C.moradoOsc}" ${L}/><ellipse cx="0" cy="-30" rx="262" ry="36" fill="${C.azulOsc}" ${L}/>`;
  o += `<ellipse cx="0" cy="-36" rx="200" ry="24" fill="${C.morado}" ${L5}/>`;
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.08 + i * 0.105); o += `<circle cx="${f1(-Math.cos(a) * 246)}" cy="${f1(-30 + Math.sin(a) * 30)}" r="9" fill="${i % 2 ? C.amarillo : C.rosa}" ${L5}/>`; }
  // patas de apoyo
  o += `<rect x="-120" y="-70" width="40" height="40" rx="10" fill="${C.gris}" ${L5}/><rect x="80" y="-70" width="40" height="40" rx="10" fill="${C.gris}" ${L5}/>`;
  // antena
  o += `<path d="M0 -690 V-780" ${L}/><circle cx="0" cy="-790" r="20" fill="${C.amarillo}" ${L}/><path d="M-34 -820 L-50 -842 M34 -820 L50 -842 M0 -826 V-854" ${L5} fill="none"/>`;
  // cápsula
  o += `<path d="M-175 -60 V-520 Q-175 -700 0 -700 Q175 -700 175 -520 V-60 Z" fill="${C.azul}" ${L}/>`;
  o += `<path d="M-140 -90 V-510 Q-140 -655 -40 -670" fill="none" stroke="${C.azulCl}" stroke-width="12" stroke-linecap="round"/>`;
  // reloj grande
  o += reloj(0, -535, 112, 330, 60);
  // ventana
  o += `<rect x="-95" y="-370" width="190" height="230" rx="80" fill="${C.azulCl}" ${L}/><rect x="-72" y="-348" width="144" height="186" rx="62" fill="${C.lilaCl}" ${L5}/>`;
  o += `<path d="M-40 -300 Q0 -360 40 -300 M-30 -240 Q0 -290 30 -240" fill="none" stroke="${C.morado}" stroke-width="8" stroke-linecap="round"/><path d="M-50 -190 L-20 -215" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`;
  // anillos
  for (const [y, fill] of [[-640, C.amarillo], [-420, C.morado], [-100, C.amarillo]]) o += `<rect x="-200" y="${y - 16}" width="400" height="32" rx="16" fill="${fill}" ${L}/><circle cx="-168" cy="${y}" r="7" fill="${C.tinta}"/><circle cx="168" cy="${y}" r="7" fill="${C.tinta}"/>`;
  // luces laterales
  [[-250, -300, C.rosa], [-250, -230, C.amarillo], [-250, -160, C.azulCl]].forEach(([x, y, c]) => o += `<rect x="${x}" y="${y}" width="44" height="44" rx="14" fill="${c}" ${L5}/>`);
  // consola con botón rojo
  o += `<g transform="translate(250,0)"><rect x="-44" y="-170" width="88" height="140" rx="12" fill="${C.moradoOsc}" ${L}/><rect x="-60" y="-210" width="120" height="56" rx="16" fill="${C.morado}" ${L}/>`;
  o += `<ellipse cx="0" cy="-214" rx="38" ry="14" fill="${C.gris}" ${L5}/><path d="M-30 -214 V-236 Q0 -252 30 -236 V-214 Q0 -200 -30 -214Z" fill="#E53935" ${L5}/><ellipse cx="0" cy="-236" rx="30" ry="12" fill="#FF6B6B" ${L5}/>`;
  o += `<circle cx="-18" cy="-110" r="9" fill="${C.amarillo}" ${L5}/><circle cx="18" cy="-110" r="9" fill="${C.rosa}" ${L5}/><rect x="-24" y="-80" width="48" height="12" rx="6" fill="${C.azulCl}" ${L5}/></g>`;
  // cable al suelo
  o += `<path d="M-175 -120 Q-260 -90 -330 -40" fill="none" stroke="${C.tinta}" stroke-width="12" stroke-linecap="round"/><path d="M-175 -120 Q-260 -90 -330 -40" fill="none" stroke="${C.amarillo}" stroke-width="4" stroke-linecap="round"/>`;
  return o;
}
escribir('props/maquina_tiempo.svg', svg(760, 900, `<g transform="translate(380,870)">${maquinaTiempo()}</g>`));

// LABORATORIO con la máquina (fondo "laboratorio")
{
  let s = `<rect width="1080" height="1920" fill="${C.lila}"/><rect width="1080" height="1200" fill="#D7CBFF"/>`;
  for (let x = 0; x < 1080; x += 120) s += `<rect x="${x}" y="0" width="4" height="1200" fill="${C.lila}"/>`;
  s += `<rect y="1080" width="1080" height="120" fill="${C.morado}"/><rect y="1074" width="1080" height="12" fill="${C.moradoOsc}" ${L5}/>`;
  // piso
  s += `<rect y="1200" width="1080" height="720" fill="${C.moradoOsc}"/>`;
  for (let y = 1300; y < 1920; y += 120) s += `<rect y="${y}" width="1080" height="5" fill="#3a2080"/>`;
  s += `<rect y="1182" width="1080" height="26" fill="#2B1A6B" ${L5}/>`;
  // tuberías del techo
  s += `<path d="M0 400 H260 Q300 400 300 440 V520" fill="none" stroke="${C.tinta}" stroke-width="30" stroke-linecap="round"/><path d="M0 400 H260 Q300 400 300 440 V520" fill="none" stroke="${C.azulCl}" stroke-width="18" stroke-linecap="round"/>`;
  // pantalla de datos (sin texto)
  s += `<g transform="translate(60,520)"><rect width="330" height="230" rx="18" fill="${C.azulOsc}" ${L}/><rect x="18" y="18" width="294" height="194" rx="10" fill="#0E1B52" ${L5}/><path d="M36 170 L90 120 L140 140 L200 70 L250 96 L296 44" fill="none" stroke="${C.amarillo}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="296" cy="44" r="9" fill="${C.rosa}"/></g>`;
  // estantería con frascos
  s += `<g transform="translate(60,860)"><rect width="330" height="16" rx="6" fill="#B07A4F" ${L}/>`;
  [[30, C.rosa, 70], [100, C.amarillo, 56], [160, C.azulCl, 80], [236, C.lila, 62]].forEach(([x, c, h]) => s += `<path d="M${x} 0 V${-h + 20} L${x + 8} ${-h + 20} V${-h} H${x + 36} V${-h + 20} H${x + 44} V0Z" fill="${c}" ${L5}/>`);
  s += `</g>`;
  // engranajes decorativos en la pared
  s += engranaje(960, 470, 70, 10, C.azulCl, 8) + engranaje(880, 560, 44, 8, C.amarillo, 20);
  // reloj de pared
  s += reloj(560, 470, 62, 90, 200);
  // máquina del tiempo detrás-derecha
  s += `<g transform="translate(730,1192) scale(0.95)">${maquinaTiempo()}</g>`;
  // chispas
  s += `<g fill="${C.amarillo}" ${L5}><path d="M470 640 l10 -26 l10 26 l26 10 l-26 10 l-10 26 l-10 -26 l-26 -10Z"/></g>`;
  // tapete de cables
  s += `<path d="M20 1250 Q300 1210 520 1240" fill="none" stroke="${C.tinta}" stroke-width="10" stroke-linecap="round"/>`;
  escribir('fondos/laboratorio.svg', svg(1080, 1920, s));
}

// TÚNEL / VÓRTICE TEMPORAL con relojes flotando (fondo "tunel_tiempo")
{
  const r = rng(21);
  let s = `<rect width="1080" height="1920" fill="${C.moradoOsc}"/>`;
  const cx = 540, cy = 760, cols = ['#2B1A6B', C.moradoOsc, C.morado, C.azulOsc, C.azul, C.azulCl, C.lila, C.lilaCl];
  for (let i = 0; i < 12; i++) { const rad = 1500 - i * 120; s += `<ellipse cx="${cx}" cy="${cy}" rx="${rad}" ry="${rad * 0.95}" fill="${cols[(i + 1) % cols.length]}" ${i > 4 ? L5 : ''} opacity="${i > 7 ? 1 : 0.95}"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="60" fill="#fff"/>`;
  // rayos en espiral
  for (let i = 0; i < 14; i++) { const a = i * Math.PI * 2 / 14; s += `<path d="M${f1(cx + Math.cos(a) * 110)} ${f1(cy + Math.sin(a) * 110)} Q${f1(cx + Math.cos(a + 0.6) * 380)} ${f1(cy + Math.sin(a + 0.6) * 380)} ${f1(cx + Math.cos(a + 1.1) * 900)} ${f1(cy + Math.sin(a + 1.1) * 900)}" fill="none" stroke="#fff" stroke-width="${6 + (i % 3) * 3}" stroke-linecap="round" opacity=".35"/>`; }
  // relojes flotantes (lejos del título y los subtítulos)
  [[190, 520, 78, 20, 110], [880, 470, 62, 200, 300], [120, 900, 56, 70, 10], [960, 880, 90, 150, 240], [330, 1080, 44, 300, 40], [760, 1110, 50, 10, 200], [900, 660, 34, 60, 120], [220, 690, 36, 250, 20]].forEach(([x, y, rad, h, m]) => s += reloj(x, y, rad, h, m, {borde: r() > 0.5 ? C.amarillo : C.rosa}));
  // chispas
  for (let i = 0; i < 24; i++) s += `<circle cx="${f1(r() * 1080)}" cy="${f1(400 + r() * 800)}" r="${f1(3 + r() * 5)}" fill="#fff" opacity=".8"/>`;
  // plataforma flotante
  s += `<ellipse cx="540" cy="1232" rx="360" ry="54" fill="${C.azulOsc}" ${L}/><ellipse cx="540" cy="1214" rx="330" ry="42" fill="${C.azulCl}" ${L}/><ellipse cx="540" cy="1214" rx="240" ry="28" fill="none" stroke="#fff" stroke-width="6" opacity=".7"/>`;
  s += `<rect y="1330" width="1080" height="590" fill="${C.moradoOsc}" opacity=".55"/>`;
  escribir('fondos/tunel_tiempo.svg', svg(1080, 1920, s));
}

// CIUDAD con relojes y línea de tiempo ("ayer"), fondo "ciudad_tiempo"
{
  const r = rng(33);
  const defs = `<defs><linearGradient id="ct" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B3FD0"/><stop offset="1" stop-color="#F3C6E8"/></linearGradient></defs>`;
  let s = `<rect width="1080" height="1200" fill="url(#ct)"/>`;
  // luna-reloj
  s += reloj(840, 600, 120, 60, 240, {fill: C.lilaCl, borde: C.amarillo});
  // línea de tiempo en el cielo
  s += `<path d="M40 470 Q540 380 1040 470" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="6 22" stroke-linecap="round"/>`;
  [[110, 462], [330, 428], [540, 418], [750, 428], [970, 462]].forEach(([x, y], i) => s += `<circle cx="${x}" cy="${y}" r="${i === 2 ? 20 : 14}" fill="${i === 2 ? C.rosa : C.amarillo}" ${L5}/>`);
  s += `<path d="M1010 440 L1050 472 L1004 490" fill="none" ${L5}/>`;
  // edificios
  const capa = (fill, outline, hmin, hmax, ventanas) => {
    let x = -20, o = '';
    while (x < 1100) {
      const w = 90 + r() * 90, h = hmin + r() * (hmax - hmin);
      o += `<rect x="${f1(x)}" y="${f1(1200 - h)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}" ${outline ? L5 : ''}/>`;
      if (ventanas) for (let yy = 1200 - h + 24; yy < 1170; yy += 46) for (let xx = x + 16; xx < x + w - 24; xx += 36) o += `<rect x="${f1(xx)}" y="${f1(yy)}" width="18" height="24" rx="3" fill="${r() > 0.4 ? C.amarillo : C.azulOsc}" opacity=".9"/>`;
      x += w - 4;
    }
    return o;
  };
  s += capa('#8F7BE0', false, 280, 540, false) + capa(C.morado, true, 190, 430, true);
  // torre del reloj
  s += `<g transform="translate(200,1200)"><rect x="-70" y="-640" width="140" height="640" fill="${C.azulOsc}" ${L}/><path d="M-90 -640 L0 -760 L90 -640Z" fill="${C.rosa}" ${L}/><circle cx="0" cy="-780" r="12" fill="${C.amarillo}" ${L5}/>${reloj(0, -540, 52, 330, 120)}<rect x="-30" y="-380" width="60" height="110" rx="26" fill="${C.azulCl}" ${L5}/></g>`;
  s += capa(C.azul, true, 90, 240, true);
  // relojes en fachadas
  s += reloj(520, 1060, 40, 40, 200) + reloj(960, 1040, 34, 280, 90);
  s += `<rect y="1200" width="1080" height="60" fill="#B8B8D8" ${L5}/><rect y="1260" width="1080" height="660" fill="#34345A"/>`;
  for (let x = 20; x < 1080; x += 200) s += `<rect x="${x}" y="1560" width="110" height="14" rx="4" fill="${C.amarillo}"/>`;
  s += `<rect y="1256" width="1080" height="8" fill="${C.tinta}"/>`;
  escribir('fondos/ciudad_tiempo.svg', svg(1080, 1920, s, defs));
}

// RELOJ / ESPACIO-TIEMPO para el cierre (fondo "reloj_cosmos")
{
  const r = rng(77);
  const defs = `<defs><linearGradient id="rc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090924"/><stop offset="1" stop-color="#2A1180"/></linearGradient></defs>`;
  let s = `<rect width="1080" height="1920" fill="url(#rc)"/>`;
  for (let i = 0; i < 150; i++) s += `<circle cx="${f1(r() * 1080)}" cy="${f1(r() * 1920)}" r="${f1(1 + r() * 3)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  // órbitas
  const cx = 540, cy = 780;
  for (const [rx, ry, rot] of [[470, 150, -24], [520, 180, 28]]) s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.lila}" stroke-width="5" stroke-dasharray="4 18" stroke-linecap="round" transform="rotate(${rot} ${cx} ${cy})"/>`;
  // engranajes
  s += engranaje(120, 560, 90, 12, C.moradoOsc, 5) + engranaje(980, 980, 110, 14, C.azulOsc, 10) + engranaje(210, 1010, 52, 9, C.amarillo, 0);
  // reloj gigante
  s += `<g transform="translate(${cx},${cy})"><circle r="420" fill="${C.azul}" ${L}/><circle r="370" fill="${C.lilaCl}" ${L}/><circle r="340" fill="none" stroke="${C.morado}" stroke-width="6" stroke-dasharray="3 14" stroke-linecap="round"/>`;
  for (let i = 0; i < 12; i++) { const a = (i * 30 - 90) * Math.PI / 180, big = i % 3 === 0; s += `<circle cx="${f1(Math.cos(a) * 290)}" cy="${f1(Math.sin(a) * 290)}" r="${big ? 20 : 11}" fill="${big ? C.moradoOsc : C.morado}" ${L5}/>`; }
  s += `<path d="M0 0 L-120 -120" stroke="${C.tinta}" stroke-width="22" stroke-linecap="round"/><path d="M0 0 L40 -250" stroke="${C.tinta}" stroke-width="14" stroke-linecap="round"/><path d="M0 0 L-90 150" stroke="#E53935" stroke-width="8" stroke-linecap="round"/><circle r="22" fill="${C.amarillo}" ${L}/></g>`;
  // relojitos orbitando
  s += reloj(160, 330 + 120, 46, 100, 20) + reloj(930, 440, 52, 200, 300) + reloj(130, 1130, 40, 20, 250);
  // plataforma
  s += `<ellipse cx="540" cy="1236" rx="340" ry="50" fill="${C.moradoOsc}" ${L}/><ellipse cx="540" cy="1214" rx="320" ry="40" fill="${C.morado}" ${L}/><ellipse cx="540" cy="1214" rx="230" ry="26" fill="none" stroke="${C.amarillo}" stroke-width="6"/>`;
  escribir('fondos/reloj_cosmos.svg', svg(1080, 1920, s, defs));
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
- **Props**: ${lista('props', '.svg').join(', ')}  (maquina_tiempo: cápsula con anillos, reloj, luces y botón rojo; también integrada en fondos/laboratorio)
- **Fondos tema tiempo**: laboratorio (máquina del tiempo), tunel_tiempo (vórtice con relojes), ciudad_tiempo (relojes + línea de tiempo), reloj_cosmos (reloj gigante espacio-tiempo)
- **Gráficas**: marco.svg + barras dibujadas por src/Grafica.tsx
- **SFX**: ${lista('sfx', '.wav').join(', ')}
- **Música**: ${lista('musica', '.wav').join(', ')}
- **Acciones de personaje**: idle, saluda, sorpresa, grita, corre, cae, senala, piensa, feliz, caido
- **Posiciones**: izq, centro, der
`);
console.log('✔ Kit de arte generado en assets/ — personajes:', pers.join(', '));
