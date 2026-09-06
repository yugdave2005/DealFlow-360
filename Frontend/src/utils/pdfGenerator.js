import jsPDF from 'jspdf';

/**
 * DealFlow360 Enterprise-Grade PDF Generation Suite
 * Compliant with GST Tax Invoice & Corporate Commercial Proposal Standards
 */

// Safe Currency Formatter for standard PDF fonts (avoids broken font glyphs)
const formatCurrency = (val) => {
  const num = Number(val || 0);
  return 'INR ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Clean Product Display Name
 */
const cleanProductName = (item, defaultIdx) => {
  let name = item.product?.name || item.snapshotName || item.name || '';
  if (!name || name.startsWith('Hardware Unit ') || name.startsWith('Product ')) {
    if (item.isSubscription) name = 'Enterprise Cloud Platform License (SaaS)';
    else if (item.category === 'SERVICES' || item.snapshotName?.toLowerCase().includes('service')) name = 'Professional Implementation & Setup Service';
    else if (item.snapshotName) name = item.snapshotName.replace(/^[a-f0-9-]{6,}\s*/, '');
    else name = `Commercial Product #${defaultIdx + 1}`;
  }
  return name || `Line Item #${defaultIdx + 1}`;
};

/**
 * =========================================================================
 * 1. PERFECT GST TAX INVOICE GENERATOR
 * =========================================================================
 */
export async function downloadInvoicePDF(invoice) {
  if (!invoice) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id?.slice(0, 8) || '2026-1015'}`;
  const orderNum = invoice.order?.orderNumber || invoice.orderNumber || 'ORD-1015';
  const customerName = invoice.order?.customer?.companyName || invoice.order?.customer?.name || invoice.customer?.companyName || invoice.customer?.name || 'Oscorp Technologies';
  const customerEmail = invoice.order?.customer?.email || invoice.customer?.email || 'contact@oscorptechnologies.com';
  
  const totalAmount = Number(invoice.totalAmount || invoice.amount || 0);
  const isPaidStatus = String(invoice.status).toUpperCase() === 'PAID';
  const paidAmount = isPaidStatus ? totalAmount : Number(invoice.amountPaid || 0);
  const remaining = isPaidStatus ? 0 : Math.max(0, totalAmount - paidAmount);
  const statusText = isPaidStatus ? 'PAID' : (remaining < totalAmount && paidAmount > 0 ? 'PARTIAL' : 'DUE');

  const issueDate = formatDate(invoice.createdAt || new Date());
  const dueDate = formatDate(invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  // Primary Theme Colors
  const darkNavy = [24, 28, 36];      // #181C24
  const brandOrange = [184, 93, 25];  // #B85D19
  const textDark = [35, 38, 43];      // #23262B
  const textMuted = [105, 112, 120];  // #697078
  const borderColor = [225, 228, 232];
  const bgLight = [248, 249, 251];

  // 1. TOP HEADER & ACCENT STRIP
  doc.setFillColor(...brandOrange);
  doc.rect(0, 0, 210, 4, 'F');

  // Header background
  doc.setFillColor(...bgLight);
  doc.rect(0, 4, 210, 36, 'F');

  // Brand Logo / Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...brandOrange);
  doc.text('DealFlow360', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Intelligent B2B Sales & Revenue Operations', 14, 24);
  doc.text('GSTIN: 27AABCT3600Q1Z8 | CIN: U72900MH2026PTC109823', 14, 29);
  doc.text('402, Trade Horizon Towers, BKC, Mumbai - 400051', 14, 34);

  // Document Title & Stamp (Right Top)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...darkNavy);
  doc.text('TAX INVOICE', 196, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(...brandOrange);
  doc.text(invoiceNum, 196, 24, { align: 'right' });

  // Status Badge Tag
  if (isPaidStatus) {
    doc.setFillColor(220, 245, 230);
    doc.roundedRect(156, 27, 40, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(20, 120, 60);
    doc.text('STATUS: PAID', 176, 31.8, { align: 'center' });
  } else {
    doc.setFillColor(255, 243, 225);
    doc.roundedRect(156, 27, 40, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 85, 20);
    doc.text(`STATUS: ${statusText}`, 176, 31.8, { align: 'center' });
  }

  // 2. TWO-COLUMN METADATA SECTION (SELLER / BUYER & INVOICE DETAILS)
  let y = 46;

  // Outer Box for Billing Details
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(14, y, 182, 34, 2, 2, 'FD');
  doc.line(105, y, 105, y + 34); // Center divider

  // Left Column: Billed To (Buyer)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...brandOrange);
  doc.text('BILLED TO (BUYER DETAILS)', 18, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text(customerName, 18, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Email: ${customerEmail}`, 18, y + 17);
  doc.text(`Order Reference: ${orderNum}`, 18, y + 22);
  doc.text('State of Supply: Maharashtra (Code: 27)', 18, y + 27);

  // Right Column: Invoice Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...brandOrange);
  doc.text('INVOICE & PAYMENT DETAILS', 109, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);

  doc.text('Invoice Date:', 109, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(issueDate, 192, y + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Due Date:', 109, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(dueDate, 192, y + 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Place of Supply:', 109, y + 22);
  doc.text('Mumbai, India', 192, y + 22, { align: 'right' });

  doc.text('Reverse Charge:', 109, y + 27);
  doc.text('No (Regular Taxable)', 192, y + 27, { align: 'right' });

  y += 40;

  // 3. LINE ITEMS TABLE
  doc.setFillColor(...darkNavy);
  doc.roundedRect(14, y, 182, 8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  doc.text('#', 17, y + 5.5);
  doc.text('ITEM DESCRIPTION', 26, y + 5.5);
  doc.text('HSN/SAC', 98, y + 5.5);
  doc.text('QTY', 120, y + 5.5, { align: 'center' });
  doc.text('UNIT RATE', 142, y + 5.5, { align: 'right' });
  doc.text('DISC', 162, y + 5.5, { align: 'right' });
  doc.text('TOTAL AMOUNT', 192, y + 5.5, { align: 'right' });

  y += 8;

  const rawItems = invoice.order?.items || [
    { snapshotName: invoice.itemsSummary || 'Commercial Hardware & Services Order', quantity: 1, snapshotUnitPrice: totalAmount }
  ];

  let calculatedTaxableSubtotal = 0;

  rawItems.forEach((it, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 250 : 255, isEven ? 251 : 255, isEven ? 253 : 255);
    doc.rect(14, y, 182, 8.5, 'F');

    const itName = cleanProductName(it, idx);
    const itQty = Number(it.quantity || 1);
    const itRate = Number(it.snapshotUnitPrice || (totalAmount / (rawItems.length || 1)));
    const itDisc = Number(it.snapshotDiscount || 0);
    const itHsn = it.isSubscription ? '998313' : '847130';
    const lineNet = (itQty * itRate) * (1 - itDisc / 100);

    calculatedTaxableSubtotal += lineNet;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);

    doc.text(String(idx + 1), 17, y + 5.5);
    doc.text(itName.length > 38 ? itName.substring(0, 35) + '...' : itName, 26, y + 5.5);
    
    doc.setTextColor(...textMuted);
    doc.text(itHsn, 98, y + 5.5);
    doc.text(String(itQty), 120, y + 5.5, { align: 'center' });

    doc.setTextColor(...textDark);
    doc.text(formatCurrency(itRate).replace('INR ', ''), 142, y + 5.5, { align: 'right' });
    doc.text(itDisc > 0 ? `${itDisc}%` : '0%', 162, y + 5.5, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(lineNet).replace('INR ', ''), 192, y + 5.5, { align: 'right' });

    y += 8.5;
  });

  // Table bottom rule
  doc.setDrawColor(...borderColor);
  doc.line(14, y, 196, y);
  y += 5;

  // 4. TAX BREAKDOWN & GRAND TOTALS CALCULATION
  const taxableValue = calculatedTaxableSubtotal > 0 ? calculatedTaxableSubtotal : (totalAmount / 1.18);
  const cgst = taxableValue * 0.09;
  const sgst = taxableValue * 0.09;
  const finalCalculatedTotal = taxableValue + cgst + sgst;

  // Two columns in the bottom section
  // Left: Bank details & Payment info
  const bankBoxY = y;
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(14, bankBoxY, 95, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...brandOrange);
  doc.text('PAYMENT INSTRUCTIONS & BANK DETAILS', 18, bankBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  doc.text('Bank Name: HDFC Bank Limited (Corporate Banking)', 18, bankBoxY + 12);
  doc.text('Account Name: DealFlow360 Solutions Private Limited', 18, bankBoxY + 17);
  doc.text('Account Number: 50200088991234', 18, bankBoxY + 22);
  doc.text('IFSC Code: HDFC0000128 | Branch: BKC Mumbai', 18, bankBoxY + 27);
  doc.text('UPI Payment ID: payments@dealflow360', 18, bankBoxY + 32);
  doc.text('Online Payment Portal: https://app.dealflow360.com/portal', 18, bankBoxY + 37);

  // Right: Clean Totals Table
  const totalsX = 114;
  const totalsW = 82;
  let tY = y;

  const renderTotalRow = (label, val, isBold = false, color = textDark) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(label, totalsX, tY + 4);
    doc.setTextColor(...color);
    doc.text(val, 196, tY + 4, { align: 'right' });
    tY += 5.5;
  };

  renderTotalRow('Taxable Value (Net):', formatCurrency(taxableValue));
  renderTotalRow('Central GST (CGST @ 9%):', formatCurrency(cgst));
  renderTotalRow('State GST (SGST @ 9%):', formatCurrency(sgst));
  renderTotalRow('Total Invoice Value:', formatCurrency(finalCalculatedTotal), true, brandOrange);

  if (paidAmount > 0) {
    renderTotalRow('Less: Payments Received:', `-${formatCurrency(paidAmount)}`, false, [20, 130, 60]);
  }

  tY += 2;
  // Balance Due Banner Box
  doc.setFillColor(remaining === 0 ? 230 : 255, remaining === 0 ? 245 : 235, remaining === 0 ? 235 : 235);
  doc.roundedRect(totalsX - 2, tY, totalsW + 2, 9, 1.5, 1.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(remaining === 0 ? 20 : 180, remaining === 0 ? 120 : 40, remaining === 0 ? 60 : 20);
  doc.text(remaining === 0 ? 'BALANCE DUE:' : 'NET BALANCE DUE:', totalsX + 2, tY + 6);
  doc.text(formatCurrency(remaining), 194, tY + 6, { align: 'right' });

  // 5. SIGNATURE & VERIFICATION SECTION
  y = bankBoxY + 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Declaration & Terms:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.', 14, y + 4.5);
  doc.text('Subject to Mumbai Jurisdiction. This is a computer-generated tax invoice and requires no physical signature.', 14, y + 8.5);

  // Authorized Signatory Block (Right)
  doc.setDrawColor(...borderColor);
  doc.line(140, y + 16, 196, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  doc.text('For DealFlow360 Solutions Pvt Ltd', 196, y + 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Authorized Signatory / Finance Controller', 196, y + 24, { align: 'right' });

  // Page Footer
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('DealFlow360 Official GST Tax Invoice — Verified Digital Document', 105, 290, { align: 'center' });

  doc.save(`${invoiceNum}_DealFlow360.pdf`);
}

/**
 * =========================================================================
 * 2. PERFECT COMMERCIAL QUOTATION GENERATOR
 * =========================================================================
 */
export async function downloadQuotationPDF(quote) {
  if (!quote) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const activeVersion = quote.activeVersion || (quote.versions && quote.versions[quote.versions.length - 1]) || {};
  const items = activeVersion.items || quote.items || [];
  const customerName = quote.customer?.companyName || quote.customer?.name || quote.customerName || 'Valued Enterprise Client';
  const customerEmail = quote.customer?.email || 'customer@company.com';
  const customerTier = quote.customer?.tier || quote.tier || 'Gold';
  const quoteNumber = quote.quotationNumber || `QT-${quote.id?.slice(0, 8) || 'DRAFT'}`;
  const salesRepName = quote.salesRep?.name || 'Authorized Account Executive';
  const dateStr = formatDate(quote.createdAt || new Date());
  const validUntilStr = formatDate(quote.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const darkNavy = [24, 28, 36];
  const brandOrange = [184, 93, 25];
  const textDark = [35, 38, 43];
  const textMuted = [105, 112, 120];
  const borderColor = [225, 228, 232];
  const bgLight = [248, 249, 251];

  // Accent Header
  doc.setFillColor(...brandOrange);
  doc.rect(0, 0, 210, 4, 'F');

  doc.setFillColor(...bgLight);
  doc.rect(0, 4, 210, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...brandOrange);
  doc.text('DealFlow360', 14, 18);

  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Intelligent Commercial Deal & CPQ Operations Platform', 14, 24);
  doc.text('support@dealflow360.com | www.dealflow360.com', 14, 29);
  doc.text('402, Trade Horizon Towers, BKC, Mumbai - 400051', 14, 34);

  doc.setFontSize(16);
  doc.setTextColor(...darkNavy);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMERCIAL PROPOSAL', 196, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(...brandOrange);
  doc.text(quoteNumber, 196, 24, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${quote.status || 'APPROVED'}`, 196, 31, { align: 'right' });

  let y = 46;

  // Metadata Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(14, y, 182, 34, 2, 2, 'FD');
  doc.line(105, y, 105, y + 34);

  // Left: Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...brandOrange);
  doc.text('PROPOSAL PREPARED FOR:', 18, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text(customerName, 18, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Email: ${customerEmail}`, 18, y + 17);
  doc.text(`Customer Account Tier: ${customerTier} Tier`, 18, y + 22);
  doc.text('Terms: Commercial Quotation as per Agreed Governance', 18, y + 27);

  // Right: Quotation Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...brandOrange);
  doc.text('PROPOSAL SPECIFICATIONS:', 109, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);

  doc.text('Proposal Date:', 109, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(dateStr, 192, y + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Validity Period:', 109, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(validUntilStr, 192, y + 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Account Manager:', 109, y + 22);
  doc.text(salesRepName, 192, y + 22, { align: 'right' });

  doc.text('Pricing Governance:', 109, y + 27);
  doc.text('Multi-Tier Discount Verified', 192, y + 27, { align: 'right' });

  y += 40;

  // Items Table Header
  doc.setFillColor(...darkNavy);
  doc.roundedRect(14, y, 182, 8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  doc.text('#', 17, y + 5.5);
  doc.text('PRODUCT / SERVICE DESCRIPTION', 26, y + 5.5);
  doc.text('CATEGORY', 98, y + 5.5);
  doc.text('QTY', 120, y + 5.5, { align: 'center' });
  doc.text('LIST PRICE', 142, y + 5.5, { align: 'right' });
  doc.text('DISC', 162, y + 5.5, { align: 'right' });
  doc.text('NET TOTAL', 192, y + 5.5, { align: 'right' });

  y += 8;

  let subtotal = 0;
  let totalDiscountVal = 0;

  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 250 : 255, isEven ? 251 : 255, isEven ? 253 : 255);
    doc.rect(14, y, 182, 8.5, 'F');

    const name = cleanProductName(item, index);
    const category = (item.product?.category || item.category || (item.isSubscription ? 'SUBSCRIPTION' : 'HARDWARE')).toUpperCase();
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.product?.basePrice || 0);
    const discount = Number(item.discountPercentage || 0);
    const lineGross = unitPrice * qty;
    const lineNet = lineGross * (1 - discount / 100);

    subtotal += lineGross;
    totalDiscountVal += (lineGross - lineNet);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);

    doc.text(String(index + 1), 17, y + 5.5);
    doc.text(name.length > 38 ? name.substring(0, 35) + '...' : name, 26, y + 5.5);
    
    doc.setTextColor(...textMuted);
    doc.text(category.substring(0, 12), 98, y + 5.5);
    doc.text(String(qty), 120, y + 5.5, { align: 'center' });

    doc.setTextColor(...textDark);
    doc.text(formatCurrency(unitPrice).replace('INR ', ''), 142, y + 5.5, { align: 'right' });
    doc.text(discount > 0 ? `${discount}%` : '0%', 162, y + 5.5, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(lineNet).replace('INR ', ''), 192, y + 5.5, { align: 'right' });

    y += 8.5;
  });

  doc.setDrawColor(...borderColor);
  doc.line(14, y, 196, y);
  y += 5;

  const netTotal = Math.max(0, subtotal - totalDiscountVal);
  const tax = netTotal * 0.18;
  const grandTotal = netTotal + tax;

  // Totals Breakdown
  const totalsX = 114;
  const totalsW = 82;
  let tY = y;

  const renderQuoteRow = (label, val, isBold = false, color = textDark) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(label, totalsX, tY + 4);
    doc.setTextColor(...color);
    doc.text(val, 196, tY + 4, { align: 'right' });
    tY += 5.5;
  };

  renderQuoteRow('Gross List Total:', formatCurrency(subtotal));
  if (totalDiscountVal > 0) {
    renderQuoteRow('Total Commercial Discount:', `-${formatCurrency(totalDiscountVal)}`, false, [180, 40, 40]);
  }
  renderQuoteRow('Taxable Value (Net):', formatCurrency(netTotal));
  renderQuoteRow('Estimated GST / Tax (18%):', formatCurrency(tax));

  tY += 2;
  doc.setFillColor(245, 239, 235);
  doc.roundedRect(totalsX - 2, tY, totalsW + 2, 9, 1.5, 1.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...brandOrange);
  doc.text('FINAL AGREED TOTAL:', totalsX + 2, tY + 6);
  doc.text(formatCurrency(grandTotal), 194, tY + 6, { align: 'right' });

  // Terms & Signatures
  y = tY + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Commercial Terms & Acceptance Conditions:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('1. This proposal is legally binding upon digital acceptance in the DealFlow360 Customer Portal.', 14, y + 4.5);
  doc.text('2. Multi-warehouse stock reservations are valid for 72 hours following commercial approval.', 14, y + 8.5);
  doc.text('3. Recurring subscription licenses will be activated and billed according to the agreed schedule.', 14, y + 12.5);

  y += 22;
  doc.setDrawColor(...borderColor);
  doc.line(14, y + 12, 75, y + 12);
  doc.line(135, y + 12, 196, y + 12);

  doc.setFontSize(7.5);
  doc.text('Customer Authorized Signature', 14, y + 16);
  doc.text('DealFlow360 Representative Signature', 135, y + 16);

  doc.text('DealFlow360 Commercial CPQ Proposal — Verified System Generated Document', 105, 290, { align: 'center' });

  doc.save(`${quoteNumber}_DealFlow360.pdf`);
}
