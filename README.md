# Visualizador de Avance Curricular

Aplicación web de página única (SPA) para visualizar la malla curricular de una carrera universitaria. Organiza las materias por semestre y presenta de forma clara su nombre, código y cantidad de créditos.

El proyecto utiliza datos estáticos locales, por lo que no requiere backend ni conexión a una base de datos.

## Funcionalidades actuales

- Muestra la malla curricular completa agrupada por semestre.
- Ordena los semestres de forma ascendente.
- Renderiza una tarjeta por materia con su ID, nombre y créditos.
- Incluye datos de prerrequisitos en la estructura curricular para futuras funcionalidades de avance y disponibilidad de materias.
- Adapta la visualización a pantallas de escritorio y móviles.

## Tecnologías

- Vue 3 con Composition API y `<script setup>`.
- Vite.
- CSS puro.

## Ejecución local

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Genera una compilación de producción:

```bash
npm run build
```

Previsualiza la compilación de producción:

```bash
npm run preview
```

## Estructura principal

```text
src/
  assets/style.css              Estilos globales de la aplicación
  components/SemesterGroup.vue  Sección visual de cada semestre
  components/SubjectCard.vue    Tarjeta visual de una materia
  data/plan_estudios.json       Datos locales de la malla curricular
  App.vue                       Agrupa las materias y compone la vista principal
  main.js                       Punto de entrada de Vue
```

## Datos curriculares

Las materias se definen en `src/data/plan_estudios.json`. Cada registro contiene los siguientes campos:

```json
{
  "id": "PRO101",
  "nombre": "Fundamentos de Programación",
  "semestre": 1,
  "creditos": 4,
  "prerrequisitos": []
}
```

El campo `prerrequisitos` almacena IDs de otras materias y se conservará para implementar, en futuras fases, el cálculo de avance académico y la disponibilidad de inscripción.
