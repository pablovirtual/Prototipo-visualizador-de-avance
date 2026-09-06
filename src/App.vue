<script setup>
import { computed, ref } from 'vue'
import SemesterGroup from './components/SemesterGroup.vue'
import planEstudios from './data/plan_estudios.json'

const materias = ref(planEstudios)

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

    <section class="semester-list" aria-label="Materias por semestre">
      <SemesterGroup
        v-for="grupo in materiasPorSemestre"
        :key="grupo.semestre"
        :semestre="grupo.semestre"
        :materias="grupo.materias"
      />
    </section>
  </main>
</template>
