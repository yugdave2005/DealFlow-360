import jsPDF from 'jspdf';

export const exportToExcel = (data, filename = 'export') => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(field => {
        const val = row[field] === null || row[field] === undefined ? '' : String(row[field]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (headers, rows, filename = 'export', title = 'Data Export') => {
  if (!headers || !rows || rows.length === 0) return;
  
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 22);

  let startY = 32;
  const colWidth = Math.max(25, Math.floor(260 / headers.length));
  
  // Draw header
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => {
    doc.text(String(h), 14 + (i * colWidth), startY);
  });
  doc.line(14, startY + 2, 280, startY + 2);

  // Draw rows
  doc.setFont('helvetica', 'normal');
  rows.slice(0, 22).forEach((row, rIdx) => {
    const y = startY + 8 + (rIdx * 7);
    row.forEach((cell, cIdx) => {
      const text = String(cell ?? '').substring(0, 18);
      doc.text(text, 14 + (cIdx * colWidth), y);
    });
  });

  doc.save(`${filename}.pdf`);
};
