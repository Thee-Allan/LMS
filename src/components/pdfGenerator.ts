/**
 * NLF PDF Generator — pure browser Canvas + Blob, zero external dependencies.
 * Generates real downloadable PDFs with an embedded electronic company stamp.
 */

// ─── Firm constants ────────────────────────────────────────────────────────
export const FIRM = {
  name:    'Nanyuki Law Firm',
  line2:   'Advocates & Legal Consultants',
  address: 'P.O. Box 1234-10400, Nanyuki, Kenya',
  phone:   '+254 700 100 001',
  email:   'info@nanyukilaw.co.ke',
  website: 'www.nanyukilaw.co.ke',
  kra:     'P051234500Z',
  lsp:     'LSK/2024/NLF/001',
};

// ─── SVG stamp as base64 image ─────────────────────────────────────────────
export function buildStampSVG(size = 160): string {
  const r = size / 2;
  const cx = r, cy = r;
  const outerR = r - 4;
  const innerR = outerR - 10;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="#1a4a8a" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="#1a4a8a" stroke-width="1.5"/>
    <path id="top-arc" d="M ${cx - innerR + 8},${cy} A ${innerR - 8},${innerR - 8} 0 0,1 ${cx + innerR - 8},${cy}" fill="none"/>
    <text font-family="Arial,sans-serif" font-size="${Math.round(size * 0.1)}px" font-weight="bold" fill="#1a4a8a" text-anchor="middle">
      <textPath href="#top-arc" startOffset="50%">NANYUKI LAW FIRM</textPath>
    </text>
    <text x="${cx}" y="${cy - 12}" font-family="Arial,sans-serif" font-size="${Math.round(size * 0.09)}px" fill="#1a4a8a" text-anchor="middle" font-weight="bold">⚖</text>
    <text x="${cx}" y="${cy + 8}" font-family="Arial,sans-serif" font-size="${Math.round(size * 0.07)}px" fill="#1a4a8a" text-anchor="middle">ADVOCATES</text>
    <text x="${cx}" y="${cy + 20}" font-family="Arial,sans-serif" font-size="${Math.round(size * 0.065)}px" fill="#1a4a8a" text-anchor="middle">NANYUKI, KENYA</text>
    <path id="bot-arc" d="M ${cx - innerR + 8},${cy} A ${innerR - 8},${innerR - 8} 0 0,0 ${cx + innerR - 8},${cy}" fill="none"/>
    <text font-family="Arial,sans-serif" font-size="${Math.round(size * 0.075)}px" fill="#1a4a8a" text-anchor="middle">
      <textPath href="#bot-arc" startOffset="50%">EST. 2010</textPath>
    </text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function kes(n: number) { return 'KES ' + n.toLocaleString('en-KE', { minimumFractionDigits: 2 }); }
function today() { return new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }); }

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length <= maxChars) {
      line = (line + ' ' + w).trim();
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ─── Core PDF builder ─────────────────────────────────────────────────────
interface DrawCtx {
  c: CanvasRenderingContext2D;
  y: number;         // current Y cursor
  W: number;         // page width
  H: number;         // page height
  margin: number;
  contentW: number;
}

function newPage(W = 794, H = 1123): DrawCtx {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, W, H);
  return { c, y: 0, W, H, margin: 50, contentW: W - 100 };
}

function drawHeader(ctx: DrawCtx) {
  const { c, W, margin } = ctx;
  // top bar
  c.fillStyle = '#1a3a6e';
  c.fillRect(0, 0, W, 70);
  c.fillStyle = '#c8a84b';
  c.fillRect(0, 70, W, 4);

  // firm name
  c.fillStyle = '#ffffff';
  c.font = 'bold 22px Arial';
  c.fillText(FIRM.name.toUpperCase(), margin, 32);
  c.font = '12px Arial';
  c.fillStyle = '#aac4f0';
  c.fillText(FIRM.line2, margin, 52);

  // contact right
  c.font = '10px Arial';
  c.fillStyle = '#cce0ff';
  c.textAlign = 'right';
  c.fillText(FIRM.phone + '  |  ' + FIRM.email, W - margin, 30);
  c.fillText(FIRM.address, W - margin, 44);
  c.fillText('LSK: ' + FIRM.lsp + '  |  KRA: ' + FIRM.kra, W - margin, 58);
  c.textAlign = 'left';

  ctx.y = 95;
}

function drawFooter(ctx: DrawCtx) {
  const { c, W, H, margin } = ctx;
  c.fillStyle = '#1a3a6e';
  c.fillRect(0, H - 40, W, 40);
  c.fillStyle = '#c8a84b';
  c.fillRect(0, H - 44, W, 4);
  c.fillStyle = '#aac4f0';
  c.font = '9px Arial';
  c.textAlign = 'center';
  c.fillText(`${FIRM.name}  •  ${FIRM.address}  •  ${FIRM.website}`, W / 2, H - 22);
  c.fillText(`Generated: ${today()}  •  This is a computer-generated document`, W / 2, H - 10);
  c.textAlign = 'left';
}

async function drawStamp(ctx: DrawCtx, x: number, y: number, size = 120): Promise<void> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { ctx.c.globalAlpha = 0.85; ctx.c.drawImage(img, x, y, size, size); ctx.c.globalAlpha = 1; resolve(); };
    img.onerror = () => resolve();
    img.src = buildStampSVG(size);
  });
}

function sectionTitle(ctx: DrawCtx, title: string) {
  const { c, margin, contentW } = ctx;
  c.fillStyle = '#1a3a6e';
  c.fillRect(margin, ctx.y, contentW, 26);
  c.fillStyle = '#ffffff';
  c.font = 'bold 12px Arial';
  c.fillText(title.toUpperCase(), margin + 10, ctx.y + 17);
  ctx.y += 34;
}

function row(ctx: DrawCtx, label: string, value: string, shade = false) {
  const { c, margin, contentW } = ctx;
  if (shade) { c.fillStyle = '#f0f4fb'; c.fillRect(margin, ctx.y, contentW, 20); }
  c.font = '10px Arial';
  c.fillStyle = '#6b7280';
  c.fillText(label, margin + 8, ctx.y + 13);
  c.fillStyle = '#111827';
  c.font = 'bold 10px Arial';
  c.fillText(value, margin + 200, ctx.y + 13);
  ctx.y += 20;
}

function divider(ctx: DrawCtx) {
  ctx.c.strokeStyle = '#e5e7eb';
  ctx.c.lineWidth = 1;
  ctx.c.beginPath();
  ctx.c.moveTo(ctx.margin, ctx.y);
  ctx.c.lineTo(ctx.margin + ctx.contentW, ctx.y);
  ctx.c.stroke();
  ctx.y += 6;
}

function textBlock(ctx: DrawCtx, text: string, bold = false) {
  const { c, margin, contentW } = ctx;
  c.font = (bold ? 'bold ' : '') + '10px Arial';
  c.fillStyle = '#374151';
  const lines = wrap(text, Math.floor(contentW / 6.2));
  for (const l of lines) {
    c.fillText(l, margin + 8, ctx.y + 12);
    ctx.y += 16;
  }
  ctx.y += 4;
}

// ─── Convert canvas to PDF-compatible blob ─────────────────────────────────
function canvasToPDFBlob(canvas: HTMLCanvasElement, filename: string): void {
  // We encode as a single-page PDF with the canvas PNG embedded
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename.replace('.pdf', '.png') : filename;
    // Actually we'll do a proper PDF via data-uri trick below
    URL.revokeObjectURL(url);
  });
}

// ─── Proper PDF generation via canvas → image embedded in PDF ──────────────
async function downloadAsPDF(ctx: DrawCtx, filename: string): Promise<void> {
  drawFooter(ctx);
  const { c } = ctx;
  const canvas = c.canvas;

  // Get the PNG data
  const pngDataUrl = canvas.toDataURL('image/png');
  const pngBase64 = pngDataUrl.split(',')[1];
  const pngBytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));

  // PDF dimensions (A4 in points: 595 x 842, scale from canvas 794x1123)
  const W = 595, H = 842;

  // Build minimal valid PDF
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;

  function pushStr(s: string) {
    const b = enc.encode(s);
    parts.push(b);
    pos += b.length;
  }
  function pushBytes(b: Uint8Array) {
    parts.push(b);
    pos += b.length;
  }

  // Header
  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets[1] = pos;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  offsets[2] = pos;
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 4: Image XObject
  offsets[4] = pos;
  pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pngBytes.length} >>\nstream\n`);
  // Use JPEG instead for proper DCT
  const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const jpgBase64 = jpgDataUrl.split(',')[1];
  const jpgBytes = Uint8Array.from(atob(jpgBase64), c => c.charCodeAt(0));
  // Redo object 4 with JPEG
  parts.pop(); parts.pop(); parts.pop(); parts.pop(); parts.pop();
  pos = offsets[4];
  offsets[4] = pos;
  pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgBytes.length} >>\nstream\n`);
  pushBytes(jpgBytes);
  pushStr('\nendstream\nendobj\n');

  // Object 5: Page content stream
  const contentStream = `q\n${W} 0 0 ${H} 0 0 cm\n/Im1 Do\nQ\n`;
  offsets[5] = pos;
  pushStr(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

  // Object 3: Page
  offsets[3] = pos;
  pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 5 0 R /Resources << /XObject << /Im1 4 0 R >> >> >>\nendobj\n`);

  // XRef
  const xrefOffset = pos;
  const xrefCount = 6;
  pushStr(`xref\n0 ${xrefCount}\n`);
  pushStr('0000000000 65535 f \n');
  for (let i = 1; i < xrefCount; i++) {
    pushStr((offsets[i] || 0).toString().padStart(10, '0') + ' 00000 n \n');
  }
  pushStr(`trailer\n<< /Size ${xrefCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  // Combine all parts
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }

  const blob = new Blob([out], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export interface InvoiceData {
  invoiceNumber: string; clientName: string; matterNumber: string;
  issuedDate: string; dueDate: string; status: string;
  items: { description: string; hours: number; rate: number; amount: number }[];
  tax: number; discount: number; amount: number; paid: number;
}

export async function downloadInvoicePDF(inv: InvoiceData): Promise<void> {
  const ctx = newPage();
  drawHeader(ctx);

  // Title band
  ctx.c.fillStyle = '#f8faff';
  ctx.c.fillRect(ctx.margin, ctx.y, ctx.contentW, 50);
  ctx.c.strokeStyle = '#c8a84b';
  ctx.c.lineWidth = 2;
  ctx.c.strokeRect(ctx.margin, ctx.y, ctx.contentW, 50);
  ctx.c.font = 'bold 20px Arial';
  ctx.c.fillStyle = '#1a3a6e';
  ctx.c.fillText('INVOICE', ctx.margin + 14, ctx.y + 32);
  ctx.c.font = 'bold 14px Arial';
  ctx.c.fillStyle = '#c8a84b';
  ctx.c.textAlign = 'right';
  ctx.c.fillText(inv.invoiceNumber, ctx.margin + ctx.contentW - 14, ctx.y + 32);
  ctx.c.textAlign = 'left';
  ctx.y += 62;

  sectionTitle(ctx, 'Invoice Details');
  row(ctx, 'Client', inv.clientName, true);
  row(ctx, 'Matter Reference', inv.matterNumber, false);
  row(ctx, 'Issue Date', inv.issuedDate, true);
  row(ctx, 'Due Date', inv.dueDate, false);
  row(ctx, 'Status', inv.status.toUpperCase(), true);
  ctx.y += 10;

  sectionTitle(ctx, 'Fee Items');
  // table header
  const { c, margin, contentW } = ctx;
  c.fillStyle = '#e8eef8';
  c.fillRect(margin, ctx.y, contentW, 22);
  c.font = 'bold 9px Arial'; c.fillStyle = '#1a3a6e';
  c.fillText('DESCRIPTION', margin + 8, ctx.y + 14);
  c.fillText('HRS', margin + 340, ctx.y + 14);
  c.fillText('RATE (KES)', margin + 390, ctx.y + 14);
  c.fillText('AMOUNT (KES)', margin + 470, ctx.y + 14);
  ctx.y += 22;

  inv.items.forEach((item, i) => {
    if (i % 2 === 0) { c.fillStyle = '#f9fafb'; c.fillRect(margin, ctx.y, contentW, 20); }
    c.font = '10px Arial'; c.fillStyle = '#374151';
    c.fillText(item.description.slice(0, 50), margin + 8, ctx.y + 13);
    c.fillText(String(item.hours), margin + 340, ctx.y + 13);
    c.fillText(item.rate.toLocaleString(), margin + 390, ctx.y + 13);
    c.font = 'bold 10px Arial';
    c.fillText(item.amount.toLocaleString(), margin + 470, ctx.y + 13);
    ctx.y += 20;
  });
  divider(ctx);

  // Totals
  const subtotal = inv.items.reduce((s, i) => s + i.amount, 0);
  ctx.y += 4;
  const totals = [
    ['Subtotal', kes(subtotal)],
    ['VAT (16%)', kes(inv.tax)],
    ...(inv.discount > 0 ? [['Discount', '-' + kes(inv.discount)]] : []),
    ['TOTAL DUE', kes(inv.amount)],
    ['Amount Paid', kes(inv.paid)],
    ['BALANCE', kes(inv.amount - inv.paid)],
  ];
  for (const [l, v] of totals) {
    const isBold = l === 'TOTAL DUE' || l === 'BALANCE';
    if (isBold) { c.fillStyle = '#f0f4fb'; c.fillRect(margin + contentW - 320, ctx.y, 320, 22); }
    c.font = (isBold ? 'bold ' : '') + '11px Arial';
    c.fillStyle = l === 'BALANCE' ? '#dc2626' : '#111827';
    c.textAlign = 'right';
    c.fillText(l, margin + contentW - 180, ctx.y + 15);
    c.fillText(v, margin + contentW - 8, ctx.y + 15);
    c.textAlign = 'left';
    ctx.y += isBold ? 26 : 20;
  }

  ctx.y += 20;
  sectionTitle(ctx, 'Payment Instructions');
  textBlock(ctx, 'Bank: Kenya Commercial Bank | Branch: Nanyuki | A/C: 1234567890 | A/C Name: Nanyuki Law Firm');
  textBlock(ctx, 'M-PESA Paybill: 522522 | Account: ' + inv.invoiceNumber);
  textBlock(ctx, 'Please quote invoice number when making payment. Cheques payable to "Nanyuki Law Firm".');

  ctx.y += 10;
  // Signature line
  c.strokeStyle = '#1a3a6e'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(margin, ctx.y + 40); c.lineTo(margin + 200, ctx.y + 40); c.stroke();
  c.font = '9px Arial'; c.fillStyle = '#6b7280';
  c.fillText('Authorised Signature', margin, ctx.y + 52);
  c.fillText(FIRM.name, margin, ctx.y + 63);

  await drawStamp(ctx, margin + contentW - 140, ctx.y + 10, 120);
  ctx.y += 90;

  await downloadAsPDF(ctx, `Invoice-${inv.invoiceNumber}.pdf`);
}

// ─── Matter / Case Report ─────────────────────────────────────────────────
export interface MatterData {
  matterNumber: string; title: string; clientName: string; practiceArea: string;
  status: string; assignedAdvocate: string; court: string; registry: string;
  filingDate: string; nextHearing: string; description: string;
  opposingParty: string; opposingCounsel: string; value: number;
}

export async function downloadMatterPDF(m: MatterData): Promise<void> {
  const ctx = newPage();
  drawHeader(ctx);

  ctx.c.font = 'bold 18px Arial'; ctx.c.fillStyle = '#1a3a6e';
  ctx.c.fillText('MATTER REPORT', ctx.margin, ctx.y + 20);
  ctx.c.font = '12px Arial'; ctx.c.fillStyle = '#c8a84b';
  ctx.c.fillText(m.matterNumber, ctx.margin, ctx.y + 36);
  ctx.y += 50;

  sectionTitle(ctx, 'Matter Overview');
  row(ctx, 'Matter Number', m.matterNumber, true);
  row(ctx, 'Title', m.title, false);
  row(ctx, 'Client', m.clientName, true);
  row(ctx, 'Practice Area', m.practiceArea, false);
  row(ctx, 'Status', m.status.toUpperCase(), true);
  row(ctx, 'Matter Value', kes(m.value), false);
  ctx.y += 8;

  sectionTitle(ctx, 'Legal Team & Court Details');
  row(ctx, 'Assigned Advocate', m.assignedAdvocate, true);
  row(ctx, 'Court', m.court, false);
  row(ctx, 'Registry', m.registry, true);
  row(ctx, 'Filing Date', m.filingDate || 'Not filed', false);
  row(ctx, 'Next Hearing', m.nextHearing || 'Not scheduled', true);
  ctx.y += 8;

  sectionTitle(ctx, 'Opposing Parties');
  row(ctx, 'Opposing Party', m.opposingParty || 'N/A', true);
  row(ctx, 'Opposing Counsel', m.opposingCounsel || 'N/A', false);
  ctx.y += 8;

  sectionTitle(ctx, 'Case Description');
  textBlock(ctx, m.description);
  ctx.y += 10;

  // Signature & stamp
  const { c, margin, contentW } = ctx;
  c.strokeStyle = '#1a3a6e'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(margin, ctx.y + 40); c.lineTo(margin + 200, ctx.y + 40); c.stroke();
  c.font = '9px Arial'; c.fillStyle = '#6b7280';
  c.fillText('Prepared by', margin, ctx.y + 52);
  c.fillText(FIRM.name, margin, ctx.y + 63);
  c.fillText('Date: ' + today(), margin, ctx.y + 74);

  await drawStamp(ctx, margin + contentW - 140, ctx.y + 5, 120);
  ctx.y += 90;

  await downloadAsPDF(ctx, `Matter-${m.matterNumber.replace(/\//g, '-')}.pdf`);
}

// ─── Client Profile ───────────────────────────────────────────────────────
export interface ClientData {
  name: string; type: string; email: string; phone: string;
  kraPin: string; address: string; idNumber: string; contactPerson?: string;
  notes: string; status: string; createdAt: string; mattersCount: number;
}

export async function downloadClientPDF(cl: ClientData): Promise<void> {
  const ctx = newPage();
  drawHeader(ctx);

  ctx.c.font = 'bold 18px Arial'; ctx.c.fillStyle = '#1a3a6e';
  ctx.c.fillText('CLIENT PROFILE', ctx.margin, ctx.y + 20);
  ctx.y += 40;

  sectionTitle(ctx, 'Client Information');
  row(ctx, 'Full Name / Company', cl.name, true);
  row(ctx, 'Client Type', cl.type.charAt(0).toUpperCase() + cl.type.slice(1), false);
  row(ctx, 'Email', cl.email, true);
  row(ctx, 'Phone', cl.phone, false);
  row(ctx, 'KRA PIN', cl.kraPin, true);
  row(ctx, 'ID / Reg. Number', cl.idNumber, false);
  row(ctx, 'Address', cl.address, true);
  if (cl.contactPerson) row(ctx, 'Contact Person', cl.contactPerson, false);
  row(ctx, 'Client Since', cl.createdAt, true);
  row(ctx, 'Status', cl.status.toUpperCase(), false);
  row(ctx, 'Total Matters', String(cl.mattersCount), true);
  ctx.y += 8;

  if (cl.notes) {
    sectionTitle(ctx, 'Notes');
    textBlock(ctx, cl.notes);
  }
  ctx.y += 20;

  const { c, margin, contentW } = ctx;
  c.strokeStyle = '#1a3a6e'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(margin, ctx.y + 40); c.lineTo(margin + 200, ctx.y + 40); c.stroke();
  c.font = '9px Arial'; c.fillStyle = '#6b7280';
  c.fillText('Authorised Signature & Date', margin, ctx.y + 52);

  await drawStamp(ctx, margin + contentW - 140, ctx.y + 5, 120);
  await downloadAsPDF(ctx, `Client-${cl.name.replace(/\s+/g, '-')}.pdf`);
}

// ─── User / Staff Profile ─────────────────────────────────────────────────
export interface StaffData {
  name: string; role: string; title: string; email: string; phone: string;
  billingRate: number; permissions: string[];
}

const roleDocSlots: Record<string, string[]> = {
  super_admin:      ['National ID / Passport', 'LSK Practicing Certificate', 'Academic Certificates', 'KRA PIN Certificate'],
  managing_partner: ['National ID / Passport', 'LSK Practicing Certificate', 'Partnership Deed', 'Academic Certificates', 'KRA PIN Certificate'],
  advocate:         ['National ID / Passport', 'LSK Practicing Certificate', 'Call to Bar Certificate', 'Academic Certificates'],
  paralegal:        ['National ID / Passport', 'Academic Certificates', 'Professional Certificate'],
  accountant:       ['National ID / Passport', 'CPA / ACCA Certificate', 'Academic Certificates'],
  reception:        ['National ID / Passport', 'Academic Certificates'],
  client:           ['National ID / Passport', 'KRA PIN Certificate', 'Business Registration (if corporate)'],
};

export function getDocSlotsForRole(role: string): string[] {
  return roleDocSlots[role] || ['National ID / Passport'];
}

export async function downloadStaffPDF(s: StaffData): Promise<void> {
  const ctx = newPage();
  drawHeader(ctx);

  ctx.c.font = 'bold 18px Arial'; ctx.c.fillStyle = '#1a3a6e';
  ctx.c.fillText('STAFF PROFILE', ctx.margin, ctx.y + 20);
  ctx.y += 40;

  sectionTitle(ctx, 'Personal & Role Details');
  row(ctx, 'Full Name', s.name, true);
  row(ctx, 'Role', s.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), false);
  row(ctx, 'Title', s.title, true);
  row(ctx, 'Email', s.email, false);
  row(ctx, 'Phone', s.phone, true);
  row(ctx, 'Billing Rate', s.billingRate > 0 ? kes(s.billingRate) + '/hr' : 'N/A', false);
  ctx.y += 8;

  sectionTitle(ctx, 'System Permissions');
  const perms = getDocSlotsForRole(s.role);
  for (let i = 0; i < perms.length; i++) {
    row(ctx, String(i + 1).padStart(2, '0'), perms[i], i % 2 === 0);
  }
  ctx.y += 20;

  const { c, margin, contentW } = ctx;
  c.strokeStyle = '#1a3a6e'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(margin, ctx.y + 40); c.lineTo(margin + 200, ctx.y + 40); c.stroke();
  c.font = '9px Arial'; c.fillStyle = '#6b7280';
  c.fillText('HR Authorisation', margin, ctx.y + 52);
  c.fillText('Date: ' + today(), margin, ctx.y + 63);

  await drawStamp(ctx, margin + contentW - 140, ctx.y + 5, 120);
  await downloadAsPDF(ctx, `Staff-${s.name.replace(/\s+/g, '-')}.pdf`);
}

// ─── Summary Report ───────────────────────────────────────────────────────
export interface ReportData {
  title: string;
  sections: { heading: string; rows: [string, string][] }[];
}

export async function downloadReportPDF(report: ReportData): Promise<void> {
  const ctx = newPage();
  drawHeader(ctx);

  ctx.c.font = 'bold 18px Arial'; ctx.c.fillStyle = '#1a3a6e';
  ctx.c.fillText(report.title.toUpperCase(), ctx.margin, ctx.y + 20);
  ctx.c.font = '11px Arial'; ctx.c.fillStyle = '#6b7280';
  ctx.c.fillText('Generated: ' + today(), ctx.margin, ctx.y + 36);
  ctx.y += 52;

  for (const section of report.sections) {
    sectionTitle(ctx, section.heading);
    section.rows.forEach(([l, v], i) => row(ctx, l, v, i % 2 === 0));
    ctx.y += 8;
  }

  const { c, margin, contentW } = ctx;
  await drawStamp(ctx, margin + contentW - 140, ctx.y + 5, 120);
  ctx.y += 10;
  c.font = '9px Arial'; c.fillStyle = '#6b7280';
  c.fillText('This report is confidential and intended solely for authorised personnel of ' + FIRM.name, margin, ctx.y + 130);

  await downloadAsPDF(ctx, `Report-${report.title.replace(/\s+/g, '-')}.pdf`);
}

// ─── Document Receipt ─────────────────────────────────────────────────────
export async function downloadDocumentReceipt(docName: string, uploadedBy: string, matterId?: string): Promise<void> {
  const ctx = newPage();
  drawHeader(ctx);

  ctx.c.font = 'bold 18px Arial'; ctx.c.fillStyle = '#1a3a6e';
  ctx.c.fillText('DOCUMENT RECEIPT', ctx.margin, ctx.y + 20);
  ctx.y += 40;

  sectionTitle(ctx, 'Document Details');
  row(ctx, 'Document Name', docName, true);
  row(ctx, 'Uploaded By', uploadedBy, false);
  row(ctx, 'Matter Reference', matterId || 'General', true);
  row(ctx, 'Upload Date & Time', new Date().toLocaleString('en-KE'), false);
  row(ctx, 'Receipt No.', 'RCP-' + Date.now().toString().slice(-8), true);
  ctx.y += 20;

  textBlock(ctx, 'This confirms that the above-named document has been received and securely stored in the ' + FIRM.name + ' document management system. Access is controlled per the firm\'s data governance policy.');

  const { c, margin, contentW } = ctx;
  c.strokeStyle = '#1a3a6e'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(margin, ctx.y + 40); c.lineTo(margin + 200, ctx.y + 40); c.stroke();
  c.font = '9px Arial'; c.fillStyle = '#6b7280';
  c.fillText('Records Officer, ' + FIRM.name, margin, ctx.y + 52);

  await drawStamp(ctx, margin + contentW - 140, ctx.y + 5, 120);
  await downloadAsPDF(ctx, `Receipt-${docName.replace(/\s+/g, '-')}.pdf`);
}
