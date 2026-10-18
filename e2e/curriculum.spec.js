import { expect, test } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel('Correo electrónico').fill('estudiante@example.com')
  await page.getByLabel('Contraseña').fill('demo')
  await page.getByRole('button', { name: 'Entrar al prototipo' }).click()
})

test('mantiene la sesión simulada al recargar sin guardar la contraseña', async ({ page }) => {
  await expect(page.getByText('Sesión de demostración: estudiante@example.com')).toBeVisible()
  await page.reload()

  await expect(page.getByText('Sesión de demostración: estudiante@example.com')).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('avanceCurricular.sesionSimulada')),
  ).toBe('estudiante@example.com')
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    'avanceCurricular.sesionSimulada',
  ])
})

test('cierra la sesión simulada y vuelve a mostrar el formulario', async ({ page }) => {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()

  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Malla Curricular' })).toHaveCount(0)
  expect(
    await page.evaluate(() => localStorage.getItem('avanceCurricular.sesionSimulada')),
  ).toBeNull()
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

  const modulosPdfAntes = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((recurso) => recurso.name)
      .filter((nombre) =>
        /\/(assets\/(report|html2canvas|purify|index\.es)-[^/]+\.js|src\/utils\/report\.js)/.test(
          new URL(nombre).pathname,
        ),
      ),
  )
  expect(modulosPdfAntes).toHaveLength(0)

  const moduloPdfPendiente = page.waitForResponse((respuesta) =>
    /\/(assets\/report-[^/]+\.js|src\/utils\/report\.js)/.test(
      new URL(respuesta.url()).pathname,
    ),
  )
  const descargaPendiente = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar reporte PDF' }).click()
  await moduloPdfPendiente
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

test('importa planes JSON y conserva el avance aislado por plan', async ({ page }) => {
  const plan = [
    {
      id: 'ALT101',
      nombre: 'Álgebra alternativa',
      semestre: 1,
      creditos: 2,
      prerrequisitos: [],
    },
    {
      id: 'ALT201',
      nombre: 'Cálculo alternativo',
      semestre: 2,
      creditos: 3,
      prerrequisitos: ['ALT101'],
    },
  ]

  await page.getByLabel('Cargar otro plan (.json)').setInputFiles({
    name: 'Plan alternativo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(plan)),
  })
  await expect(page.getByRole('heading', { name: 'Plan alternativo' })).toBeVisible()
  await expect(page.getByText('0% completado')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Marcar Álgebra alternativa como cursada' }).check()
  await expect(page.getByText('50% completado')).toBeVisible()

  await page.getByLabel('Plan activo').selectOption('predeterminado')
  await expect(page.getByRole('heading', { name: 'Plan de estudios predeterminado' })).toBeVisible()
  await expect(page.getByText('0% completado')).toBeVisible()
  await page.getByLabel('Plan activo').selectOption({ label: 'Plan alternativo' })
  await expect(page.getByText('50% completado')).toBeVisible()
  await expect(
    page.getByRole('checkbox', { name: 'Desmarcar Álgebra alternativa como cursada' }),
  ).toBeChecked()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Plan alternativo' })).toBeVisible()
  await expect(page.getByText('50% completado')).toBeVisible()
})

test('rechaza planes JSON inválidos sin cambiar la malla seleccionada', async ({ page }) => {
  await page.getByLabel('Cargar otro plan (.json)').setInputFiles({
    name: 'plan-invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([{ id: 'X', nombre: 'Inválida' }])),
  })

  await expect(page.getByRole('alert')).toContainText('semestre inválido')
  await expect(page.getByRole('heading', { name: 'Plan de estudios predeterminado' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cálculo Diferencial' })).toBeVisible()
})

test('genera, ajusta y recupera la simulación después de recargar', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Simulador del próximo semestre' })).toBeVisible()
  await expect(page.getByLabel('Límite de créditos')).toHaveValue('12')

  await page.getByRole('button', { name: 'Generar recomendación' }).click()
  await expect(page.getByText('11 de 12 créditos usados')).toBeVisible()

  const seleccionadasAntes = await page.locator('.planner-subject input:checked').count()
  const materiaAdicional = page.locator('.planner-subject input:not(:checked)').first()
  await expect(materiaAdicional).toBeVisible()
  await materiaAdicional.check({ force: true })
  await expect(page.getByRole('alert')).toContainText('excedería el límite')
  await expect(page.locator('.planner-subject input:checked')).toHaveCount(seleccionadasAntes)
  await page.reload()

  await expect(page.getByText('11 de 12 créditos usados')).toBeVisible()
  await expect(page.locator('.planner-subject input:checked')).toHaveCount(3)
})
