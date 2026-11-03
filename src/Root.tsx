import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import type {PropsEpisodio} from './tipos';

// Props de ejemplo para el Studio (el render real recibe --props=episodios/<slug>/render-props.json)
const demo: PropsEpisodio = {
  titulo: '¿Y si tu tamaño se duplicara cada día?',
  fps: 30, ancho: 1080, alto: 1920, duracionFrames: 150, fuenteTiempos: 'demo', palabrasPorBloque: 3,
  frases: [{id: 1, texto: 'Mañana vas a medir el doble.', escena: 'cuarto', personajes: [{id: 'protagonista', pos: 'centro', accion: 'sorpresa', habla: true}], inicioFrame: 0, finFrame: 150}],
  palabras: ['Mañana', 'vas', 'a', 'medir', 'el', 'doble.'].map((t, k) => ({texto: t, inicio: 0.2 + k * 0.3, fin: 0.45 + k * 0.3, frase: 0, clave: t === 'doble.' ? 'amarillo' : null})),
  envolvente: Array.from({length: 150}, (_, k) => (k % 6 < 3 ? 0.7 : 0.1)),
};

export const Root: React.FC = () => (
  <Composition
    id="Episodio"
    component={Video}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={150}
    defaultProps={demo}
    calculateMetadata={({props}) => ({durationInFrames: props.duracionFrames, fps: props.fps, width: props.ancho, height: props.alto})}
  />
);
