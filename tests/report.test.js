import assert from 'node:assert/strict'
import test from 'node:test'
import { crearDatosReporte, crearReportePdf } from '../src/utils/report.js'

const materias = [
  { id: 'MAT101', nombre: 'Cálculo diferencial', semestre: 1, creditos: 4, prerrequisitos: [] },
  { id: 'PRO101', nombre: 'Fundamentos de programación', semestre: 1, creditos: 4, prerrequisitos: [] },
  { id: 'PRO201', nombre: 'Programación orientada a objetos', semestre: 2, creditos: 4, prerrequisitos: ['PRO101'] },
]

test('prepara estadísticas y materias válidas para el reporte', () => {
  const datos = crearDatosReporte(
    materias,
    ['PRO101', 'PRO201', 'DESCONOCIDA'],
    new Date('2026-10-17T12:00:00'),
  )

  assert.equal(datos.estadisticas.materiasCompletadas, 2)
  assert.equal(datos.estadisticas.creditosCompletados, 8)
  assert.deepEqual(
    datos.materiasCursadas.map((materia) => materia.id),
    ['PRO101', 'PRO201'],
  )
})

test('genera un documento PDF válido', () => {
  const documento = crearReportePdf(materias, ['MAT101'], new Date('2026-10-17T12:00:00'))
  const bytes = new Uint8Array(documento.output('arraybuffer'))
  const encabezado = new TextDecoder().decode(bytes.slice(0, 5))

  assert.equal(encabezado, '%PDF-')
  assert.ok(bytes.length > 1000)
})

test('incorpora la simulación académica en los datos del reporte', () => {
  const datos = crearDatosReporte(
    materias,
    ['MAT101'],
    new Date('2026-10-17T12:00:00'),
    { limiteCreditos: 8, idsSeleccionados: ['PRO101', 'PRO201'] },
  )

  assert.equal(datos.simulacion.limiteCreditos, 8)
  assert.equal(datos.simulacion.creditosSeleccionados, 8)
  assert.deepEqual(datos.simulacion.materias.map((materia) => materia.id), ['PRO101', 'PRO201'])
})
