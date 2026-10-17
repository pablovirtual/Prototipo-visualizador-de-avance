# Visualizador de Avance Curricular

Aplicación web de página única (SPA) para visualizar la malla curricular de una carrera universitaria. Organiza las materias por semestre y presenta de forma clara su nombre, código y cantidad de créditos.

El proyecto utiliza datos estáticos locales, por lo que no requiere backend ni conexión a una base de datos.

## Funcionalidades actuales

- Muestra la malla curricular completa agrupada por semestre.
- Ordena los semestres de forma ascendente.
- Renderiza una tarjeta por materia con su ID, nombre y créditos.
- Permite marcar y desmarcar materias como cursadas mediante controles accesibles.
- Conserva el avance en el navegador utilizando `localStorage`.
- Calcula el porcentaje, las materias y los créditos completados.
- Permite restablecer el avance guardado con confirmación previa.
- Desbloquea automáticamente las materias cuando se cumplen todos sus prerrequisitos.
- Distingue visualmente materias disponibles, cursadas y bloqueadas.
- Filtra la malla para mostrar todas las materias o solamente las cursadas, disponibles o bloqueadas.
- Actualiza los contadores de cada filtro al cambiar el avance curricular.
- Presenta un estado vacío con una acción de recuperación cuando un filtro no tiene resultados.
- Explica qué materias faltan cuando una asignatura permanece bloqueada.
- Corrige de forma encadenada las materias dependientes al desmarcar un prerrequisito.
- Valida las referencias del plan de estudios y tolera datos persistidos inconsistentes.
- Adapta la visualización a pantallas de escritorio y móviles.
- Permite recorrer y activar los filtros mediante teclado, con estados anunciados para tecnologías de asistencia.
- Permite descargar un reporte PDF con las estadísticas y materias cursadas.

## Incremento del Sprint 4

El cuarto sprint incorporó la exploración de la malla por estado académico:

- **HU-09:** filtrar materias cursadas, disponibles y bloqueadas.
- **HU-10:** consultar contadores que responden al avance registrado.
- **HU-11:** recibir una respuesta accesible cuando un filtro no contiene resultados.

Los filtros son únicamente una forma de visualización. No modifican el avance guardado ni las
reglas de prerrequisitos.

## Tecnologías

- Vue 3 con Composition API y `<script setup>`.
- Vite.
- CSS puro.

## Incremento del Sprint 5

El quinto sprint incorpora evidencia académica descargable y validación de la experiencia completa:

- **HU-12:** descargar un reporte del avance curricular en formato PDF.
- **HU-13:** consultar en el reporte el porcentaje, las materias, los créditos y el detalle de asignaturas cursadas.
- **HU-14:** validar con Playwright la persistencia, los filtros y la descarga en un navegador real.

La aplicación conserva la selección mediante `localStorage`; el reporte funciona como
evidencia portable del estado registrado en el navegador.

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

Ejecuta las pruebas automatizadas de reglas curriculares:

```bash
npm test
```

Instala Chromium para Playwright y ejecuta las pruebas de extremo a extremo:

```bash
npx playwright install chromium
npm run test:e2e
```

Previsualiza la compilación de producción:

```bash
npm run preview
```

## Despliegue

El proyecto se publica automáticamente en GitHub Pages mediante GitHub Actions cada
vez que se envían cambios a la rama `main`. También es posible ejecutar el flujo
manualmente desde la pestaña **Actions** del repositorio.

Sitio del prototipo:

https://pablovirtual.github.io/Prototipo-visualizador-de-avance/

## Estructura principal

```text
src/
  assets/style.css              Estilos globales de la aplicación
  components/SemesterGroup.vue  Sección visual de cada semestre
  components/SubjectCard.vue    Tarjeta visual de una materia
  data/plan_estudios.json       Datos locales de la malla curricular
  utils/curriculum.js           Reglas de prerrequisitos, avance, filtros y estadísticas
  App.vue                       Agrupa las materias y compone la vista principal
  main.js                       Punto de entrada de Vue
tests/
  curriculum.test.js            Pruebas automatizadas de reglas, filtros y estadísticas
  report.test.js                Pruebas de contenido y generación del reporte PDF
e2e/
  curriculum.spec.js            Pruebas E2E de persistencia, filtros y descarga
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

El campo `prerrequisitos` almacena IDs de otras materias. Una materia se presenta como
disponible cuando todos esos IDs aparecen entre las materias cursadas. Las referencias
inexistentes se detectan mediante la validación y no desbloquean una asignatura.

## Persistencia del avance

Las materias cursadas se guardan en el navegador con la clave
`avanceCurricular.materiasCursadas`. El valor es un arreglo JSON con los IDs de las
materias seleccionadas. La información es local al navegador y no se sincroniza entre
dispositivos.

Al cargar la aplicación, los datos guardados se normalizan para eliminar IDs inexistentes
y selecciones que no cumplan la cadena de prerrequisitos. Esto mantiene el avance en un
estado académico coherente.

## Reporte del avance

La opción **Descargar reporte PDF** genera `reporte-avance-curricular.pdf`. El documento
incluye la fecha de generación, porcentaje de avance, materias y créditos completados,
así como el detalle de cada asignatura cursada.
