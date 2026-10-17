import { jsPDF } from 'jspdf'
import { calcularEstadisticas, normalizarMateriasCursadas } from './curriculum.js'

export const NOMBRE_REPORTE_PDF = 'reporte-avance-curricular.pdf'

export function crearDatosReporte(materias, idsCursados, fecha = new Date()) {
  const idsNormalizados = normalizarMateriasCursadas(idsCursados, materias)
  const conjuntoIds = new Set(idsNormalizados)

  return {
    fecha: new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(fecha),
    estadisticas: calcularEstadisticas(materias, conjuntoIds),
    materiasCursadas: materias.filter((materia) => conjuntoIds.has(materia.id)),
  }
}

export function crearReportePdf(materias, idsCursados, fecha = new Date()) {
  const datos = crearDatosReporte(materias, idsCursados, fecha)
  const documento = new jsPDF({ unit: 'mm', format: 'a4' })
  const anchoPagina = documento.internal.pageSize.getWidth()
  const margen = 18
  const anchoContenido = anchoPagina - margen * 2

  documento.setProperties({
    title: 'Reporte de avance curricular',
    subject: 'Estado actual del avance académico registrado en el prototipo',
    author: 'Visualizador de Avance Curricular',
    creator: 'Visualizador de Avance Curricular',
  })

  documento.setFillColor(23, 37, 84)
  documento.rect(0, 0, anchoPagina, 43, 'F')
  documento.setTextColor(199, 210, 254)
  documento.setFont('helvetica', 'bold')
  documento.setFontSize(9)
  documento.text('VISUALIZADOR DE AVANCE CURRICULAR', margen, 15)
  documento.setTextColor(255, 255, 255)
  documento.setFontSize(21)
  documento.text('Reporte de avance académico', margen, 28)
  documento.setFont('helvetica', 'normal')
  documento.setFontSize(9)
  documento.text(`Generado el ${datos.fecha}`, margen, 36)

  const tarjetas = [
    { etiqueta: 'AVANCE', valor: `${datos.estadisticas.porcentaje}%` },
    {
      etiqueta: 'MATERIAS',
      valor: `${datos.estadisticas.materiasCompletadas} de ${datos.estadisticas.totalMaterias}`,
    },
    {
      etiqueta: 'CRÉDITOS',
      valor: `${datos.estadisticas.creditosCompletados} de ${datos.estadisticas.totalCreditos}`,
    },
  ]
  const separacion = 4
  const anchoTarjeta = (anchoContenido - separacion * 2) / 3

  tarjetas.forEach((tarjeta, indice) => {
    const x = margen + indice * (anchoTarjeta + separacion)
    documento.setFillColor(238, 242, 255)
    documento.roundedRect(x, 52, anchoTarjeta, 25, 2, 2, 'F')
    documento.setTextColor(79, 70, 229)
    documento.setFont('helvetica', 'bold')
    documento.setFontSize(8)
    documento.text(tarjeta.etiqueta, x + 4, 61)
    documento.setTextColor(23, 37, 84)
    documento.setFontSize(15)
    documento.text(tarjeta.valor, x + 4, 70)
  })

  documento.setFillColor(226, 232, 240)
  documento.roundedRect(margen, 84, anchoContenido, 5, 2.5, 2.5, 'F')
  if (datos.estadisticas.porcentaje > 0) {
    documento.setFillColor(79, 70, 229)
    documento.roundedRect(
      margen,
      84,
      anchoContenido * (datos.estadisticas.porcentaje / 100),
      5,
      2.5,
      2.5,
      'F',
    )
  }

  documento.setTextColor(23, 37, 84)
  documento.setFont('helvetica', 'bold')
  documento.setFontSize(14)
  documento.text('Materias cursadas', margen, 104)

  let y = 114
  if (datos.materiasCursadas.length === 0) {
    documento.setFont('helvetica', 'normal')
    documento.setTextColor(100, 116, 139)
    documento.setFontSize(10)
    documento.text('Todavía no se han registrado materias cursadas.', margen, y)
  } else {
    documento.setFillColor(49, 46, 129)
    documento.rect(margen, y - 6, anchoContenido, 9, 'F')
    documento.setTextColor(255, 255, 255)
    documento.setFont('helvetica', 'bold')
    documento.setFontSize(8)
    documento.text('CLAVE', margen + 4, y)
    documento.text('MATERIA', margen + 28, y)
    documento.text('SEMESTRE', margen + 125, y)
    documento.text('CRÉDITOS', margen + 151, y)
    y += 9

    datos.materiasCursadas.forEach((materia, indice) => {
      if (indice % 2 === 0) {
        documento.setFillColor(248, 250, 252)
        documento.rect(margen, y - 6, anchoContenido, 9, 'F')
      }
      documento.setTextColor(51, 65, 85)
      documento.setFont('helvetica', 'normal')
      documento.setFontSize(8.5)
      documento.text(materia.id, margen + 4, y)
      documento.text(materia.nombre, margen + 28, y, { maxWidth: 92 })
      documento.text(String(materia.semestre), margen + 137, y, { align: 'center' })
      documento.text(String(materia.creditos), margen + 162, y, { align: 'center' })
      y += 9
    })
  }

  documento.setDrawColor(203, 213, 225)
  documento.line(margen, 275, anchoPagina - margen, 275)
  documento.setTextColor(100, 116, 139)
  documento.setFont('helvetica', 'normal')
  documento.setFontSize(8)
  documento.text(
    'Documento generado por el prototipo. La información se almacena localmente en el navegador.',
    margen,
    282,
  )
  documento.text('Página 1 de 1', anchoPagina - margen, 282, { align: 'right' })

  return documento
}

export function descargarReportePdf(materias, idsCursados, fecha = new Date()) {
  crearReportePdf(materias, idsCursados, fecha).save(NOMBRE_REPORTE_PDF)
}
