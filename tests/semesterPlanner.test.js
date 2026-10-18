import assert from 'node:assert/strict'
import test from 'node:test'

import {
  contarDependientesTransitivos,
  generarRecomendacionSemestre,
  normalizarLimiteCreditos,
  normalizarSeleccionSimulada,
  obtenerMateriasElegibles,
} from '../src/utils/semesterPlanner.js'

const materias = [
  { id: 'A', nombre: 'Base A', semestre: 1, creditos: 4, prerrequisitos: [] },
  { id: 'B', nombre: 'Base B', semestre: 1, creditos: 3, prerrequisitos: [] },
  { id: 'C', nombre: 'Intermedia C', semestre: 2, creditos: 4, prerrequisitos: ['A'] },
  { id: 'D', nombre: 'Avanzada D', semestre: 3, creditos: 2, prerrequisitos: ['C'] },
]

test('normaliza el límite de créditos entre 1 y 60', () => {
  assert.equal(normalizarLimiteCreditos(0), 1)
  assert.equal(normalizarLimiteCreditos(12.4), 12)
  assert.equal(normalizarLimiteCreditos(100), 60)
  assert.equal(normalizarLimiteCreditos('inválido'), 12)
})

test('solo considera materias no cursadas con prerrequisitos aprobados', () => {
  assert.deepEqual(
    obtenerMateriasElegibles(materias, new Set()).map((materia) => materia.id),
    ['A', 'B'],
  )
  assert.deepEqual(
    obtenerMateriasElegibles(materias, new Set(['A'])).map((materia) => materia.id),
    ['B', 'C'],
  )
})

test('maximiza créditos sin superar el límite', () => {
  const recomendacion = generarRecomendacionSemestre(materias, [], 6)

  assert.equal(recomendacion.creditosTotales, 4)
  assert.deepEqual(recomendacion.materiasSeleccionadas.map((materia) => materia.id), ['A'])
})

test('prioriza materias que desbloquean más dependencias cuando empatan los créditos', () => {
  const plan = [
    { id: 'A', nombre: 'Con impacto', semestre: 1, creditos: 4, prerrequisitos: [] },
    { id: 'B', nombre: 'Sin impacto', semestre: 1, creditos: 4, prerrequisitos: [] },
    { id: 'C', nombre: 'Continuación', semestre: 2, creditos: 2, prerrequisitos: ['A'] },
  ]

  assert.equal(contarDependientesTransitivos('A', plan), 1)
  assert.deepEqual(
    generarRecomendacionSemestre(plan, [], 4).materiasSeleccionadas.map((materia) => materia.id),
    ['A'],
  )
})

test('normaliza la selección persistida conservando materias elegibles aunque excedan el límite', () => {
  assert.deepEqual(normalizarSeleccionSimulada(['A', 'B', 'A', 'C'], materias, [], 6), ['A', 'B'])
})

test('genera recomendaciones para un plan importado', () => {
  const planImportado = [
    { id: 'ALT101', nombre: 'Inicial', semestre: 1, creditos: 2, prerrequisitos: [] },
    { id: 'ALT201', nombre: 'Siguiente', semestre: 2, creditos: 3, prerrequisitos: ['ALT101'] },
  ]

  assert.deepEqual(
    generarRecomendacionSemestre(planImportado, [], 3).materiasSeleccionadas.map(
      (materia) => materia.id,
    ),
    ['ALT101'],
  )
})
