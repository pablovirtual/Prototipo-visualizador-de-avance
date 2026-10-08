<script setup>
import { computed, ref, watch } from 'vue'
import SemesterGroup from './components/SemesterGroup.vue'
import planEstudios from './data/plan_estudios.json'

const STORAGE_KEY = 'avanceCurricular.materiasCursadas'
const materias = ref(planEstudios)
const idsMateriasValidas = new Set(planEstudios.map((materia) => materia.id))

function cargarMateriasCursadas() {
  try {
    const datosGuardados = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')

    if (!Array.isArray(datosGuardados)) {
      return []
    }

    return [...new Set(datosGuardados)].filter(
      (id) => typeof id === 'string' && idsMateriasValidas.has(id),
    )
  } catch {
    return []
  }
}

const materiasCursadas = ref(cargarMateriasCursadas())
const idsMateriasCursadas = computed(() => new Set(materiasCursadas.value))

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

const totalCreditos = computed(() =>
  materias.value.reduce((total, materia) => total + materia.creditos, 0),
)

const creditosCompletados = computed(() =>
  materias.value.reduce(
    (total, materia) =>
      total + (idsMateriasCursadas.value.has(materia.id) ? materia.creditos : 0),
    0,
  ),
)

const porcentajeAvance = computed(() => {
  if (materias.value.length === 0) {
    return 0
  }

  return Math.round((materiasCursadas.value.length / materias.value.length) * 100)
})

watch(materiasCursadas, (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // El avance sigue disponible durante la sesión si el navegador bloquea localStorage.
  }
})

function alternarMateriaCursada(idMateria) {
  if (!idsMateriasValidas.has(idMateria)) {
    return
  }

  materiasCursadas.value = idsMateriasCursadas.value.has(idMateria)
    ? materiasCursadas.value.filter((id) => id !== idMateria)
    : [...materiasCursadas.value, idMateria]
}

function restablecerAvance() {
  if (
    materiasCursadas.value.length > 0 &&
    window.confirm('¿Quieres eliminar todo el avance guardado?')
  ) {
    materiasCursadas.value = []
  }
}
</script>

<template>
  <main class="curriculum-page">
    <header class="page-header">
      <p class="eyebrow">Plan de estudios</p>
      <h1>Malla Curricular</h1>
      <p class="page-description">
        Consulta las materias organizadas por semestre de tu carrera.
      </p>
    </header>

    <section class="progress-panel" aria-labelledby="progress-title">
      <div class="progress-summary">
        <div>
          <p class="progress-label">Tu avance</p>
          <h2 id="progress-title">{{ porcentajeAvance }}% completado</h2>
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
        :aria-valuenow="porcentajeAvance"
      >
        <span class="progress-fill" :style="{ width: `${porcentajeAvance}%` }"></span>
      </div>

      <div class="progress-details" aria-live="polite">
        <p><strong>{{ materiasCursadas.length }}</strong> de {{ materias.length }} materias</p>
        <p><strong>{{ creditosCompletados }}</strong> de {{ totalCreditos }} créditos</p>
      </div>
    </section>

    <section class="semester-list" aria-label="Materias por semestre">
      <SemesterGroup
        v-for="grupo in materiasPorSemestre"
        :key="grupo.semestre"
        :semestre="grupo.semestre"
        :materias="grupo.materias"
        :materias-cursadas="idsMateriasCursadas"
        @toggle-cursada="alternarMateriaCursada"
      />
    </section>
  </main>
</template>
