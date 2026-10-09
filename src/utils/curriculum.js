export function crearIndiceMaterias(materias) {
  return new Map(materias.map((materia) => [materia.id, materia]))
}

export function validarPlanEstudios(materias) {
  if (!Array.isArray(materias)) {
    return ['El plan de estudios debe ser un arreglo.']
  }

  const errores = []
  const ids = new Set()

  for (const materia of materias) {
    if (!materia || typeof materia !== 'object') {
      errores.push('Cada materia debe ser un objeto.')
      continue
    }

    if (typeof materia.id !== 'string' || materia.id.trim() === '') {
      errores.push('Todas las materias deben tener un ID válido.')
    } else if (ids.has(materia.id)) {
      errores.push(`El ID ${materia.id} está duplicado.`)
    } else {
      ids.add(materia.id)
    }

    if (typeof materia.nombre !== 'string' || materia.nombre.trim() === '') {
      errores.push(`La materia ${materia.id ?? 'sin ID'} no tiene un nombre válido.`)
    }

    if (!Number.isInteger(materia.semestre) || materia.semestre < 1) {
      errores.push(`La materia ${materia.id ?? 'sin ID'} tiene un semestre inválido.`)
    }

    if (!Number.isFinite(materia.creditos) || materia.creditos < 0) {
      errores.push(`La materia ${materia.id ?? 'sin ID'} tiene créditos inválidos.`)
    }

    if (!Array.isArray(materia.prerrequisitos)) {
      errores.push(`La materia ${materia.id ?? 'sin ID'} debe incluir prerrequisitos.`)
    }
  }

  for (const materia of materias) {
    if (!Array.isArray(materia?.prerrequisitos)) {
      continue
    }

    for (const idPrerrequisito of materia.prerrequisitos) {
      if (idPrerrequisito === materia.id) {
        errores.push(`La materia ${materia.id} no puede ser su propio prerrequisito.`)
      } else if (!ids.has(idPrerrequisito)) {
        errores.push(
          `La materia ${materia.id} contiene el prerrequisito inexistente ${idPrerrequisito}.`,
        )
      }
    }
  }

  return errores
}

export function obtenerPrerrequisitosPendientes(materia, idsCursados, indiceMaterias) {
  return materia.prerrequisitos
    .filter((id) => !idsCursados.has(id))
    .map((id) => indiceMaterias.get(id) ?? { id, nombre: 'Materia no encontrada' })
}

export function estaMateriaDisponible(materia, idsCursados, indiceMaterias) {
  return obtenerPrerrequisitosPendientes(materia, idsCursados, indiceMaterias).length === 0
}

export function normalizarMateriasCursadas(ids, materias) {
  if (!Array.isArray(ids)) {
    return []
  }

  const indice = crearIndiceMaterias(materias)
  const idsNormalizados = [...new Set(ids)].filter(
    (id) => typeof id === 'string' && indice.has(id),
  )
  const idsCursados = new Set(idsNormalizados)

  let huboCambios = true
  while (huboCambios) {
    huboCambios = false

    for (const id of [...idsCursados]) {
      const materia = indice.get(id)
      if (!estaMateriaDisponible(materia, idsCursados, indice)) {
        idsCursados.delete(id)
        huboCambios = true
      }
    }
  }

  return idsNormalizados.filter((id) => idsCursados.has(id))
}

export function alternarMateriaCursada(idMateria, idsActuales, materias) {
  const indice = crearIndiceMaterias(materias)
  const materia = indice.get(idMateria)

  if (!materia) {
    return normalizarMateriasCursadas(idsActuales, materias)
  }

  const idsNormalizados = normalizarMateriasCursadas(idsActuales, materias)
  const idsCursados = new Set(idsNormalizados)

  if (idsCursados.has(idMateria)) {
    return normalizarMateriasCursadas(
      idsNormalizados.filter((id) => id !== idMateria),
      materias,
    )
  }

  if (!estaMateriaDisponible(materia, idsCursados, indice)) {
    return idsNormalizados
  }

  return [...idsNormalizados, idMateria]
}

export function calcularEstadisticas(materias, idsCursados) {
  const completadas = materias.filter((materia) => idsCursados.has(materia.id))
  const totalCreditos = materias.reduce((total, materia) => total + materia.creditos, 0)
  const creditosCompletados = completadas.reduce(
    (total, materia) => total + materia.creditos,
    0,
  )

  return {
    materiasCompletadas: completadas.length,
    totalMaterias: materias.length,
    creditosCompletados,
    totalCreditos,
    porcentaje:
      materias.length === 0 ? 0 : Math.round((completadas.length / materias.length) * 100),
  }
}
