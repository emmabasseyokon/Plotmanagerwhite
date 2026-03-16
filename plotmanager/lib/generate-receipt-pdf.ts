import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number }
}
import { formatCurrency, formatDate } from './utils'
import { PAYMENT_METHOD_LABELS } from './constants'
import { getThemeColorRgb } from './theme'

export interface ReceiptData {
  companyName: string
  companyEmail: string | null
  companyPhone: string | null
  companyAddress: string | null
  buyerName: string
  buyerEmail: string | null
  buyerPhone: string | null
  estateName: string | null
  plotNumber: string | null
  plotSize: string | null
  numberOfPlots: number | null
  paymentId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  reference: string | null
  notes: string | null
  totalAmount: number
  amountPaid: number
  outstandingBalance: number
}

export function generateReceiptPdf(data: ReceiptData): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const brandRgb = getThemeColorRgb()
  let y = 0

  // --- Header band ---
  doc.setFillColor(brandRgb[0], brandRgb[1], brandRgb[2])
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.companyName, margin, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const contactParts: string[] = []
  if (data.companyAddress) contactParts.push(data.companyAddress)
  if (data.companyPhone) contactParts.push(data.companyPhone)
  if (data.companyEmail) contactParts.push(data.companyEmail)
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), margin, 30)
  }

  // --- Receipt title ---
  y = 56
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT RECEIPT', pageWidth / 2, y, { align: 'center' })

  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const receiptNo = data.paymentId.slice(0, 8).toUpperCase()
  doc.text(`Receipt No: ${receiptNo}`, pageWidth / 2, y, { align: 'center' })

  y += 6
  doc.text(`Date: ${formatDate(data.paymentDate)}`, pageWidth / 2, y, { align: 'center' })

  // --- Divider ---
  y += 8
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)

  // --- Buyer info ---
  y += 10
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Received From:', margin, y)

  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(data.buyerName, margin, y)

  if (data.buyerEmail) {
    y += 5.5
    doc.setTextColor(80, 80, 80)
    doc.text(data.buyerEmail, margin, y)
  }
  if (data.buyerPhone) {
    y += 5.5
    doc.setTextColor(80, 80, 80)
    doc.text(data.buyerPhone, margin, y)
  }

  // --- Property info (right side, same vertical area) ---
  const rightX = pageWidth / 2 + 10
  let rightY = y - (data.buyerEmail ? 5.5 : 0) - (data.buyerPhone ? 5.5 : 0)

  if (data.estateName) {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Property Details:', rightX, rightY)

    rightY += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`Estate: ${data.estateName}`, rightX, rightY)

    if (data.plotNumber) {
      rightY += 5.5
      doc.text(`Plot No: ${data.plotNumber}`, rightX, rightY)
    }
    if (data.plotSize) {
      rightY += 5.5
      doc.text(`Plot Size: ${data.plotSize}`, rightX, rightY)
    }
    if (data.numberOfPlots && data.numberOfPlots > 1) {
      rightY += 5.5
      doc.text(`No. of Plots: ${data.numberOfPlots}`, rightX, rightY)
    }
  }

  y = Math.max(y, rightY) + 12

  // --- Payment Details Table ---
  const paymentRows: string[][] = [
    ['Amount Paid', formatCurrency(data.amount)],
    ['Payment Date', formatDate(data.paymentDate)],
    ['Payment Method', PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod],
  ]
  if (data.reference) {
    paymentRows.push(['Reference', data.reference])
  }
  if (data.notes) {
    paymentRows.push(['Notes', data.notes])
  }

  autoTable(doc, {
    startY: y,
    head: [['Payment Details', '']],
    body: paymentRows,
    theme: 'striped',
    headStyles: {
      fillColor: brandRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  })

  // --- Payment Summary Table ---
  const summaryY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10

  autoTable(doc, {
    startY: summaryY,
    head: [['Payment Summary', 'Amount']],
    body: [
      ['Total Price', formatCurrency(data.totalAmount)],
      ['Total Paid to Date', formatCurrency(data.amountPaid)],
      ['Outstanding Balance', formatCurrency(data.outstandingBalance)],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: brandRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto', halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (hookData) => {
      // Bold the balance row
      if (hookData.section === 'body' && hookData.row.index === 2) {
        hookData.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // --- Footer ---
  const footerY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 20
  doc.setFontSize(9)
  doc.setTextColor(140, 140, 140)
  doc.setFont('helvetica', 'italic')
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, footerY, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.text(`${data.companyName}`, pageWidth / 2, footerY + 6, { align: 'center' })

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
