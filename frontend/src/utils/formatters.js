import { jsPDF } from 'jspdf';

export function parseCsvToHtml(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return '';

  // Skip header row
  const rows = lines.slice(1);
  const html = rows.map((line) => {
    const fields = parseCsvLine(line);
    if (fields.length < 4) return '';

    const [title, source, summary, url] = fields;
    return `<h3>${escapeHtml(title)}</h3>\n\n<p>${escapeHtml(summary)}</p>\n\n<p><a href="${escapeHtml(url)}" target="_blank" style="color: #f59e0b; text-decoration: underline;">Read more</a></p>`;
  }).join('\n\n');

  return html;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

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

    // Convert CSV to markdown format
    if (msg.role === 'assistant' && msg.content.includes('Title,Source,Summary,URL')) {
      const csvLines = msg.content.trim().split('\n');
      csvLines.slice(1).forEach((line) => {
        const fields = parseCsvLine(line);
        if (fields.length >= 4) {
          const [title, source, summary, url] = fields;
          lines.push(`\n### ${title}\n`);
          lines.push(`${summary}\n`);
          lines.push(`[Read more](${url})\n`);
        }
      });
    } else {
      lines.push(`${msg.content}\n`);
    }
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

    let content = msg.content;

    // Convert CSV to formatted text
    if (msg.role === 'assistant' && msg.content.includes('Title,Source,Summary,URL')) {
      const csvLines = msg.content.trim().split('\n');
      const articles = csvLines.slice(1).map((line) => {
        const fields = parseCsvLine(line);
        return fields.length >= 4 ? fields : null;
      }).filter(Boolean);

      articles.forEach(([title, source, summary, url], idx) => {
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        const titleLines = doc.splitTextToSize(title, maxWidth);
        titleLines.forEach((line) => {
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        doc.setFont(undefined, 'normal');
        doc.setFontSize(fontSize);
        const summaryLines = doc.splitTextToSize(summary, maxWidth);
        summaryLines.forEach((line) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        doc.setTextColor(100, 150, 200);
        doc.textWithLink(`Read more`, margin, yPosition, { pageNumber: 0, url });
        doc.setTextColor(0, 0, 0);
        yPosition += lineHeight + 3;
      });
    } else {
      // Regular message
      const lines = doc.splitTextToSize(msg.content, maxWidth);
      lines.forEach((line) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    }

    yPosition += 3;
  });

  return doc;
}

export function formatChatAsCsv(messages) {
  const rows = [];

  messages.forEach((msg) => {
    if (msg.role === 'assistant' && msg.content.includes('Title,Source,Summary,URL')) {
      // Raw CSV from web_search - include as-is
      rows.push(msg.content);
    } else if (msg.role === 'assistant' && msg.content.includes('<h3>')) {
      // Parse HTML articles (legacy format)
      const articleRegex = /<h3>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>\s*<p><a href="([^"]+)"/g;
      let match;
      const csvRows = ['Title,Source,Summary,URL'];
      while ((match = articleRegex.exec(msg.content)) !== null) {
        const title = match[1];
        const summary = match[2];
        const url = match[3];
        csvRows.push(
          `${escapeField(title)},AI News,${escapeField(summary)},${escapeField(url)}`
        );
      }
      rows.push(csvRows.join('\n'));
    }
  });

  return rows.join('\n\n');
}

function escapeField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
