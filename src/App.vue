<script setup>
import { computed, ref, watch } from 'vue'
import SemesterGroup from './components/SemesterGroup.vue'
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

const STORAGE_KEY = 'avanceCurricular.materiasCursadas'
const materias = planEstudios
const indiceMaterias = crearIndiceMaterias(materias)
const erroresPlan = validarPlanEstudios(materias)

if (erroresPlan.length > 0) {
  console.error('El plan de estudios contiene errores:', erroresPlan)
}

function cargarMateriasCursadas() {
  try {
    const datosGuardados = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')

    if (!Array.isArray(datosGuardados)) {
      return []
    }

    return normalizarMateriasCursadas(datosGuardados, materias)
  } catch {
    return []
  }
}

const materiasCursadas = ref(cargarMateriasCursadas())
const mensajeEstado = ref('')
const filtroActivo = ref('todas')
const idsMateriasCursadas = computed(() => new Set(materiasCursadas.value))

const materiasPorSemestre = computed(() => {
  const grupos = materias.reduce((resultado, materia) => {
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

const estadisticas = computed(() => calcularEstadisticas(materias, idsMateriasCursadas.value))
const estadosMaterias = computed(() =>
  calcularEstadosMaterias(materias, idsMateriasCursadas.value),
)
const conteosEstado = computed(() => contarMateriasPorEstado(materias, estadosMaterias.value))

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

const cantidadFiltroActivo = computed(() => conteosEstado.value[filtroActivo.value] ?? materias.length)

watch(materiasCursadas, (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // El avance sigue disponible durante la sesión si el navegador bloquea localStorage.
  }
})

function alternarMateriaCursada(idMateria) {
  if (!indiceMaterias.has(idMateria)) {
    return
  }

  const estabaCursada = idsMateriasCursadas.value.has(idMateria)
  const cantidadAnterior = materiasCursadas.value.length
  const siguienteEstado = calcularSiguienteAvance(idMateria, materiasCursadas.value, materias)

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
</script>

<template>
  <main class="curriculum-page">
    <header class="page-header">
      <p class="eyebrow">Plan de estudios</p>
      <h1>Malla Curricular</h1>
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
  </main>
</template>
