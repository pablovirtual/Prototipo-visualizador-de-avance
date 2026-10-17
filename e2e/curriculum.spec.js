import { expect, test } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('conserva el avance después de recargar la aplicación', async ({ page }) => {
  const materia = page.getByRole('checkbox', {
    name: 'Marcar Fundamentos de Programación como cursada',
  })

  await materia.check()
  await expect(page.getByText('8% completado')).toBeVisible()
  await page.reload()

  await expect(
    page.getByRole('checkbox', {
      name: 'Desmarcar Fundamentos de Programación como cursada',
    }),
  ).toBeChecked()
})

test('filtra las materias disponibles en la interfaz', async ({ page }) => {
  await page.getByRole('button', { name: /Disponibles/ }).click()

  await expect(page.getByText(/materias: disponibles/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Física Mecánica' })).toHaveCount(0)
})

test('descarga un reporte PDF del avance registrado', async ({ page }) => {
  await page
    .getByRole('checkbox', { name: 'Marcar Fundamentos de Programación como cursada' })
    .check()

  const descargaPendiente = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar reporte PDF' }).click()
  const descarga = await descargaPendiente

  expect(descarga.suggestedFilename()).toBe('reporte-avance-curricular.pdf')

  const directorioResultados = path.resolve('test-results')
  const rutaReporte = path.join(directorioResultados, 'reporte-avance-curricular.pdf')
  await mkdir(directorioResultados, { recursive: true })
  await descarga.saveAs(rutaReporte)

  const contenido = await readFile(rutaReporte)
  expect(contenido.subarray(0, 5).toString()).toBe('%PDF-')
  expect(contenido.length).toBeGreaterThan(1000)
})
