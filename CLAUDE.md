# Proyecto: videos "¿Y si…?" para TikTok

Equipo de subagentes en `.claude/agents/`, orquestado por `/nuevo-video` y `/lote` (`.claude/commands/`). Ver README.md.

- Cada episodio vive en `episodios/AAAA-MM-DD-slug/`; el estado en `episodios/historial.csv` (`node scripts/historial.mjs`).
- `escenas.json` es la fuente de verdad del guion y la animación; `guion.md` debe coincidir.
- **Nunca** publicar ni subir a TikTok sin aprobación explícita del usuario. Solo borrador/privado.
- Todo el contenido debe ser original y sin copyright (assets propios, ver `assets/LICENCIAS.md`).
- Valida con `node scripts/validar-escenas.mjs <slug>` y `npx tsc --noEmit` antes de renderizar.
