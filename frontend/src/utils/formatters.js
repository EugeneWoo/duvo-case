import { jsPDF } from 'jspdf';

export function formatChatAsMarkdown(messages) {
  const lines = [
    '# Chat Session\n',
    `Generated: ${new Date().toLocaleString()}\n`,
    '---\n'
  ];

  messages.forEach((msg, idx) => {
    const role = msg.role === 'user' ? '**You**' : '**Agent**';
    const time = msg.timestamp.toLocaleTimeString();

    lines.push(`\n${role} *(${time})*\n`);
    lines.push(`${msg.content}\n`);
  });

  return lines.join('');
}

export function formatChatAsPdf(messages) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  const lineHeight = 5;
  const fontSize = 10;

  // Header
  doc.setFontSize(16);
  doc.text('Chat Session', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  doc.setFontSize(fontSize);
  doc.setTextColor(0, 0, 0);

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'You' : 'Agent';
    const time = msg.timestamp.toLocaleTimeString();
    const header = `${role} (${time})`;

    // Add header
    doc.setFont(undefined, 'bold');
    doc.text(header, margin, yPosition);
    yPosition += lineHeight;
    doc.setFont(undefined, 'normal');

    // Add message text with wrapping
    const lines = doc.splitTextToSize(msg.content, maxWidth);
    lines.forEach((line) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });

    yPosition += 3;
  });

  return doc;
}

export function formatChatAsCsv(messages) {
  const escapeField = (field) => {
    if (field === null || field === undefined) return '';
    const str = String(field).trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = ['Title,Source,Summary,URL'];

  messages.forEach((msg) => {
    if (msg.role === 'assistant' && msg.content.includes('<h3>')) {
      // Parse HTML articles
      const articleRegex = /<h3>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>\s*<p><a href="([^"]+)"/g;
      let match;
      while ((match = articleRegex.exec(msg.content)) !== null) {
        const title = match[1];
        const summary = match[2];
        const url = match[3];
        rows.push(
          `${escapeField(title)},AI News,${escapeField(summary)},${escapeField(url)}`
        );
      }
    } else if (msg.role === 'user') {
      rows.push(`${escapeField(msg.content)},User,${escapeField(msg.content)},`);
    } else {
      rows.push(`Response,Agent,${escapeField(msg.content)},`);
    }
  });

  return rows.join('\n');
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
