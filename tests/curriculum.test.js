import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  alternarMateriaCursada,
  calcularEstadisticas,
  crearIndiceMaterias,
  estaMateriaDisponible,
  normalizarMateriasCursadas,
  obtenerPrerrequisitosPendientes,
  validarPlanEstudios,
} from '../src/utils/curriculum.js'

const materias = [
  { id: 'A', nombre: 'Inicial', semestre: 1, creditos: 4, prerrequisitos: [] },
  { id: 'B', nombre: 'Intermedia', semestre: 2, creditos: 3, prerrequisitos: ['A'] },
  { id: 'C', nombre: 'Avanzada', semestre: 3, creditos: 2, prerrequisitos: ['B'] },
]

test('el plan real contiene 12 materias, 40 créditos y referencias válidas', async () => {
  const contenido = await readFile(new URL('../src/data/plan_estudios.json', import.meta.url), 'utf8')
  const plan = JSON.parse(contenido)

  assert.equal(plan.length, 12)
  assert.equal(plan.reduce((total, materia) => total + materia.creditos, 0), 40)
  assert.deepEqual(validarPlanEstudios(plan), [])
})

test('la validación detecta IDs duplicados y prerrequisitos inexistentes', () => {
  const planInvalido = [
    ...materias,
    { id: 'C', nombre: 'Duplicada', semestre: 4, creditos: 1, prerrequisitos: ['X'] },
  ]
  const errores = validarPlanEstudios(planInvalido)

  assert.ok(errores.some((error) => error.includes('duplicado')))
  assert.ok(errores.some((error) => error.includes('inexistente')))
})

test('una materia se desbloquea cuando se cumplen sus prerrequisitos', () => {
  const indice = crearIndiceMaterias(materias)

  assert.equal(estaMateriaDisponible(materias[1], new Set(), indice), false)
  assert.deepEqual(obtenerPrerrequisitosPendientes(materias[1], new Set(), indice), [materias[0]])
  assert.equal(estaMateriaDisponible(materias[1], new Set(['A']), indice), true)
})

test('no permite marcar una materia bloqueada', () => {
  assert.deepEqual(alternarMateriaCursada('B', [], materias), [])
  assert.deepEqual(alternarMateriaCursada('B', ['A'], materias), ['A', 'B'])
})

test('desmarcar un prerrequisito elimina dependientes de forma encadenada', () => {
  assert.deepEqual(alternarMateriaCursada('A', ['A', 'B', 'C'], materias), [])
})

test('normaliza datos persistidos inválidos o académicamente inconsistentes', () => {
  assert.deepEqual(normalizarMateriasCursadas(['C', 'X', 'C'], materias), [])
  assert.deepEqual(normalizarMateriasCursadas(['A', 'B', 'C'], materias), ['A', 'B', 'C'])
})

test('calcula las estadísticas académicas', () => {
  assert.deepEqual(calcularEstadisticas(materias, new Set(['A', 'B'])), {
    materiasCompletadas: 2,
    totalMaterias: 3,
    creditosCompletados: 7,
    totalCreditos: 9,
    porcentaje: 67,
  })
})
