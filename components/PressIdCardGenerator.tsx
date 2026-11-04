/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useRef } from 'react';
import { Printer, Download, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { isMembershipActive } from '@/lib/business-rules';

export interface PressIdCardProps {
  reporter: {
    id: string;
    reporterId?: string;
    fullName: string;
    mobile: string;
    stateName: string;
    districtName: string;
    mandalName: string;
    photoUrl: string;
    approvedAt?: string;
    expiresAt?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUSPENDED';
  };
  websiteSettings: {
    siteNameEn: string;
    siteNameTe: string;
    domain: string;
    contactEmail: string;
    location: string;
    emergencyContact: string;
    logoUrl?: string;
    secondaryLogoUrl?: string;
  };
  onOpenPublicVerify?: (reporterId: string) => void;
}

function computeQrMatrix(value: string): boolean[][] {
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= gridSize - 8) ||
        (r >= gridSize - 8 && c < 8);
      if (inFinder) continue;
      const seed = (r * 31 + c * 17 + value.charCodeAt((r + c) % value.length) + hash) & 0xff;
      cells[r][c] = seed % 2 === 0;
    }
  }

  return cells;
}

/**
 * Generates a deterministic 21x21 QR-like finder & data matrix SVG from the verification URL string.
 */
function DeterministicQrSvg({ value, size = 96 }: { value: string; size?: number }) {
  const gridSize = 21;
  const cells = computeQrMatrix(value);

  return (
    <svg
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      width={size}
      height={size}
      className="bg-white p-1 border border-slate-300 rounded"
      aria-label={`QR verification code for ${value}`}
    >
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#090D16" />
          ) : null
        )
      )}
    </svg>
  );
}

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function buildPdfFromJpegDataUrl(
  jpegDataUrl: string,
  pixelWidth: number,
  pixelHeight: number
): Blob {
  const base64Data = jpegDataUrl.split(',')[1] || '';
  const binaryStr = atob(base64Data);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  // Page size in PDF points (72 dpi): 842 x 528 pt (Landscape ID Card Sheet)
  const pageW = 842;
  const pageH = 528;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let currentLength = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    currentLength += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentLength += bytes.length;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets[1] = currentLength;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  offsets[2] = currentLength;
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page
  offsets[3] = currentLength;
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${pageW} ${pageH}] /Contents 5 0 R >>\nendobj\n`
  );

  // Object 4: Image XObject
  offsets[4] = currentLength;
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  // Object 5: Content Stream
  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = encoder.encode(contentStream);
  offsets[5] = currentLength;
  pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr('endstream\nendobj\n');

  // XRef Table
  const xrefOffset = currentLength;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const padded = String(offsets[i]).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }

  pushStr(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  const combined = new Uint8Array(currentLength);
  let writePos = 0;
  for (const chunk of chunks) {
    combined.set(chunk, writePos);
    writePos += chunk.length;
  }

  return new Blob([combined.buffer], { type: 'application/pdf' });
}

export const PressIdCardGenerator: React.FC<PressIdCardProps> = ({
  reporter,
  websiteSettings,
  onOpenPublicVerify,
}) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [downloadingFormat, setDownloadingFormat] = React.useState<
    'pdf' | 'jpg' | 'png' | null
  >(null);

  const active = isMembershipActive(reporter.status, reporter.expiresAt);
  const badgeStatus = active ? 'ACTIVE' : 'EXPIRED';
  const cardId = reporter.reporterId || 'PENDING-APPROVAL';
  const verificationUrl = `${websiteSettings.domain}/verify/${encodeURIComponent(cardId)}`;
  const primaryLogo =
    websiteSettings.logoUrl ||
    '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png';
  const secondaryLogo =
    websiteSettings.secondaryLogoUrl ||
    '/assets/aistudio/Gemini_Generated_Image_qkr1reqkr1reqkr1_459f1767.png';

  const handlePrintIdCard = () => {
    window.print();
  };

  const renderHighResIdCardCanvas = async (): Promise<HTMLCanvasElement> => {
    const W = 2200;
    const H = 1380;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Load images in parallel
    const [logo1Img, logo2Img, photoImg] = await Promise.all([
      loadImageElement(primaryLogo),
      loadImageElement(secondaryLogo),
      loadImageElement(reporter.photoUrl || primaryLogo),
    ]);

    // Sheet Background
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, W, H);

    // Top Sheet Header Title
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 34px "Noto Sans Telugu", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${websiteSettings.siteNameEn} (${websiteSettings.siteNameTe}) – Official Press Reporter Identity Card`,
      W / 2,
      62
    );

    const cardW = 920;
    const cardH = 1200;
    const frontX = 130;
    const backX = 1150;
    const cardY = 105;

    // =========================================================================
    // 1. FRONT CARD
    // =========================================================================
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(frontX, cardY, cardW, cardH);

    // Front Red Header
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(frontX, cardY, cardW, 175);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(frontX, cardY + 175, cardW, 6);

    // Left Logo (NETI BHARATHAM)
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(frontX + 26, cardY + 26, 120, 120);
    if (logo1Img) {
      ctx.drawImage(logo1Img, frontX + 30, cardY + 30, 112, 112);
    }

    // Right Logo (Emblem)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(frontX + cardW - 146, cardY + 26, 120, 120);
    if (logo2Img) {
      ctx.drawImage(logo2Img, frontX + cardW - 142, cardY + 30, 112, 112);
    }

    // Front Header Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(websiteSettings.siteNameEn, frontX + cardW / 2, cardY + 68);

    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 34px "Noto Sans Telugu", Arial, sans-serif';
    ctx.fillText(websiteSettings.siteNameTe, frontX + cardW / 2, cardY + 114);

    ctx.fillStyle = '#FEE2E2';
    ctx.font = 'bold 21px "Noto Sans Telugu", Arial, sans-serif';
    ctx.fillText('వార్తా తరంగిణి • తెలుగు న్యూస్ నెట్‌వర్క్', frontX + cardW / 2, cardY + 150);

    // Black Role Ribbon
    ctx.fillStyle = '#090D16';
    ctx.fillRect(frontX, cardY + 181, cardW, 56);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PRESS IDENTITY CARD', frontX + 34, cardY + 217);

    ctx.fillStyle = active ? '#34D399' : '#F87171';
    ctx.textAlign = 'right';
    ctx.fillText(`● ${badgeStatus}`, frontX + cardW - 34, cardY + 217);

    // Reporter Photo & Name Block
    const photoX = frontX + 40;
    const photoY = cardY + 268;
    const photoW = 210;
    const photoH = 250;

    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    if (photoImg) {
      ctx.drawImage(photoImg, photoX, photoY, photoW, photoH);
    }
    ctx.strokeStyle = '#B91C1C';
    ctx.lineWidth = 5;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // Badge + Role + Name + Reporter ID
    if (logo1Img) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(photoX + photoW + 32, photoY + 12, 42, 42);
      ctx.drawImage(logo1Img, photoX + photoW + 34, photoY + 14, 38, 38);
    }
    ctx.fillStyle = '#B91C1C';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PRESS REPORTER', photoX + photoW + 86, photoY + 42);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 38px "Noto Sans Telugu", Arial, sans-serif';
    ctx.fillText(reporter.fullName.slice(0, 26), photoX + photoW + 32, photoY + 104);

    // ID Pill Box
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(photoX + photoW + 32, photoY + 132, 460, 56);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX + photoW + 32, photoY + 132, 460, 56);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 27px monospace';
    ctx.fillText(cardId, photoX + photoW + 50, photoY + 169);

    // Divider line
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frontX + 40, photoY + photoH + 28);
    ctx.lineTo(frontX + cardW - 40, photoY + photoH + 28);
    ctx.stroke();

    // Details Rows
    const rows: [string, string, string?][] = [
      ['State (రాష్ట్రం):', reporter.stateName],
      ['District (జిల్లా):', reporter.districtName],
      ['Mandal (మండలం):', reporter.mandalName],
      ['Mobile (మొబైల్):', reporter.mobile],
      ['Date of Issue:', reporter.approvedAt || 'Pending Approval'],
      [
        'Expiry Date (6 Months):',
        reporter.expiresAt || 'Pending Approval',
        active ? '#047857' : '#B91C1C',
      ],
    ];

    let rowY = photoY + photoH + 80;
    rows.forEach(([label, val, customColor]) => {
      ctx.fillStyle = '#64748B';
      ctx.font = '600 26px "Noto Sans Telugu", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, frontX + 40, rowY);

      ctx.fillStyle = customColor || '#0F172A';
      ctx.font = 'bold 27px "Noto Sans Telugu", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, frontX + cardW - 40, rowY);

      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(frontX + 40, rowY + 18);
      ctx.lineTo(frontX + cardW - 40, rowY + 18);
      ctx.stroke();

      rowY += 64;
    });

    // Bottom QR Code & Authorized Signature
    const qrMatrix = computeQrMatrix(verificationUrl);
    const qrX = frontX + 44;
    const qrY = cardY + cardH - 220;
    const qrCell = 7;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - 8, qrY - 8, 21 * qrCell + 16, 21 * qrCell + 16);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - 8, qrY - 8, 21 * qrCell + 16, 21 * qrCell + 16);

    ctx.fillStyle = '#090D16';
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        if (qrMatrix[r][c]) {
          ctx.fillRect(qrX + c * qrCell, qrY + r * qrCell, qrCell, qrCell);
        }
      }
    }
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO VERIFY', qrX + (21 * qrCell) / 2, qrY + 21 * qrCell + 28);

    // Signature & Seal on Right
    if (logo2Img) {
      ctx.drawImage(logo2Img, frontX + cardW - 360, qrY + 4, 68, 68);
    }
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('✓ DIGITALLY VERIFIED', frontX + cardW - 40, qrY + 44);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'italic bold 32px Georgia, serif';
    ctx.fillText('Neti Bharatham Desk', frontX + cardW - 40, qrY + 94);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('Authorized Issuing Authority', frontX + cardW - 40, qrY + 130);

    ctx.fillStyle = '#64748B';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('Hyderabad, Telangana', frontX + cardW - 40, qrY + 162);

    // Outer Border Front Card
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5;
    ctx.strokeRect(frontX, cardY, cardW, cardH);

    // =========================================================================
    // 2. BACK CARD
    // =========================================================================
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(backX, cardY, cardW, cardH);

    // Back Dark Header
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(backX, cardY, cardW, 165);
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(backX, cardY + 165, cardW, 8);

    if (logo1Img) {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(backX + 26, cardY + 26, 110, 110);
      ctx.drawImage(logo1Img, backX + 30, cardY + 30, 102, 102);
    }
    if (logo2Img) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(backX + cardW - 136, cardY + 26, 110, 110);
      ctx.drawImage(logo2Img, backX + cardW - 132, cardY + 30, 102, 102);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL PRESS CREDENTIAL • BACK SIDE', backX + cardW / 2, cardY + 76);

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 28px "Noto Sans Telugu", Arial, sans-serif';
    ctx.fillText(
      `${websiteSettings.siteNameEn} (${websiteSettings.siteNameTe})`,
      backX + cardW / 2,
      cardY + 124
    );

    // Issuing Organization Box
    const boxX = backX + 44;
    const boxY = cardY + 215;
    const boxW = cardW - 88;
    const boxH = 290;
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ISSUING ORGANIZATION DETAILS', boxX + 28, boxY + 48);

    ctx.font = '600 24px Arial, sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(`Website: ${websiteSettings.domain}`, boxX + 28, boxY + 102);
    ctx.fillText(`Official Email: ${websiteSettings.contactEmail}`, boxX + 28, boxY + 150);
    ctx.fillText(`Location: ${websiteSettings.location}`, boxX + 28, boxY + 198);
    ctx.fillText(
      `Emergency Contact: ${websiteSettings.emergencyContact.slice(0, 48)}`,
      boxX + 28,
      boxY + 246
    );

    // Terms & Conditions on Back
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 26px "Noto Sans Telugu", Arial, sans-serif';
    ctx.fillText('TERMS & CONDITIONS / నిబంధనలు', boxX, boxY + boxH + 64);

    const termsLines = [
      `1. Accredited Press Reporter for NETI BHARATHAM (${websiteSettings.siteNameTe})`,
      `   in ${reporter.mandalName}, ${reporter.districtName}, ${reporter.stateName}.`,
      `2. Validity: Strictly valid for 6 calendar months from Date of Issue`,
      `   (${reporter.approvedAt || 'N/A'} to ${reporter.expiresAt || 'N/A'}).`,
      `3. Online QR Verification: Public authorities and citizens can verify`,
      `   live card validity via QR scan at ${websiteSettings.domain}.`,
      `4. Private Aadhaar and residential data are strictly protected and`,
      `   never exposed publicly.`,
      `5. If found, please return to NETI BHARATHAM Headquarters,`,
      `   Hyderabad, Telangana (${websiteSettings.contactEmail}).`,
    ];

    ctx.fillStyle = '#334155';
    ctx.font = '23px "Noto Sans Telugu", Arial, sans-serif';
    let termY = boxY + boxH + 114;
    termsLines.forEach((line) => {
      ctx.fillText(line, boxX, termY);
      termY += 42;
    });

    // Back Footer Bar
    ctx.fillStyle = '#090D16';
    ctx.fillRect(backX, cardY + cardH - 84, cardW, 84);
    ctx.fillStyle = active ? '#34D399' : '#FBBF24';
    ctx.font = 'bold 25px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      active
        ? `STATUS: ACTIVE • VALID UNTIL ${reporter.expiresAt}`
        : `STATUS: ${reporter.status} • REQUIRES ADMIN RENEWAL`,
      backX + cardW / 2,
      cardY + cardH - 34
    );

    // Outer Border Back Card
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5;
    ctx.strokeRect(backX, cardY, cardW, cardH);

    return canvas;
  };

  const handleDownloadFormat = async (format: 'pdf' | 'jpg' | 'png') => {
    setDownloadingFormat(format);
    try {
      const canvas = await renderHighResIdCardCanvas();

      if (format === 'png') {
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${cardId}-NETI-BHARATHAM-PRESS-ID.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (format === 'jpg') {
        const jpgUrl = canvas.toDataURL('image/jpeg', 0.96);
        const a = document.createElement('a');
        a.href = jpgUrl;
        a.download = `${cardId}-NETI-BHARATHAM-PRESS-ID.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (format === 'pdf') {
        const jpgUrl = canvas.toDataURL('image/jpeg', 0.96);
        const pdfBlob = buildPdfFromJpegDataUrl(jpgUrl, canvas.width, canvas.height);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `${cardId}-NETI-BHARATHAM-PRESS-ID.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pdfUrl);
      }
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Official Press Reporter Identity Card (ప్రెస్ రిపోర్టర్ గుర్తింపు కార్డు)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Download in PDF, JPG, or PNG format with official logos, 6-month validity &amp; QR verification
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reporter.reporterId && onOpenPublicVerify && (
            <button
              type="button"
              onClick={() => onOpenPublicVerify(reporter.reporterId!)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-red-700" />
              <span>Verify QR</span>
            </button>
          )}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownloadFormat('pdf')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF (.pdf)'}</span>
          </button>
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownloadFormat('jpg')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 disabled:opacity-60 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingFormat === 'jpg' ? 'Generating JPG...' : 'Download JPG (.jpg)'}</span>
          </button>
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownloadFormat('png')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingFormat === 'png' ? 'Generating PNG...' : 'Download PNG (.png)'}</span>
          </button>
        </div>
      </div>

      {/* FRONT & BACK PRESS ID CARDS */}
      <div
        ref={cardContainerRef}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-4xl mx-auto"
      >
        {/* FRONT SIDE OF ID CARD */}
        <div className="w-full max-w-sm mx-auto bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-md">
          {/* Header Banner with Official Logos */}
          <div className="bg-red-700 text-white px-3.5 py-3 text-center border-b-4 border-slate-900">
            <div className="flex items-center justify-between gap-2">
              <img
                src={primaryLogo}
                alt="NETI BHARATHAM Official Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-lg bg-slate-950 p-0.5 object-contain border border-white/40 shrink-0 shadow-xs"
              />
              <div className="text-center flex-1 min-w-0">
                <div className="text-sm sm:text-base font-black tracking-wide leading-tight truncate">
                  {websiteSettings.siteNameEn}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-200 mt-0.5 leading-tight">
                  {websiteSettings.siteNameTe}
                </div>
                <div className="text-[10px] font-bold text-red-100 mt-0.5">
                  వార్తా తరంగిణి • తెలుగు న్యూస్ నెట్‌వర్క్
                </div>
              </div>
              <img
                src={secondaryLogo}
                alt="Official Emblem Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full bg-white p-0.5 object-contain border border-amber-300 shrink-0 shadow-xs"
              />
            </div>
          </div>

          {/* Press Ribbon */}
          <div className="bg-slate-950 text-white py-1.5 px-4 flex items-center justify-between text-xs font-extrabold tracking-widest">
            <span>PRESS IDENTITY CARD</span>
            <span className={active ? 'text-emerald-400' : 'text-red-400'}>
              ● {badgeStatus}
            </span>
          </div>

          {/* Photo & Primary Identity */}
          <div className="p-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="w-24 h-28 rounded-lg border-2 border-red-700 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                <img
                  src={reporter.photoUrl || primaryLogo}
                  alt={reporter.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="inline-flex items-center gap-1.5">
                  <img
                    src={primaryLogo}
                    alt="Badge"
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded object-contain bg-slate-950 p-0.5"
                  />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-red-700">
                    PRESS REPORTER
                  </span>
                </div>
                <div className="text-base font-extrabold text-slate-900 leading-snug break-words">
                  {reporter.fullName}
                </div>
                <div className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block tabular-nums">
                  {cardId}
                </div>
              </div>
            </div>

            {/* Hierarchical Location & Validity Details */}
            <dl className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">State (రాష్ట్రం):</dt>
                <dd className="text-slate-900 font-bold text-right">{reporter.stateName}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">District (జిల్లా):</dt>
                <dd className="text-slate-900 font-bold text-right">{reporter.districtName}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Mandal (మండలం):</dt>
                <dd className="text-slate-900 font-bold text-right">{reporter.mandalName}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Mobile (మొబైల్):</dt>
                <dd className="text-slate-900 font-mono font-bold tabular-nums">{reporter.mobile}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Date of Issue:</dt>
                <dd className="text-slate-900 font-mono font-semibold tabular-nums">
                  {reporter.approvedAt || 'Pending Approval'}
                </dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500 font-medium">Expiry Date (6 Months):</dt>
                <dd
                  className={`font-mono font-bold tabular-nums ${
                    active ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {reporter.expiresAt || 'Pending Approval'}
                </dd>
              </div>
            </dl>

            {/* Bottom QR & Authorized Signature Row */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="flex flex-col items-center">
                <DeterministicQrSvg value={verificationUrl} size={78} />
                <span className="text-[10px] font-mono text-slate-500 mt-1">SCAN TO VERIFY</span>
              </div>

              <div className="text-right space-y-1 flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                  <img
                    src={secondaryLogo}
                    alt="Official Seal"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-contain border border-amber-400 bg-white"
                  />
                  <div className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>DIGITALLY VERIFIED</span>
                  </div>
                </div>
                <div className="font-serif italic text-sm font-bold text-slate-900">
                  Neti Bharatham Desk
                </div>
                <div className="text-[11px] font-semibold text-slate-600">
                  Authorized Issuing Authority
                </div>
                <div className="text-[10px] text-slate-500">Hyderabad, Telangana</div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE OF ID CARD */}
        <div className="w-full max-w-sm mx-auto bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-md flex flex-col justify-between">
          <div>
            <div className="bg-slate-900 text-white px-3.5 py-3 text-center border-b-4 border-red-700 flex items-center justify-between gap-2">
              <img
                src={primaryLogo}
                alt="NETI BHARATHAM Logo"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg bg-slate-950 p-0.5 object-contain border border-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold tracking-wider">
                  OFFICIAL PRESS CREDENTIAL • BACK SIDE
                </div>
                <div className="text-[11px] text-amber-300 font-bold mt-0.5 truncate">
                  {websiteSettings.siteNameEn} ({websiteSettings.siteNameTe})
                </div>
              </div>
              <img
                src={secondaryLogo}
                alt="Emblem Logo"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full bg-white p-0.5 object-contain border border-amber-300 shrink-0"
              />
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Issuing Organization Details
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Website: </span>
                  <span className="font-mono">{websiteSettings.domain.replace(/^https?:\/\//, '')}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Official Email: </span>
                  <span className="font-mono">{websiteSettings.contactEmail}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Location: </span>
                  <span>{websiteSettings.location}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Emergency Contact: </span>
                  <span>{websiteSettings.emergencyContact}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Terms &amp; Conditions / నిబంధనలు
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    This card certifies that <strong>{reporter.fullName}</strong> is an accredited Press Reporter for <strong>NETI BHARATHAM (నేటి భారతం)</strong> in {reporter.mandalName}, {reporter.districtName}.
                  </li>
                  <li>
                    <strong>Validity:</strong> Strictly valid for 6 calendar months from Date of Issue ({reporter.approvedAt || 'N/A'} to {reporter.expiresAt || 'N/A'}).
                  </li>
                  <li>
                    <strong>Online QR Verification:</strong> Public authorities and citizens can verify live card validity via QR scan. Private Aadhaar and residential data are strictly protected and never exposed publicly.
                  </li>
                  <li>
                    If found, please return to NETI BHARATHAM Headquarters, Hyderabad, Telangana ({websiteSettings.contactEmail}).
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 text-white px-4 py-3 text-center text-[11px]">
            <div className="flex items-center justify-center gap-1.5 font-bold">
              {active ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>STATUS: ACTIVE • VALID UNTIL {reporter.expiresAt}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>STATUS: {reporter.status} • REQUIRES ADMIN RENEWAL</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
