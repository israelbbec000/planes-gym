export type Pos = 'izq' | 'centro' | 'der';
export type Accion = 'idle' | 'saluda' | 'sorpresa' | 'grita' | 'corre' | 'cae' | 'senala' | 'piensa' | 'feliz' | 'caido';

export interface PersonajeEscena {
  id: string;
  pos?: Pos;
  accion?: Accion;
  escala?: number;
  habla?: boolean;
  espejo?: boolean;
}

export interface Camara {
  tipo: 'fija' | 'zoom' | 'paneo';
  desde?: number;
  hasta?: number;
  foco?: [number, number];
  zoom?: number;
}

export interface Grafica {
  tipo: 'barras';
  titulo?: string;
  etiquetas: string[];
  valores: number[];
  textos?: string[];
  unidad?: string;
}

export interface Frase {
  id: number;
  texto: string;
  escena: string;
  personajes: PersonajeEscena[];
  camara?: Camara;
  grafica?: Grafica | null;
  inicioFrame: number;
  finFrame: number;
}

export interface Palabra {
  texto: string;
  inicio: number;
  fin: number;
  frase: number;
  clave: string | null;
}

export type PropsEpisodio = {
  titulo: string;
  fps: number;
  ancho: number;
  alto: number;
  duracionFrames: number;
  fuenteTiempos: string;
  palabrasPorBloque: number;
  frases: Frase[];
  palabras: Palabra[];
  envolvente: number[];
};
