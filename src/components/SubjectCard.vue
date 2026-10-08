<script setup>
const props = defineProps({
  materia: {
    type: Object,
    required: true,
  },
  cursada: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['toggle-cursada'])

function alternarEstado() {
  emit('toggle-cursada', props.materia.id)
}
</script>

<template>
  <article class="subject-card" :class="{ 'subject-card--completed': cursada }">
    <p class="subject-id">{{ materia.id }}</p>
    <h3>{{ materia.nombre }}</h3>
    <p class="credits"><strong>{{ materia.creditos }}</strong> créditos</p>

    <label class="completion-control">
      <input type="checkbox" :checked="cursada" @change="alternarEstado" />
      <span>{{ cursada ? 'Materia cursada' : 'Marcar como cursada' }}</span>
    </label>
  </article>
</template>
