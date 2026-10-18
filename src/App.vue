<script setup>
import { computed, ref, watch } from 'vue'
import SimulatedLogin from './components/SimulatedLogin.vue'
import SemesterGroup from './components/SemesterGroup.vue'
import SemesterPlanner from './components/SemesterPlanner.vue'
import StudyPlanSelector from './components/StudyPlanSelector.vue'
import planEstudios from './data/plan_estudios.json'
import {
  alternarMateriaCursada as calcularSiguienteAvance,
  calcularEstadosMaterias,
  calcularEstadisticas,
  contarMateriasPorEstado,
  crearIndiceMaterias,
  filtrarMateriasPorEstado,
  normalizarMateriasCursadas,
  validarPlanEstudios,
} from './utils/curriculum.js'
import { analizarPlanEstudios, crearIdPlanPersonalizado } from './utils/studyPlans.js'
import {
  LIMITE_CREDITOS_PREDETERMINADO,
  contarDependientesTransitivos,
  generarRecomendacionSemestre,
  normalizarLimiteCreditos,
  normalizarSeleccionSimulada,
  obtenerMateriasElegibles,
} from './utils/semesterPlanner.js'

const STORAGE_KEY = 'avanceCurricular.materiasCursadas'
const CUSTOM_PLANS_KEY = 'avanceCurricular.planesPersonalizados'
const ACTIVE_PLAN_KEY = 'avanceCurricular.planActivo'
const SESSION_KEY = 'avanceCurricular.sesionSimulada'
const PLANNER_STORAGE_KEY = 'avanceCurricular.simulacion'
const DEFAULT_PLAN_ID = 'predeterminado'
const usuarioActivo = ref(null)
const errorSesion = ref('')
const errorPlan = ref('')
const importandoPlan = ref(false)
const planesPersonalizados = ref([])
const idPlanActivoInicial = ref(DEFAULT_PLAN_ID)

try {
  usuarioActivo.value = localStorage.getItem(SESSION_KEY) || null
  const planesGuardados = JSON.parse(localStorage.getItem(CUSTOM_PLANS_KEY) ?? '[]')
  if (!Array.isArray(planesGuardados)) {
    throw new TypeError('La lista de planes guardados no es válida.')
  }

  planesPersonalizados.value = planesGuardados.filter((plan) => {
    return (
      typeof plan?.id === 'string' &&
      typeof plan?.name === 'string' &&
      validarPlanEstudios(plan?.subjects).length === 0
    )
  })

  const idGuardado = localStorage.getItem(ACTIVE_PLAN_KEY)
  if (
    idGuardado === DEFAULT_PLAN_ID ||
    planesPersonalizados.value.some((plan) => plan.id === idGuardado)
  ) {
    idPlanActivoInicial.value = idGuardado
  }
} catch (error) {
  console.error('No se pudieron cargar las preferencias locales:', error)
  errorSesion.value =
    'No se pudieron leer los datos del navegador. Revisa su configuración de almacenamiento.'
  errorPlan.value = errorSesion.value
}

const planes = computed(() => [
  { id: DEFAULT_PLAN_ID, name: 'Plan de estudios predeterminado', subjects: planEstudios },
  ...planesPersonalizados.value,
])
const idPlanActivo = ref(idPlanActivoInicial.value)
const planActivo = computed(
  () => planes.value.find((plan) => plan.id === idPlanActivo.value) ?? planes.value[0],
)
const materias = computed(() => planActivo.value.subjects)
const indiceMaterias = computed(() => crearIndiceMaterias(materias.value))

function claveAvance(idPlan) {
  return `${STORAGE_KEY}.${idPlan}`
}

function claveSimulacion(idPlan) {
  return `${PLANNER_STORAGE_KEY}.${idPlan}`
}

function cargarSimulacion(idPlan, plan, idsCursados) {
  try {
    const datos = JSON.parse(localStorage.getItem(claveSimulacion(idPlan)) ?? '{}')
    const limiteCreditos = normalizarLimiteCreditos(
      datos.limiteCreditos ?? LIMITE_CREDITOS_PREDETERMINADO,
    )

    return {
      limiteCreditos,
      idsSeleccionados: normalizarSeleccionSimulada(
        datos.idsSeleccionados,
        plan,
        idsCursados,
        limiteCreditos,
      ),
    }
  } catch (error) {
    console.error('No se pudo leer la simulación guardada:', error)
    errorPlan.value = 'No se pudo leer la simulación de este plan desde el navegador.'
    return {
      limiteCreditos: LIMITE_CREDITOS_PREDETERMINADO,
      idsSeleccionados: [],
    }
  }
}

function cargarMateriasCursadas(idPlan, plan) {
  try {
    const clave = claveAvance(idPlan)
    const datos = localStorage.getItem(clave)
    const datosGuardados = JSON.parse(
      datos ?? (idPlan === DEFAULT_PLAN_ID ? localStorage.getItem(STORAGE_KEY) ?? '[]' : '[]'),
    )

    if (!Array.isArray(datosGuardados)) {
      return []
    }

    return normalizarMateriasCursadas(datosGuardados, plan)
  } catch (error) {
    console.error('No se pudo leer el avance guardado:', error)
    errorPlan.value = 'No se pudo leer el avance de este plan desde el navegador.'
    return []
  }
}

const materiasCursadas = ref(
  cargarMateriasCursadas(idPlanActivo.value, planActivo.value.subjects),
)
const simulacionInicial = cargarSimulacion(
  idPlanActivo.value,
  planActivo.value.subjects,
  materiasCursadas.value,
)
const limiteCreditosSimulacion = ref(simulacionInicial.limiteCreditos)
const materiasSimuladas = ref(simulacionInicial.idsSeleccionados)
const mensajeSimulacion = ref('')
const errorSimulacion = ref(false)
const mensajeEstado = ref('')
const errorReporte = ref('')
const generandoReporte = ref(false)
const filtroActivo = ref('todas')
const idsMateriasCursadas = computed(() => new Set(materiasCursadas.value))
const idsMateriasSimuladas = computed(() => new Set(materiasSimuladas.value))
const materiasElegiblesSimulacion = computed(() =>
  obtenerMateriasElegibles(materias.value, idsMateriasCursadas.value),
)
const materiasSeleccionadasSimulacion = computed(() =>
  materiasElegiblesSimulacion.value.filter((materia) =>
    idsMateriasSimuladas.value.has(materia.id),
  ),
)
const creditosSeleccionadosSimulacion = computed(() =>
  materiasSeleccionadasSimulacion.value.reduce(
    (total, materia) => total + materia.creditos,
    0,
  ),
)
const prioridadPorMateria = computed(() =>
  Object.fromEntries(
    materiasElegiblesSimulacion.value.map((materia) => [
      materia.id,
      contarDependientesTransitivos(materia.id, materias.value),
    ]),
  ),
)
const dependenciasFavorecidas = computed(() =>
  materiasSeleccionadasSimulacion.value.reduce(
    (total, materia) => total + (prioridadPorMateria.value[materia.id] ?? 0),
    0,
  ),
)

function guardarSimulacion(idPlan = idPlanActivo.value) {
  localStorage.setItem(
    claveSimulacion(idPlan),
    JSON.stringify({
      limiteCreditos: limiteCreditosSimulacion.value,
      idsSeleccionados: materiasSimuladas.value,
    }),
  )
}

function establecerSimulacion(simulacion) {
  limiteCreditosSimulacion.value = simulacion.limiteCreditos
  materiasSimuladas.value = simulacion.idsSeleccionados
  mensajeSimulacion.value = ''
  errorSimulacion.value = false
}

const materiasPorSemestre = computed(() => {
  const grupos = materias.value.reduce((resultado, materia) => {
    if (!resultado[materia.semestre]) {
      resultado[materia.semestre] = []
    }

    resultado[materia.semestre].push(materia)
    return resultado
  }, {})

  return Object.entries(grupos)
    .sort(([semestreA], [semestreB]) => Number(semestreA) - Number(semestreB))
    .map(([semestre, materiasDelSemestre]) => ({
      semestre: Number(semestre),
      materias: materiasDelSemestre,
    }))
})

const estadisticas = computed(() =>
  calcularEstadisticas(materias.value, idsMateriasCursadas.value),
)
const estadosMaterias = computed(() =>
  calcularEstadosMaterias(materias.value, idsMateriasCursadas.value),
)
const conteosEstado = computed(() =>
  contarMateriasPorEstado(materias.value, estadosMaterias.value),
)

const filtros = computed(() => [
  { id: 'todas', etiqueta: 'Todas', cantidad: conteosEstado.value.todas },
  { id: 'cursadas', etiqueta: 'Cursadas', cantidad: conteosEstado.value.cursadas },
  { id: 'disponibles', etiqueta: 'Disponibles', cantidad: conteosEstado.value.disponibles },
  { id: 'bloqueadas', etiqueta: 'Bloqueadas', cantidad: conteosEstado.value.bloqueadas },
])

const materiasFiltradasPorSemestre = computed(() =>
  materiasPorSemestre.value
    .map((grupo) => ({
      ...grupo,
      materias: filtrarMateriasPorEstado(
        grupo.materias,
        estadosMaterias.value,
        filtroActivo.value,
      ),
    }))
    .filter((grupo) => grupo.materias.length > 0),
)

const etiquetaFiltroActivo = computed(
  () => filtros.value.find((filtro) => filtro.id === filtroActivo.value)?.etiqueta ?? 'Todas',
)

const cantidadFiltroActivo = computed(
  () => conteosEstado.value[filtroActivo.value] ?? materias.value.length,
)

function iniciarSesion(correo) {
  try {
    localStorage.setItem(SESSION_KEY, correo)
    usuarioActivo.value = correo
    errorSesion.value = ''
  } catch (error) {
    console.error('No se pudo guardar la sesión simulada:', error)
    errorSesion.value = 'No se pudo guardar la sesión en este navegador. Revisa su configuración de almacenamiento.'
  }
}

function cerrarSesion() {
  try {
    localStorage.removeItem(SESSION_KEY)
    usuarioActivo.value = null
    errorSesion.value = ''
  } catch (error) {
    console.error('No se pudo cerrar la sesión simulada:', error)
    errorSesion.value = 'No se pudo borrar la sesión del navegador. Inténtalo de nuevo.'
  }
}

watch([materiasCursadas, idPlanActivo], ([ids, idPlan]) => {
  try {
    localStorage.setItem(claveAvance(idPlan), JSON.stringify(ids))
    localStorage.setItem(ACTIVE_PLAN_KEY, idPlan)
  } catch (error) {
    console.error('No se pudo guardar el avance del plan:', error)
    errorPlan.value = 'No se pudo guardar el avance en este navegador.'
  }
})

watch([limiteCreditosSimulacion, materiasSimuladas], () => {
  try {
    guardarSimulacion()
  } catch (error) {
    console.error('No se pudo guardar la simulación:', error)
    mensajeSimulacion.value = 'No se pudo guardar la simulación en este navegador.'
    errorSimulacion.value = true
  }
}, { deep: true })

watch(materiasCursadas, () => {
  const seleccionValida = normalizarSeleccionSimulada(
    materiasSimuladas.value,
    materias.value,
    materiasCursadas.value,
    limiteCreditosSimulacion.value,
  )
  if (seleccionValida.length !== materiasSimuladas.value.length) {
    materiasSimuladas.value = seleccionValida
    mensajeSimulacion.value = 'La simulación se actualizó conforme al avance registrado.'
    errorSimulacion.value = false
  }
})

function seleccionarPlan(idPlan) {
  if (idPlan === idPlanActivo.value || !planes.value.some((plan) => plan.id === idPlan)) {
    return
  }

  try {
    localStorage.setItem(
      claveAvance(idPlanActivo.value),
      JSON.stringify(materiasCursadas.value),
    )
    guardarSimulacion(idPlanActivo.value)
    errorPlan.value = ''
    idPlanActivo.value = idPlan
    materiasCursadas.value = cargarMateriasCursadas(idPlan, planActivo.value.subjects)
    establecerSimulacion(
      cargarSimulacion(idPlan, planActivo.value.subjects, materiasCursadas.value),
    )
    filtroActivo.value = 'todas'
    mensajeEstado.value = `Se cambió a ${planActivo.value.name}.`
  } catch (error) {
    console.error('No se pudo cambiar de plan:', error)
    errorPlan.value = 'No se pudo guardar el cambio de plan en este navegador.'
  }
}

async function importarPlan(archivo) {
  importandoPlan.value = true
  errorPlan.value = ''

  try {
    const { plan, errores } = analizarPlanEstudios(await archivo.text())
    if (!plan) {
      throw new Error(`No se pudo cargar el plan: ${errores.join(' ')}`)
    }

    const id = await crearIdPlanPersonalizado(plan)
    const nombre = archivo.name.replace(/\.json$/i, '').trim() || 'Plan personalizado'
    const planesActualizados = [
      ...planesPersonalizados.value.filter((planGuardado) => planGuardado.id !== id),
      { id, name: nombre, subjects: plan },
    ]
    localStorage.setItem(
      claveAvance(idPlanActivo.value),
      JSON.stringify(materiasCursadas.value),
    )
    guardarSimulacion(idPlanActivo.value)
    localStorage.setItem(CUSTOM_PLANS_KEY, JSON.stringify(planesActualizados))
    planesPersonalizados.value = planesActualizados
    idPlanActivo.value = id
    materiasCursadas.value = cargarMateriasCursadas(id, plan)
    establecerSimulacion(cargarSimulacion(id, plan, materiasCursadas.value))
    filtroActivo.value = 'todas'
    mensajeEstado.value = `Se cargó el plan ${nombre}.`
  } catch (error) {
    console.error('No se pudo importar el plan de estudios:', error)
    errorPlan.value =
      error instanceof Error
        ? error.message
        : 'No se pudo leer el archivo. Selecciona un JSON válido e inténtalo de nuevo.'
  } finally {
    importandoPlan.value = false
  }
}

function alternarMateriaCursada(idMateria) {
  if (!indiceMaterias.value.has(idMateria)) {
    return
  }

  const estabaCursada = idsMateriasCursadas.value.has(idMateria)
  const cantidadAnterior = materiasCursadas.value.length
  const siguienteEstado = calcularSiguienteAvance(
    idMateria,
    materiasCursadas.value,
    materias.value,
  )

  materiasCursadas.value = siguienteEstado

  if (estabaCursada) {
    const dependientesActualizados = cantidadAnterior - siguienteEstado.length - 1
    const descripcionDependientes =
      dependientesActualizados === 1
        ? '1 materia dependiente'
        : `${dependientesActualizados} materias dependientes`
    mensajeEstado.value =
      dependientesActualizados > 0
        ? `Materia desmarcada. También se actualizaron ${descripcionDependientes}.`
        : 'Materia desmarcada.'
  } else {
    mensajeEstado.value = 'Materia marcada como cursada. Se actualizaron las disponibles.'
  }
}

function restablecerAvance() {
  if (
    materiasCursadas.value.length > 0 &&
    window.confirm('¿Quieres eliminar todo el avance guardado?')
  ) {
    materiasCursadas.value = []
    mensajeEstado.value = 'Se restableció todo el avance curricular.'
  }
}

function seleccionarFiltro(filtro) {
  filtroActivo.value = filtro
}

function actualizarLimiteSimulacion(valor) {
  const limite = normalizarLimiteCreditos(valor)
  limiteCreditosSimulacion.value = limite
  materiasSimuladas.value = normalizarSeleccionSimulada(
    materiasSimuladas.value,
    materias.value,
    materiasCursadas.value,
    limite,
  )
  mensajeSimulacion.value = 'Se actualizó el límite y se conservó la selección compatible.'
  errorSimulacion.value = false
}

function generarRecomendacion() {
  const recomendacion = generarRecomendacionSemestre(
    materias.value,
    materiasCursadas.value,
    limiteCreditosSimulacion.value,
  )
  materiasSimuladas.value = recomendacion.materiasSeleccionadas.map((materia) => materia.id)
  mensajeSimulacion.value = recomendacion.materiasSeleccionadas.length > 0
    ? `Recomendación generada con ${recomendacion.creditosTotales} créditos.`
    : 'No hay materias disponibles con los prerrequisitos actuales.'
  errorSimulacion.value = false
}

function alternarMateriaSimulada(idMateria) {
  if (idsMateriasSimuladas.value.has(idMateria)) {
    materiasSimuladas.value = materiasSimuladas.value.filter((id) => id !== idMateria)
    mensajeSimulacion.value = 'Materia retirada de la simulación.'
    errorSimulacion.value = false
    return
  }

  const materia = materiasElegiblesSimulacion.value.find((item) => item.id === idMateria)
  if (!materia) {
    return
  }

  const nuevoTotal = creditosSeleccionadosSimulacion.value + materia.creditos
  if (nuevoTotal > limiteCreditosSimulacion.value) {
    mensajeSimulacion.value = `No se agregó ${materia.nombre}: excedería el límite por ${nuevoTotal - limiteCreditosSimulacion.value} créditos.`
    errorSimulacion.value = true
    return
  }

  materiasSimuladas.value = [...materiasSimuladas.value, idMateria]
  mensajeSimulacion.value = 'Materia agregada a la simulación.'
  errorSimulacion.value = false
}

function limpiarSimulacion() {
  materiasSimuladas.value = []
  mensajeSimulacion.value = 'Se limpió la selección de la simulación.'
  errorSimulacion.value = false
}

async function descargarReporte() {
  generandoReporte.value = true
  errorReporte.value = ''
  try {
    const { descargarReportePdf } = await import('./utils/report.js')
    descargarReportePdf(materias.value, materiasCursadas.value, new Date(), {
      limiteCreditos: limiteCreditosSimulacion.value,
      idsSeleccionados: materiasSimuladas.value,
    })
    mensajeEstado.value = 'Se descargó el reporte PDF de tu avance curricular.'
  } catch (error) {
    console.error('No se pudo generar el reporte PDF:', error)
    errorReporte.value = 'No se pudo generar el reporte PDF. Inténtalo de nuevo.'
  } finally {
    generandoReporte.value = false
  }
}
</script>

<template>
  <main class="curriculum-page">
    <SimulatedLogin
      v-if="!usuarioActivo"
      :error-message="errorSesion"
      @login="iniciarSesion"
    />
    <template v-else>
    <div class="session-bar">
      <p>Sesión de demostración: <strong>{{ usuarioActivo }}</strong></p>
      <button class="session-button" type="button" @click="cerrarSesion">Cerrar sesión</button>
    </div>
    <p class="session-notice" role="note">
      Login simulado: esta sesión no autentica ni protege información; los datos permanecen en este navegador.
    </p>
    <StudyPlanSelector
      :plans="planes"
      :active-plan-id="idPlanActivo"
      :error-message="errorPlan"
      :is-importing="importandoPlan"
      @select="seleccionarPlan"
      @import="importarPlan"
    />
    <header class="page-header">
      <p class="eyebrow">Plan de estudios</p>
      <h1>{{ planActivo.name }}</h1>
      <p class="page-description">
        Consulta tu avance y descubre qué materias están disponibles según sus prerrequisitos.
      </p>
    </header>

    <section class="progress-panel" aria-labelledby="progress-title">
      <div class="progress-summary">
        <div>
          <p class="progress-label">Tu avance</p>
          <h2 id="progress-title">{{ estadisticas.porcentaje }}% completado</h2>
        </div>
        <button
          class="reset-button"
          type="button"
          :disabled="materiasCursadas.length === 0"
          @click="restablecerAvance"
        >
          Restablecer avance
        </button>
      </div>

      <div
        class="progress-track"
        role="progressbar"
        aria-label="Progreso de materias cursadas"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="estadisticas.porcentaje"
      >
        <span class="progress-fill" :style="{ width: `${estadisticas.porcentaje}%` }"></span>
      </div>

      <div class="progress-details" aria-live="polite">
        <p>
          <strong>{{ estadisticas.materiasCompletadas }}</strong> de
          {{ estadisticas.totalMaterias }} materias
        </p>
        <p>
          <strong>{{ estadisticas.creditosCompletados }}</strong> de
          {{ estadisticas.totalCreditos }} créditos
        </p>
        <p><strong>{{ conteosEstado.disponibles }}</strong> disponibles para cursar</p>
      </div>
      <p v-if="mensajeEstado" class="progress-feedback" aria-live="polite">
        {{ mensajeEstado }}
      </p>
    </section>

    <section class="report-panel" aria-labelledby="report-title">
      <div>
        <p class="eyebrow">Evidencia académica</p>
        <h2 id="report-title">Descarga tu reporte de avance</h2>
        <p>
          Genera un archivo PDF con el porcentaje, las materias y los créditos completados,
          además del detalle de las asignaturas cursadas.
        </p>
      </div>
      <div class="report-actions">
        <button
          class="report-button"
          type="button"
          :disabled="generandoReporte"
          @click="descargarReporte"
        >
          {{ generandoReporte ? 'Generando reporte…' : 'Descargar reporte PDF' }}
        </button>
        <p v-if="errorReporte" class="login-error" role="alert">{{ errorReporte }}</p>
      </div>
    </section>

    <section class="availability-guide" aria-labelledby="availability-title">
      <div>
        <p class="eyebrow">Disponibilidad académica</p>
        <h2 id="availability-title">Avanza respetando los prerrequisitos</h2>
        <p>
          Las materias se desbloquean automáticamente. Si se desmarca un prerrequisito,
          también se corrige el avance de las materias que dependan de él.
        </p>
      </div>
      <ul class="status-legend" aria-label="Estados de las materias">
        <li><span class="status-dot status-dot--available"></span>Disponible</li>
        <li><span class="status-dot status-dot--completed"></span>Cursada</li>
        <li><span class="status-dot status-dot--blocked"></span>Bloqueada</li>
      </ul>
    </section>

    <SemesterPlanner
      :materias="materiasElegiblesSimulacion"
      :ids-seleccionados="idsMateriasSimuladas"
      :limite-creditos="limiteCreditosSimulacion"
      :creditos-seleccionados="creditosSeleccionadosSimulacion"
      :dependencias-favorecidas="dependenciasFavorecidas"
      :prioridad-por-materia="prioridadPorMateria"
      :mensaje="mensajeSimulacion"
      :es-error="errorSimulacion"
      @update-limit="actualizarLimiteSimulacion"
      @recommend="generarRecomendacion"
      @toggle="alternarMateriaSimulada"
      @clear="limpiarSimulacion"
    />

    <section class="filter-panel" aria-labelledby="filter-title">
      <div class="filter-heading">
        <div>
          <p class="eyebrow">Explorar la malla</p>
          <h2 id="filter-title">Filtrar materias por estado</h2>
        </div>
        <p class="filter-result" aria-live="polite">
          {{ cantidadFiltroActivo }}
          {{ cantidadFiltroActivo === 1 ? 'materia' : 'materias' }}:
          {{ etiquetaFiltroActivo.toLowerCase() }}
        </p>
      </div>

      <div class="filter-controls" role="group" aria-label="Filtrar materias por estado">
        <button
          v-for="filtro in filtros"
          :key="filtro.id"
          class="filter-button"
          :class="{ 'filter-button--active': filtroActivo === filtro.id }"
          type="button"
          :aria-pressed="filtroActivo === filtro.id"
          @click="seleccionarFiltro(filtro.id)"
        >
          <span>{{ filtro.etiqueta }}</span>
          <span class="filter-count" aria-hidden="true">{{ filtro.cantidad }}</span>
          <span class="sr-only">
            : {{ filtro.cantidad }} {{ filtro.cantidad === 1 ? 'materia' : 'materias' }}
          </span>
        </button>
      </div>
    </section>

    <section class="semester-list" aria-label="Materias por semestre">
      <SemesterGroup
        v-for="grupo in materiasFiltradasPorSemestre"
        :key="grupo.semestre"
        :semestre="grupo.semestre"
        :materias="grupo.materias"
        :materias-cursadas="idsMateriasCursadas"
        :estados-materias="estadosMaterias"
        @toggle-cursada="alternarMateriaCursada"
      />

      <div v-if="materiasFiltradasPorSemestre.length === 0" class="empty-state" role="status">
        <p class="empty-state-icon" aria-hidden="true">✓</p>
        <h2>No hay materias {{ etiquetaFiltroActivo.toLowerCase() }}</h2>
        <p>Selecciona otro filtro para continuar explorando la malla curricular.</p>
        <button class="empty-state-button" type="button" @click="seleccionarFiltro('todas')">
          Mostrar todas las materias
        </button>
      </div>
    </section>
    </template>
  </main>
</template>
