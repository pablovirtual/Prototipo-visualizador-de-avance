import { calcularEstadosMaterias } from './curriculum.js'

export const LIMITE_CREDITOS_PREDETERMINADO = 12
export const LIMITE_CREDITOS_MINIMO = 1
export const LIMITE_CREDITOS_MAXIMO = 60

export function normalizarLimiteCreditos(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return LIMITE_CREDITOS_PREDETERMINADO
  }

  return Math.min(
    LIMITE_CREDITOS_MAXIMO,
    Math.max(LIMITE_CREDITOS_MINIMO, Math.round(numero)),
  )
}

export function obtenerMateriasElegibles(materias, idsCursados) {
  const cursadas = idsCursados instanceof Set ? idsCursados : new Set(idsCursados)
  const estados = calcularEstadosMaterias(materias, cursadas)

  return materias.filter((materia) => {
    const estado = estados.get(materia.id)
    return estado?.disponible && !estado.cursada
  })
}

function crearIndiceDependientes(materias) {
  const dependientes = new Map(materias.map((materia) => [materia.id, []]))

  for (const materia of materias) {
    for (const prerrequisito of materia.prerrequisitos) {
      dependientes.get(prerrequisito)?.push(materia.id)
    }
  }

  return dependientes
}

export function contarDependientesTransitivos(idMateria, materias) {
  const dependientes = crearIndiceDependientes(materias)
  const visitados = new Set()
  const pendientes = [...(dependientes.get(idMateria) ?? [])]

  while (pendientes.length > 0) {
    const id = pendientes.pop()
    if (visitados.has(id)) {
      continue
    }

    visitados.add(id)
    pendientes.push(...(dependientes.get(id) ?? []))
  }

  return visitados.size
}

function compararIds(idsA, idsB) {
  return idsA.join('|').localeCompare(idsB.join('|'), 'es')
}

function esMejorCandidato(candidato, actual) {
  if (!candidato) {
    return false
  }
  if (!actual) {
    return true
  }
  if (candidato.creditos !== actual.creditos) {
    return candidato.creditos > actual.creditos
  }
  if (candidato.prioridad !== actual.prioridad) {
    return candidato.prioridad > actual.prioridad
  }

  return compararIds(candidato.ids, actual.ids) < 0
}

export function generarRecomendacionSemestre(materias, idsCursados, limiteCreditos) {
  const limite = normalizarLimiteCreditos(limiteCreditos)
  const elegibles = obtenerMateriasElegibles(materias, idsCursados)
    .map((materia) => ({
      ...materia,
      prioridad: contarDependientesTransitivos(materia.id, materias),
    }))
    .sort((a, b) => a.semestre - b.semestre || a.id.localeCompare(b.id, 'es'))

  const mejores = Array.from({ length: limite + 1 }, () => null)
  mejores[0] = { creditos: 0, prioridad: 0, ids: [] }

  for (const materia of elegibles) {
    for (let creditos = limite; creditos >= materia.creditos; creditos -= 1) {
      const anterior = mejores[creditos - materia.creditos]
      if (!anterior) {
        continue
      }

      const candidato = {
        creditos,
        prioridad: anterior.prioridad + materia.prioridad,
        ids: [...anterior.ids, materia.id],
      }
      if (esMejorCandidato(candidato, mejores[creditos])) {
        mejores[creditos] = candidato
      }
    }
  }

  const mejor = mejores.reduce((actual, candidato) =>
    esMejorCandidato(candidato, actual) ? candidato : actual,
  null)
  const idsSeleccionados = new Set(mejor?.ids ?? [])
  const materiasSeleccionadas = elegibles.filter((materia) => idsSeleccionados.has(materia.id))

  return {
    limiteCreditos: limite,
    creditosTotales: materiasSeleccionadas.reduce(
      (total, materia) => total + materia.creditos,
      0,
    ),
    prioridadTotal: materiasSeleccionadas.reduce(
      (total, materia) => total + materia.prioridad,
      0,
    ),
    materiasSeleccionadas,
  }
}

export function normalizarSeleccionSimulada(
  idsSeleccionados,
  materias,
  idsCursados,
  _limiteCreditos,
) {
  if (!Array.isArray(idsSeleccionados)) {
    return []
  }

  const elegibles = new Map(
    obtenerMateriasElegibles(materias, idsCursados).map((materia) => [materia.id, materia]),
  )
  const resultado = []
  const vistos = new Set()

  for (const id of idsSeleccionados) {
    const materia = elegibles.get(id)
    if (!materia || vistos.has(id)) {
      continue
    }

    vistos.add(id)
    resultado.push(id)
  }

  return resultado
}
