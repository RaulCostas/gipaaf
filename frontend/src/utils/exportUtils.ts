import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ExportColumn {
  header: string;
  dataKey: string;
}

// Convert image URL to base64
export const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg');
        resolve(dataURL);
      };
      img.onerror = error => reject(error);
      img.src = url;
    });
};

export const exportToPDF = async (
  title: string, 
  columns: ExportColumn[], 
  data: any[],
  filename: string,
  subtitle?: string,
  footer?: Record<string, string>
) => {
  // Use landscape when there are 7 or more columns so text doesn't squeeze
  const isLandscape = columns.length >= 7;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = isLandscape ? 297 : 210;
  const marginX = 14;
  const rightX = pageWidth - marginX;

  // Logo: 38x16 mm
  try {
    const logoBase64 = await getBase64ImageFromURL('/logo.jpeg');
    doc.addImage(logoBase64, 'JPEG', marginX, 10, 38, 16);
  } catch (e) {
    console.warn('Could not load logo for PDF', e);
  }

  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.text(title, rightX, 17, { align: 'right' });
  
  const dateStr = format(new Date(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha: ${dateStr}`, rightX, 23, { align: 'right' });

  // Filters text comfortably below logo (starts at 31mm)
  let tableStartY = 33;
  if (subtitle) {
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const splitSubtitle = doc.splitTextToSize(`Filtros: ${subtitle}`, pageWidth - (marginX * 2));
    doc.text(splitSubtitle, marginX, 31);
    tableStartY = 31 + (splitSubtitle.length * 4) + 3;
  }

  const tableData = data.map(row => {
    return columns.map(col => {
      let val = row[col.dataKey];
      if (typeof val === 'boolean') return val ? 'Activo' : 'Inactivo';
      return val ?? '-';
    });
  });

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: tableData,
    foot: footer ? [columns.map(c => footer[c.dataKey] ?? '')] : undefined,
    showFoot: footer ? 'lastPage' : 'never',
    startY: tableStartY,
    margin: { left: marginX, right: marginX },
    styles: {
      font: 'helvetica',
      fontSize: isLandscape ? 8.5 : (columns.length > 5 ? 8 : 9),
      cellPadding: isLandscape ? 2.5 : 3,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      halign: 'right',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      const colKey = columns[data.column.index]?.dataKey?.toLowerCase() || '';
      
      // Alignment per column type
      if (
        colKey.includes('total') || 
        colKey.includes('subtotal') || 
        colKey.includes('descuento') || 
        colKey.includes('monto') || 
        colKey.includes('precio') || 
        colKey.includes('saldo') || 
        colKey.includes('cantidad')
      ) {
        if (data.section === 'body') {
          data.cell.styles.halign = 'right';
        }
      } else if (
        colKey.includes('estado') || 
        colKey.includes('fecha') || 
        colKey.includes('numero') || 
        colKey === 'id' || 
        colKey === 'tipo'
      ) {
        if (data.section === 'body') {
          data.cell.styles.halign = 'center';
        }
      }

      if (data.section === 'body') {
        const rawText = String(data.cell.raw || '');
        if (rawText === 'Activo' || rawText === 'CONFIRMADA' || rawText === 'PAGADO') {
          data.cell.styles.textColor = [22, 163, 74]; // green
          data.cell.styles.fontStyle = 'bold';
        } else if (rawText === 'Inactivo' || rawText === 'ANULADA') {
          data.cell.styles.textColor = [220, 38, 38]; // red
          data.cell.styles.fontStyle = 'bold';
        } else if (rawText === 'PENDIENTE') {
          data.cell.styles.textColor = [202, 138, 4]; // yellow/amber
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  doc.save(`${filename}.pdf`);
};

export const exportToExcel = (columns: ExportColumn[], data: any[], filename: string, footer?: Record<string, string>) => {
  const mappedData = data.map(row => {
    const newRow: any = {};
    columns.forEach(col => {
      let val = row[col.dataKey];
      if (typeof val === 'boolean') val = val ? 'Activo' : 'Inactivo';
      newRow[col.header] = val || '';
    });
    return newRow;
  });

  if (footer) {
    const footerRow: any = {};
    columns.forEach(col => {
      footerRow[col.header] = footer[col.dataKey] ?? '';
    });
    mappedData.push(footerRow);
  }

  const worksheet = XLSX.utils.json_to_sheet(mappedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  
  // Basic column width adjustment
  const wscols = columns.map(() => ({ wch: 20 }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const printData = (title: string, columns: ExportColumn[], data: any[], subtitle?: string, footer?: Record<string, string>) => {
  const dateStr = format(new Date(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es });

  const isNumericCol = (key: string) => {
    const k = (key || '').toLowerCase();
    return k.includes('ingreso') || k.includes('salida') || k.includes('saldo') || k.includes('total') || k.includes('monto') || k.includes('precio') || k.includes('costo') || k.includes('cantidad');
  };
  const isCenterCol = (key: string) => {
    const k = (key || '').toLowerCase();
    return k === 'id' || k === 'nro' || k === 'tipo' || k === 'docnumero' || k.includes('fecha') || k.includes('estado');
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: auto; margin: 12mm; }
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 15px; color: #1e293b; }
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: ${subtitle ? '12px' : '20px'}; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; }
          .logo { max-height: 48px; object-fit: contain; }
          .title-container { text-align: right; }
          .report-title { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .date { color: #64748b; font-size: 11px; margin: 0; }
          
          .subtitle-container { margin-bottom: 15px; font-size: 12px; color: #334155; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          th, td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          th { background-color: #2980b9; color: #ffffff; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr:nth-child(even) { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tfoot tr td { 
            background-color: #f1f5f9; 
            color: #0f172a; 
            font-weight: 800; 
            font-size: 11.5px; 
            border-top: 2px solid #334155; 
            border-bottom: 2px solid #334155; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          
          @media print {
            body { padding: 0; }
            .header { border-bottom: 1px solid #94a3b8; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.jpeg" alt="Logo" class="logo" onerror="this.style.display='none'" />
          <div class="title-container">
            <h2 class="report-title">${title}</h2>
            <p class="date">Fecha: ${dateStr}</p>
          </div>
        </div>
        
        ${subtitle ? `
          <div class="subtitle-container" style="margin-bottom: 14px; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11.5px; line-height: 1.4;">
            <strong style="color: #0f172a; display: inline-block; margin-right: 6px;">Detalle:</strong>
            <span style="color: #334155;">${subtitle}</span>
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              ${columns.map(c => {
                const align = isNumericCol(c.dataKey) ? 'right' : (isCenterCol(c.dataKey) ? 'center' : 'left');
                return `<th style="text-align: ${align};">${c.header}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => {
                  let val = row[col.dataKey];
                  if (typeof val === 'boolean') {
                    val = val ? 'Activo' : 'Inactivo';
                  }
                  const align = isNumericCol(col.dataKey) ? 'right' : (isCenterCol(col.dataKey) ? 'center' : 'left');
                  return `<td style="text-align: ${align};">${val ?? '-'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
          ${footer ? `
          <tfoot>
            <tr>
              ${columns.map(c => {
                const align = isNumericCol(c.dataKey) ? 'right' : (isCenterCol(c.dataKey) ? 'center' : 'left');
                const val = footer[c.dataKey] ?? '';
                return `<td style="text-align: ${align}; font-weight: bold;">${val}</td>`;
              }).join('')}
            </tr>
          </tfoot>
          ` : ''}
        </table>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error during printing:', err);
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    }
  }, 350);
};


