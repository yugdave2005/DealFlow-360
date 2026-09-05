import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet 1') => {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (headers, rows, filename = 'export', title = 'Data Export') => {
  if (!headers || !rows || rows.length === 0) return;
  
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 22);

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    theme: 'grid'
  });

  doc.save(`${filename}.pdf`);
};
