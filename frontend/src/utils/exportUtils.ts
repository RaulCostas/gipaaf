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
        colKey.includes('cantidad') ||
        colKey.includes('existencia') ||
        colKey.includes('stock') ||
        colKey.startsWith('stock_') ||
        colKey.includes('costo') || 
        colKey.includes('margen') || 
        colKey.includes('cuenta') ||
        colKey.includes('credito') ||
        colKey.includes('abono')
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
    return k.includes('ingreso') || k.includes('salida') || k.includes('saldo') || k.includes('total') || k.includes('monto') || k.includes('precio') || k.includes('costo') || k.includes('cantidad') || k.includes('existencia') || k.includes('stock') || k.startsWith('stock_') || k.includes('margen') || k.includes('cuenta') || k.includes('credito') || k.includes('abono');
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

export interface GroupedExportSection {
  groupTitle: string;
  rows: any[];
  subtotals?: Record<string, string>;
}

export const printGroupedData = (
  title: string,
  columns: ExportColumn[],
  groups: GroupedExportSection[],
  subtitle?: string,
  grandTotalFooter?: Record<string, string>
) => {
  const dateStr = format(new Date(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es });

  const isNumericCol = (key: string) => {
    const k = (key || '').toLowerCase();
    return k.includes('ingreso') || k.includes('salida') || k.includes('saldo') || k.includes('total') || k.includes('monto') || k.includes('precio') || k.includes('costo') || k.includes('cantidad') || k.includes('cobrado') || k.includes('credito') || k.includes('abono');
  };
  const isCenterCol = (key: string) => {
    const k = (key || '').toLowerCase();
    return k === 'id' || k === 'nro' || k === 'tipo' || k === 'docnumero' || k.includes('fecha') || k.includes('estado');
  };
  const isNotesCol = (key: string) => {
    const k = (key || '').toLowerCase();
    return k.includes('observ') || k.includes('nota') || k.includes('detalle') || k.includes('descripcion');
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: auto; margin: 12mm; }
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 12px; color: #1e293b; }
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: ${subtitle ? '12px' : '18px'}; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; }
          .logo { max-height: 48px; object-fit: contain; }
          .title-container { text-align: right; }
          .report-title { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .date { color: #64748b; font-size: 11px; margin: 0; }
          
          .subtitle-container { margin-bottom: 14px; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11.5px; line-height: 1.4; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          th, td { padding: 6px 6px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; }
          th { 
            background-color: #e0f2fe; 
            color: #000000; 
            font-weight: 800; 
            border-top: 1px solid #93c5fd;
            border-bottom: 2px solid #2563eb; 
            text-transform: uppercase;
            letter-spacing: 0.3px;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          tr:nth-child(even) { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          
          .client-header {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            padding: 6px 10px;
            background-color: #f1f5f9;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
            margin-bottom: 6px;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }

          .client-block {
            margin-bottom: 18px;
            page-break-inside: avoid;
          }

          .subtotal-row td { 
            background-color: #f1f5f9; 
            color: #000000; 
            font-weight: 800; 
            font-size: 11px; 
            border-top: 2px solid #334155; 
            border-bottom: 2px solid #334155; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          
          @media print {
            body { padding: 0; }
            .header { border-bottom: 1px solid #94a3b8; }
            .client-block { page-break-inside: avoid; }
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
          <div class="subtitle-container">
            <strong style="color: #0f172a; display: inline-block; margin-right: 6px;">Filtros:</strong>
            <span style="color: #334155;">${subtitle}</span>
          </div>
        ` : ''}

        ${groups.map(group => `
          <div class="client-block">
            <div class="client-header">
              ${group.groupTitle}
            </div>
            <table>
              <thead>
                <tr>
                  ${columns.map(c => {
                    const align = isNumericCol(c.dataKey) ? 'right' : (isCenterCol(c.dataKey) ? 'center' : 'left');
                    const isNote = isNotesCol(c.dataKey);
                    const widthStyle = isNote ? 'width: 34%; min-width: 140px;' : (isNumericCol(c.dataKey) ? 'white-space: nowrap;' : '');
                    return `<th style="text-align: ${align}; ${widthStyle}">${c.header}</th>`;
                  }).join('')}
                </tr>
              </thead>
              <tbody>
                ${group.rows.map(row => `
                  <tr>
                    ${columns.map(col => {
                      let val = row[col.dataKey];
                      if (typeof val === 'boolean') {
                        val = val ? 'Activo' : 'Inactivo';
                      }
                      const align = isNumericCol(col.dataKey) ? 'right' : (isCenterCol(col.dataKey) ? 'center' : 'left');
                      const isNote = isNotesCol(col.dataKey);
                      const tdStyle = isNote ? 'word-break: break-word; line-height: 1.3;' : (isNumericCol(col.dataKey) ? 'white-space: nowrap;' : '');
                      return `<td style="text-align: ${align}; ${tdStyle}">${val ?? '-'}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
              ${group.subtotals ? `
                <tfoot>
                  <tr class="subtotal-row">
                    ${columns.map(col => {
                      const align = isNumericCol(col.dataKey) ? 'right' : (isCenterCol(col.dataKey) ? 'center' : 'left');
                      const isNum = isNumericCol(col.dataKey);
                      const val = group.subtotals ? (group.subtotals[col.dataKey] ?? '') : '';
                      return `<td style="text-align: ${align}; ${isNum ? 'white-space: nowrap;' : ''}">${val}</td>`;
                    }).join('')}
                  </tr>
                </tfoot>
              ` : ''}
            </table>
          </div>
        `).join('')}

        ${grandTotalFooter ? `
          <div style="margin-top: 22px; page-break-inside: avoid;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th colspan="${columns.length}" style="text-align: left; background-color: #f1f5f9; color: #0f172a; font-weight: 800; padding: 7px 10px; font-size: 11px; letter-spacing: 0.5px; border-left: 4px solid #2563eb; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #334155; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                    TOTAL GENERAL CONSOLIDADO
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style="background-color: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                  ${columns.map(c => {
                    const align = isNumericCol(c.dataKey) ? 'right' : (isCenterCol(c.dataKey) ? 'center' : 'left');
                    const val = grandTotalFooter[c.dataKey] ?? '';
                    return `<td style="text-align: ${align}; font-weight: 900; padding: 8px 6px; border-top: 2px solid #334155; border-bottom: 2px solid #334155; color: #000000; font-size: 11px;">${val}</td>`;
                  }).join('')}
                </tr>
              </tbody>
            </table>
          </div>
        ` : ''}
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

export const exportGroupedToPDF = async (
  title: string, 
  columns: ExportColumn[], 
  groups: GroupedExportSection[],
  filename: string,
  subtitle?: string,
  grandTotalFooter?: Record<string, string>
) => {
  const isLandscape = columns.length >= 7;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = isLandscape ? 297 : 210;
  const marginX = 14;
  const rightX = pageWidth - marginX;

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

  let tableStartY = 33;
  if (subtitle) {
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const splitSubtitle = doc.splitTextToSize(`Filtros: ${subtitle}`, pageWidth - (marginX * 2));
    doc.text(splitSubtitle, marginX, 31);
    tableStartY = 31 + (splitSubtitle.length * 4) + 3;
  }

  const tableBody: any[] = [];
  groups.forEach(g => {
    tableBody.push([
      {
        content: g.groupTitle,
        colSpan: columns.length,
        styles: {
          fontStyle: 'bold',
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          halign: 'left',
          lineWidth: { top: 0.3, bottom: 0.3, left: 0, right: 0 },
          lineColor: [51, 65, 85]
        }
      }
    ]);

    g.rows.forEach(r => {
      tableBody.push(
        columns.map(c => {
          let val = r[c.dataKey];
          if (typeof val === 'boolean') return val ? 'Activo' : 'Inactivo';
          return val ?? '-';
        })
      );
    });

    if (g.subtotals) {
      tableBody.push(
        columns.map(c => {
          const val = g.subtotals ? (g.subtotals[c.dataKey] ?? '') : '';
          return {
            content: val,
            styles: {
              fontStyle: 'bold',
              fillColor: [250, 250, 250],
              textColor: [15, 23, 42],
              lineWidth: { top: 0.2, bottom: 0.4, left: 0, right: 0 },
              lineColor: [51, 65, 85]
            }
          };
        })
      );
    }
  });

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: tableBody,
    foot: grandTotalFooter ? [columns.map(c => grandTotalFooter[c.dataKey] ?? '')] : undefined,
    showFoot: grandTotalFooter ? 'lastPage' : 'never',
    startY: tableStartY,
    margin: { left: marginX, right: marginX },
    styles: {
      font: 'helvetica',
      fontSize: isLandscape ? 8 : 8.5,
      cellPadding: isLandscape ? 2 : 2.5,
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
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'right',
    },
    didParseCell: (data) => {
      const colKey = columns[data.column.index]?.dataKey?.toLowerCase() || '';
      if (
        colKey.includes('total') || 
        colKey.includes('subtotal') || 
        colKey.includes('descuento') || 
        colKey.includes('monto') || 
        colKey.includes('precio') || 
        colKey.includes('saldo') || 
        colKey.includes('cantidad') ||
        colKey.includes('cobrado')
      ) {
        if (data.section === 'body' && !(data.cell.raw as any)?.colSpan) {
          data.cell.styles.halign = 'right';
        }
      } else if (
        colKey.includes('fecha') || 
        colKey.includes('numero') || 
        colKey === 'id' || 
        colKey === 'tipo' ||
        colKey.includes('estado')
      ) {
        if (data.section === 'body' && !(data.cell.raw as any)?.colSpan) {
          data.cell.styles.halign = 'center';
        }
      }
    }
  });

  doc.save(`${filename}.pdf`);
};

export const exportGroupedToExcel = (
  columns: ExportColumn[], 
  groups: GroupedExportSection[], 
  filename: string, 
  grandTotalFooter?: Record<string, string>
) => {
  const mappedData: any[] = [];
  
  groups.forEach(g => {
    const grpRow: any = {};
    grpRow[columns[0].header] = g.groupTitle;
    mappedData.push(grpRow);

    g.rows.forEach(r => {
      const newRow: any = {};
      columns.forEach(col => {
        let val = r[col.dataKey];
        if (typeof val === 'boolean') val = val ? 'Activo' : 'Inactivo';
        newRow[col.header] = val ?? '';
      });
      mappedData.push(newRow);
    });

    if (g.subtotals) {
      const subRow: any = {};
      columns.forEach(col => {
        subRow[col.header] = g.subtotals ? (g.subtotals[col.dataKey] ?? '') : '';
      });
      mappedData.push(subRow);
    }
  });

  if (grandTotalFooter) {
    const footerRow: any = {};
    columns.forEach(col => {
      footerRow[col.header] = grandTotalFooter[col.dataKey] ?? '';
    });
    mappedData.push(footerRow);
  }

  const worksheet = XLSX.utils.json_to_sheet(mappedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  
  const wscols = columns.map(() => ({ wch: 20 }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};



