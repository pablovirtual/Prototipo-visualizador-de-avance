<script setup>
import { computed, ref, watch } from 'vue'
import SemesterGroup from './components/SemesterGroup.vue'
import planEstudios from './data/plan_estudios.json'
import {
  alternarMateriaCursada as calcularSiguienteAvance,
  calcularEstadisticas,
  crearIndiceMaterias,
  normalizarMateriasCursadas,
  obtenerPrerrequisitosPendientes,
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

const estadosMaterias = computed(() => {
  const estados = new Map()

  for (const materia of materias) {
    const cursada = idsMateriasCursadas.value.has(materia.id)
    const prerrequisitosPendientes = obtenerPrerrequisitosPendientes(
      materia,
      idsMateriasCursadas.value,
      indiceMaterias,
    )

    estados.set(materia.id, {
      cursada,
      disponible: cursada || prerrequisitosPendientes.length === 0,
      prerrequisitosPendientes,
    })
  }

  return estados
})

const materiasDisponibles = computed(
  () =>
    [...estadosMaterias.value.values()].filter((estado) => estado.disponible && !estado.cursada)
      .length,
)

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
        <p><strong>{{ materiasDisponibles }}</strong> disponibles para cursar</p>
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

    <section class="semester-list" aria-label="Materias por semestre">
      <SemesterGroup
        v-for="grupo in materiasPorSemestre"
        :key="grupo.semestre"
        :semestre="grupo.semestre"
        :materias="grupo.materias"
        :materias-cursadas="idsMateriasCursadas"
        :estados-materias="estadosMaterias"
        @toggle-cursada="alternarMateriaCursada"
      />
    </section>
  </main>
</template>
