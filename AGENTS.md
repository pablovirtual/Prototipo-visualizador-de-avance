# Repository Guide

## Commands

- `npm run dev` starts the Vite development server.
- `npm run build` is the only configured verification command; no test, lint, or typecheck scripts exist.
- `npm run preview` serves the production build locally.

## Application Structure

- `src/main.js` mounts `App.vue` and imports the single global stylesheet at `src/assets/style.css`.
- `App.vue` imports `src/data/plan_estudios.json`, groups entries by numeric `semestre`, sorts semesters ascending, and renders each group with `SemesterGroup.vue`.
- `SemesterGroup.vue` renders `SubjectCard.vue`; preserve this component boundary for semester-level and subject-level presentation changes.
- Subject styling is global, class-based CSS in `src/assets/style.css`, not scoped component styles.

## Curriculum Data

- Keep every `plan_estudios.json` entry shaped as `id`, `nombre`, `semestre`, `creditos`, and `prerrequisitos`.
- `prerrequisitos` contains subject IDs; keep referenced IDs valid when editing the plan.
