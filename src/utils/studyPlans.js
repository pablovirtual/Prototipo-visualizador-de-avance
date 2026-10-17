import { validarPlanEstudios } from './curriculum.js'

export function analizarPlanEstudios(contenido) {
  let plan

  try {
    plan = JSON.parse(contenido)
  } catch {
    return { plan: null, errores: ['El archivo no contiene JSON válido.'] }
  }

  const errores = validarPlanEstudios(plan)
  if (Array.isArray(plan) && plan.length === 0) {
    errores.unshift('El plan debe incluir al menos una materia.')
  }

  return {
    plan: errores.length === 0 ? plan : null,
    errores,
  }
}

export async function crearIdPlanPersonalizado(plan) {
  const contenidoCanonico = JSON.stringify(
    plan.map(({ id, nombre, semestre, creditos, prerrequisitos }) => ({
      id,
      nombre,
      semestre,
      creditos,
      prerrequisitos,
    })),
  )
  const contenido = new TextEncoder().encode(contenidoCanonico)
  const resumen = await globalThis.crypto.subtle.digest('SHA-256', contenido)
  const huella = Array.from(new Uint8Array(resumen), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

  return `personalizado-${huella}`
}
