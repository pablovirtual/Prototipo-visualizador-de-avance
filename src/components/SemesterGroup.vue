<script setup>
import SubjectCard from './SubjectCard.vue'

defineProps({
  semestre: {
    type: Number,
    required: true,
  },
  materias: {
    type: Array,
    required: true,
  },
  materiasCursadas: {
    type: Set,
    required: true,
  },
})

const emit = defineEmits(['toggle-cursada'])

function alternarMateria(idMateria) {
  emit('toggle-cursada', idMateria)
}
</script>

<template>
  <section class="semester-group" :aria-labelledby="`semestre-${semestre}`">
    <div class="semester-heading">
      <div>
        <p class="semester-label">Ciclo académico</p>
        <h2 :id="`semestre-${semestre}`">Semestre {{ semestre }}</h2>
      </div>
      <span class="subject-count">{{ materias.length }} materias</span>
    </div>

    <div class="subject-grid">
      <SubjectCard
        v-for="materia in materias"
        :key="materia.id"
        :materia="materia"
        :cursada="materiasCursadas.has(materia.id)"
        @toggle-cursada="alternarMateria"
      />
    </div>
  </section>
</template>
