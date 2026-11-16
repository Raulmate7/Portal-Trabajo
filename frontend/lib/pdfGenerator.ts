/**
 * Generador multipágina PDF 1.4 con soporte WinAnsi (acentos españoles) sin dependencias externas (FUNC-047).
 */
function encodeWinAnsiPdfText(text: string): string {
  const safe = text
    .replace(/€/g, 'EUR')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  let out = '';
  for (let i = 0; i < safe.length; i++) {
    const code = safe.charCodeAt(i);
    if (code >= 0x20 && code <= 0x7e) {
      out += safe[i];
    } else if (code >= 0xa0 && code <= 0xff) {
      out += '\\' + code.toString(8).padStart(3, '0');
    } else {
      out += ' ';
    }
  }
  return out;
}

function wrapLines(lines: string[], maxChars: number = 88): string[] {
  const wrapped: string[] = [];
  for (const raw of lines) {
    if (!raw || raw.length <= maxChars) {
      wrapped.push(raw);
      continue;
    }
    let remaining = raw;
    while (remaining.length > maxChars) {
      let cut = remaining.lastIndexOf(' ', maxChars);
      if (cut <= 0) cut = maxChars;
      wrapped.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut).trimStart();
    }
    if (remaining) wrapped.push(remaining);
  }
  return wrapped;
}

export function buildSimplePdfBuffer(title: string, lines: string[]): Buffer {
  const allLines = wrapLines([title, '', ...lines]);
  const linesPerPage = 44;
  const pageChunks: string[][] = [];
  for (let i = 0; i < allLines.length; i += linesPerPage) {
    pageChunks.push(allLines.slice(i, i + linesPerPage));
  }
  if (pageChunks.length === 0) pageChunks.push(['']);

  const fontObjId = 3 + pageChunks.length * 2;
  const pageIds: number[] = [];
  const objects: string[] = [];

  // Placeholders for Catalog (1) and Pages (2)
  objects.push('');
  objects.push('');

  for (let p = 0; p < pageChunks.length; p++) {
    const pageObjId = 3 + p * 2;
    const contentObjId = pageObjId + 1;
    pageIds.push(pageObjId);

    const chunk = pageChunks[p];
    const ops: string[] = ['BT'];
    if (p === 0) {
      ops.push('/F1 13 Tf', '48 790 Td', `(${encodeWinAnsiPdfText(chunk[0] || '')}) Tj`, '/F1 10 Tf');
      for (let i = 1; i < chunk.length; i++) {
        ops.push('0 -16 Td', `(${encodeWinAnsiPdfText(chunk[i])}) Tj`);
      }
    } else {
      ops.push('/F1 10 Tf', '48 790 Td', `(${encodeWinAnsiPdfText(chunk[0] || '')}) Tj`);
      for (let i = 1; i < chunk.length; i++) {
        ops.push('0 -16 Td', `(${encodeWinAnsiPdfText(chunk[i])}) Tj`);
      }
    }
    ops.push('ET');
    const stream = ops.join('\n');

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>\nendobj\n`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream\nendobj\n`
    );
  }

  objects[0] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>\nendobj\n`;
  objects.push(
    `${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`
  );

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}
