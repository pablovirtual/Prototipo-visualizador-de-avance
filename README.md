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
- Carga el generador PDF solo cuando se solicita la descarga, reduciendo el JavaScript inicial.
- Permite importar y seleccionar varias mallas curriculares desde archivos JSON validados.
- Conserva el progreso por separado para cada plan curricular en el navegador.
- Incluye un inicio de sesión simulado que conserva la sesión en el navegador y permite cerrarla.

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
- **HU-14:** validar con Playwright el acceso simulado, la persistencia, los filtros y la descarga en un navegador real.

La aplicación conserva la selección mediante `localStorage`; el reporte funciona como
evidencia portable del estado registrado en el navegador.

## Incremento del Sprint 6

Este incremento agrega carga diferida del reporte y soporte para planes curriculares personalizados:

- El módulo del reporte PDF, junto con `jsPDF`, se importa de forma dinámica al solicitar la descarga.
- Se pueden importar archivos JSON con arreglos de materias; los datos se validan antes de activar el plan.
- Los planes importados quedan disponibles después de recargar el navegador.
- Cada plan tiene un identificador derivado de su contenido y almacena sus materias cursadas con una clave propia.
- Los planes y su avance se guardan en `localStorage`; no se sincronizan entre navegadores ni dispositivos.

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
  components/SimulatedLogin.vue Acceso simulado para la demostración
  components/StudyPlanSelector.vue Selección e importación de planes curriculares
  components/SemesterGroup.vue  Sección visual de cada semestre
  components/SemesterPlanner.vue Simulador accesible del próximo semestre
  components/SubjectCard.vue    Tarjeta visual de una materia
  data/plan_estudios.json       Datos locales de la malla curricular
  utils/curriculum.js           Reglas de prerrequisitos, avance, filtros y estadísticas
  utils/studyPlans.js           Validación de JSON e identificación de planes personalizados
  utils/report.js               Generación del reporte PDF, cargado bajo demanda
  utils/semesterPlanner.js      Reglas de recomendación y límites de la simulación
  App.vue                       Controla sesión, planes y vista principal
  main.js                       Punto de entrada de Vue
tests/
  curriculum.test.js            Pruebas automatizadas de reglas, filtros y estadísticas
  report.test.js                Pruebas de contenido y generación del reporte PDF
e2e/
  curriculum.spec.js            Pruebas E2E de persistencia, simulación, filtros y descarga
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

También se pueden cargar otros planes mediante el selector de la aplicación. El archivo debe
ser un arreglo JSON con registros que contengan `id`, `nombre`, `semestre`, `creditos` y
`prerrequisitos`. La aplicación rechaza JSON mal formado, planes vacíos, materias incompletas,
IDs duplicados y prerrequisitos que no existan en ese plan. Solo activa y conserva los datos
cuando todas las validaciones pasan.

## Persistencia del avance

Las materias cursadas se guardan en el navegador con una clave específica por plan,
`avanceCurricular.materiasCursadas.<id-del-plan>`. El valor es un arreglo JSON con los IDs
seleccionados. El plan activo y los archivos importados también se guardan en `localStorage`.
El avance existente bajo `avanceCurricular.materiasCursadas` se conserva como compatibilidad
del plan predeterminado y se migra a su clave específica cuando se guarda de nuevo.

El identificador de cada plan importado se obtiene mediante SHA-256 sobre sus materias, de
modo que volver a cargar el mismo plan recupera el avance asociado. La información permanece
en el navegador y no se sincroniza entre dispositivos.

Al cargar la aplicación, los datos guardados se normalizan para eliminar IDs inexistentes
y selecciones que no cumplan la cadena de prerrequisitos. Esto mantiene el avance en un
estado académico coherente.

## Login simulado

La pantalla de acceso es únicamente una demostración visual: acepta cualquier correo válido y
una contraseña no vacía, sin verificar credenciales ni autenticar usuarios. Guarda solo el
correo para recordar la sesión en `localStorage` (`avanceCurricular.sesionSimulada`); la
contraseña no se almacena. Cerrar sesión elimina ese valor del navegador.

Este login no protege información ni sustituye la autenticación real. Tanto la sesión como el
avance se almacenan localmente y pueden ser consultados o modificados desde el navegador; no
hay backend ni sincronización entre dispositivos.

## Reporte del avance

La opción **Descargar reporte PDF** genera `reporte-avance-curricular.pdf`. El documento
incluye la fecha de generación, porcentaje de avance, materias y créditos completados,
así como el detalle de cada asignatura cursada y la simulación guardada.

## Incremento del Sprint 7

El Sprint 7 incorpora el **Simulador del próximo semestre**. La persona usuaria puede
configurar un límite de 1 a 60 créditos, generar una recomendación con materias cuyos
prerrequisitos ya estén aprobados y ajustar manualmente la selección. El algoritmo maximiza
los créditos sin rebasar el límite y, cuando existen alternativas equivalentes, prioriza las
materias que desbloquean más asignaturas futuras.

La interfaz muestra créditos utilizados y restantes, además de las dependencias académicas
favorecidas. Si una selección manual rebasa el límite, se conserva el ajuste y se
muestra una advertencia accesible. Cada simulación se almacena por plan curricular en
`localStorage` mediante la clave `avanceCurricular.simulacion.<id-del-plan>` y se normaliza
al recuperar datos o modificar el avance.

La verificación automatizada del incremento contempla límites, prerrequisitos, prioridad,
persistencia, planes importados y recuperación después de recargar la aplicación.
