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
  disponible: {
    type: Boolean,
    required: true,
  },
  prerrequisitosPendientes: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['toggle-cursada'])

function alternarEstado() {
  emit('toggle-cursada', props.materia.id)
}
</script>

<template>
  <article
    class="subject-card"
    :class="{
      'subject-card--completed': cursada,
      'subject-card--available': disponible && !cursada,
      'subject-card--blocked': !disponible,
    }"
  >
    <div class="subject-card-heading">
      <p class="subject-id">{{ materia.id }}</p>
      <span
        class="subject-status"
        :class="{
          'subject-status--completed': cursada,
          'subject-status--available': disponible && !cursada,
          'subject-status--blocked': !disponible,
        }"
      >
        {{ cursada ? 'Cursada' : disponible ? 'Disponible' : 'Bloqueada' }}
      </span>
    </div>
    <h3>{{ materia.nombre }}</h3>
    <p class="credits"><strong>{{ materia.creditos }}</strong> créditos</p>

    <p
      v-if="prerrequisitosPendientes.length > 0"
      :id="`requisitos-${materia.id}`"
      class="prerequisite-message"
    >
      <strong>Requiere:</strong>
      {{
        prerrequisitosPendientes
          .map((prerrequisito) => `${prerrequisito.nombre} (${prerrequisito.id})`)
          .join(', ')
      }}
    </p>
    <p
      v-else-if="materia.prerrequisitos.length > 0"
      class="prerequisite-message prerequisite-message--met"
    >
      Prerrequisitos cumplidos
    </p>

    <label class="completion-control">
      <input
        type="checkbox"
        :checked="cursada"
        :disabled="!disponible"
        :aria-describedby="prerrequisitosPendientes.length ? `requisitos-${materia.id}` : undefined"
        :aria-label="`${cursada ? 'Desmarcar' : 'Marcar'} ${materia.nombre} como cursada`"
        @change="alternarEstado"
      />
      <span>
        {{
          cursada
            ? 'Materia cursada'
            : disponible
              ? 'Marcar como cursada'
              : 'Completa los requisitos'
        }}
      </span>
    </label>
  </article>
</template>
