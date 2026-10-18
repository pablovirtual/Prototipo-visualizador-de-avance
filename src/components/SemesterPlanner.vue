<script setup>
defineProps({
  materias: {
    type: Array,
    required: true,
  },
  idsSeleccionados: {
    type: Set,
    required: true,
  },
  limiteCreditos: {
    type: Number,
    required: true,
  },
  creditosSeleccionados: {
    type: Number,
    required: true,
  },
  dependenciasFavorecidas: {
    type: Number,
    required: true,
  },
  prioridadPorMateria: {
    type: Object,
    required: true,
  },
  mensaje: {
    type: String,
    default: '',
  },
  esError: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update-limit', 'recommend', 'toggle', 'clear'])

function actualizarLimite(evento) {
  emit('update-limit', evento.target.value)
}
</script>

<template>
  <section class="planner-panel" aria-labelledby="planner-title">
    <div class="planner-heading">
      <div>
        <p class="eyebrow">Planeación académica</p>
        <h2 id="planner-title">Simulador del próximo semestre</h2>
        <p>
          Elige una carga posible con las materias que ya tienen sus prerrequisitos cubiertos.
          La simulación no modifica tu avance registrado.
        </p>
      </div>
      <div class="planner-limit">
        <label for="credit-limit">Límite de créditos</label>
        <input
          id="credit-limit"
          :value="limiteCreditos"
          type="number"
          min="1"
          max="60"
          inputmode="numeric"
          @change="actualizarLimite"
        />
      </div>
    </div>

    <div class="planner-summary" aria-live="polite">
      <p><strong>{{ creditosSeleccionados }}</strong> de {{ limiteCreditos }} créditos usados</p>
      <p><strong>{{ limiteCreditos - creditosSeleccionados }}</strong> créditos disponibles</p>
      <p><strong>{{ dependenciasFavorecidas }}</strong> dependencias futuras favorecidas</p>
    </div>

    <div class="planner-actions">
      <button class="planner-primary-button" type="button" @click="emit('recommend')">
        Generar recomendación
      </button>
      <button
        class="planner-secondary-button"
        type="button"
        :disabled="idsSeleccionados.size === 0"
        @click="emit('clear')"
      >
        Limpiar selección
      </button>
    </div>

    <p
      v-if="mensaje"
      class="planner-feedback"
      :class="{ 'planner-feedback--error': esError }"
      :role="esError ? 'alert' : 'status'"
    >
      {{ mensaje }}
    </p>

    <div v-if="materias.length > 0" class="planner-subjects">
      <label v-for="materia in materias" :key="materia.id" class="planner-subject">
        <input
          type="checkbox"
          :checked="idsSeleccionados.has(materia.id)"
          :aria-label="`${idsSeleccionados.has(materia.id) ? 'Retirar' : 'Incluir'} ${materia.nombre} en la simulación`"
          @change="emit('toggle', materia.id)"
        />
        <span class="planner-subject-copy">
          <strong>{{ materia.nombre }}</strong>
          <span>{{ materia.id }} · Semestre {{ materia.semestre }} · {{ materia.creditos }} créditos</span>
          <small>
            Favorece {{ prioridadPorMateria[materia.id] ?? 0 }}
            {{ (prioridadPorMateria[materia.id] ?? 0) === 1 ? 'dependencia futura' : 'dependencias futuras' }}
          </small>
        </span>
      </label>
    </div>

    <div v-else class="planner-empty" role="status">
      <h3>No hay materias disponibles para simular</h3>
      <p>Registra nuevas materias cursadas o cambia de plan para obtener una recomendación.</p>
    </div>
  </section>
</template>
