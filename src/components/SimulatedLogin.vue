<script setup>
import { ref } from 'vue'

defineProps({
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['login'])
const correo = ref('')
const contrasena = ref('')

function enviarFormulario() {
  emit('login', correo.value.trim())
  contrasena.value = ''
}
</script>

<template>
  <section class="login-panel" aria-labelledby="login-title">
    <p class="eyebrow">Prototipo académico</p>
    <h1 id="login-title">Inicia sesión</h1>
    <p class="login-description">
      Accede a tu visualizador de avance curricular. Para esta demostración puedes usar
      cualquier correo y contraseña.
    </p>

    <form class="login-form" @submit.prevent="enviarFormulario">
      <label for="login-email">Correo electrónico</label>
      <input
        id="login-email"
        v-model="correo"
        type="email"
        name="email"
        autocomplete="username"
        required
      />

      <label for="login-password">Contraseña</label>
      <input
        id="login-password"
        v-model="contrasena"
        type="password"
        name="password"
        autocomplete="current-password"
        required
      />

      <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
      <button class="report-button login-submit" type="submit">Entrar al prototipo</button>
    </form>

    <p class="simulation-notice" role="note">
      Login simulado: no se verifican credenciales ni se protege información. La sesión solo
      se guarda en este navegador; la contraseña no se almacena.
    </p>
  </section>
</template>
