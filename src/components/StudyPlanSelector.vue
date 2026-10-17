<script setup>
defineProps({
  plans: {
    type: Array,
    required: true,
  },
  activePlanId: {
    type: String,
    required: true,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  isImporting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select', 'import'])

function importarArchivo(event) {
  const [archivo] = event.target.files ?? []
  if (archivo) {
    emit('import', archivo)
  }
  event.target.value = ''
}
</script>

<template>
  <section class="plan-selector" aria-labelledby="plan-selector-title">
    <div class="plan-selector-heading">
      <div>
        <p class="eyebrow">Planes de estudio</p>
        <h2 id="plan-selector-title">Selecciona una malla curricular</h2>
      </div>
      <label class="plan-select-label" for="study-plan-select">Plan activo</label>
      <select
        id="study-plan-select"
        :value="activePlanId"
        @change="emit('select', $event.target.value)"
      >
        <option v-for="plan in plans" :key="plan.id" :value="plan.id">
          {{ plan.name }}
        </option>
      </select>
    </div>

    <div class="plan-import">
      <label for="study-plan-file">Cargar otro plan (.json)</label>
      <input
        id="study-plan-file"
        type="file"
        accept=".json,application/json"
        :disabled="isImporting"
        @change="importarArchivo"
      />
      <span v-if="isImporting" role="status">Validando el plan…</span>
    </div>
    <p class="plan-format-hint">
      El archivo debe contener un arreglo de materias con los campos id, nombre, semestre,
      creditos y prerrequisitos.
    </p>
    <p v-if="errorMessage" class="plan-error" role="alert">{{ errorMessage }}</p>
  </section>
</template>
