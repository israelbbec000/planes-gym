export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Layout 1080x1920 (zonas seguras de TikTok: evitar ~130px arriba y ~380px abajo para contenido clave)
export const SUELO_Y = 1215; // donde pisan los personajes (coincide con el suelo de los fondos)
export const PERSONAJE_W = 480;
export const PERSONAJE_H = 768;
export const POS_X = {izq: 270, centro: 540, der: 810} as const;

export const COLORES = {
  tinta: '#111111', azul: '#3F7BF0', morado: '#7A4DE0', moradoOsc: '#4B2A9E',
  amarillo: '#FFD23F', rojo: '#FF3B3B', blanco: '#FFFFFF',
};
export const FUENTE = `'Inter', 'Inter Display', 'DejaVu Sans', 'Arial Black', sans-serif`;
