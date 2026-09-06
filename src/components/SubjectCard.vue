<script setup>
defineProps({
  materia: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="subject-card">
    <p class="subject-id">{{ materia.id }}</p>
    <h3>{{ materia.nombre }}</h3>
    <p class="credits"><strong>{{ materia.creditos }}</strong> créditos</p>
  </article>
</template>
