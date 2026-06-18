import React from 'react';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function parseInline(text: string): string {
  let escaped = escapeHtml(text);
  
  // 1. Negrita: **texto**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 2. Código en línea: `código`
  escaped = escaped.replace(/`(.*?)`/g, '<code class="bg-gray-100 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono font-medium">$1</code>');
  
  // 3. Enlaces: [texto](url)
  escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline">$1</a>');
  
  return escaped;
}

const techsSorted = [
  'JavaScript', 'TypeScript', 'Node.js', 'Next.js',
  'Kubernetes', 'Flutter', 'Angular', 'React', 'Python',
  'Docker', 'Kotlin', 'Swift', 'Node', 'Java', 'Ruby',
  'HTML', 'CSS', 'AWS', 'PHP', 'C#', 'Go'
];

const techPatterns = techsSorted.map(t => {
  const escaped = t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  if (t === 'C#') {
    return '\\bC#';
  }
  if (t === 'Go') {
    return '\\bGo\\b';
  }
  return `\\b${escaped}\\b`;
});

const techRegex = new RegExp(`(${techPatterns.join('|')})`, 'g');

const techSlugMap: Record<string, string> = {
  'javascript': 'javascript',
  'typescript': 'typescript',
  'node.js': 'node',
  'next.js': 'nextjs',
  'kubernetes': 'kubernetes',
  'flutter': 'flutter',
  'angular': 'angular',
  'react': 'react',
  'python': 'python',
  'docker': 'docker',
  'kotlin': 'kotlin',
  'swift': 'swift',
  'node': 'node',
  'java': 'java',
  'ruby': 'ruby',
  'html': 'informatica-tecnologia',
  'css': 'informatica-tecnologia',
  'aws': 'aws',
  'php': 'php',
  'c#': 'csharp',
  'go': 'go'
};

export function autoLinkHtml(html: string, isEnglish: boolean): string {
  const tokens = html.split(/(<\/?[a-zA-Z0-9]+(?:\s+[^>]*)?>)/);
  let inLink = false;
  let inCode = false;
  
  const queryParam = isEnglish ? '?lang=en' : '';

  const processed = tokens.map(token => {
    if (token.startsWith('<') && token.endsWith('>')) {
      const lowerTag = token.toLowerCase();
      if (lowerTag.startsWith('<a') || lowerTag.startsWith('<link')) {
        inLink = true;
      } else if (lowerTag.startsWith('</a')) {
        inLink = false;
      } else if (lowerTag.startsWith('<code') || lowerTag.startsWith('<pre')) {
        inCode = true;
      } else if (lowerTag.startsWith('</code') || lowerTag.startsWith('</pre')) {
        inCode = false;
      }
      return token;
    }
    
    if (inLink || inCode) {
      return token;
    }
    
    return token.replace(techRegex, (matched) => {
      const slug = techSlugMap[matched.toLowerCase()];
      if (slug) {
        return `<a href="/trabajos/${slug}${queryParam}" class="text-indigo-650 hover:text-indigo-850 font-bold hover:underline">${matched}</a>`;
      }
      return matched;
    });
  });

  return processed.join('');
}

export function Markdown({ content, isEnglish = false, autoLink = false }: { content: string; isEnglish?: boolean; autoLink?: boolean }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  
  let currentBlockType: 'p' | 'ul' | 'ol' | 'table' | 'blockquote' | null = null;
  let currentLines: string[] = [];

  const flushBlock = (key: string | number) => {
    if (currentLines.length === 0) return;
    
    if (currentBlockType === 'p') {
      const textContent = currentLines.join('\n').trim();
      if (textContent) {
        let htmlContent = parseInline(textContent);
        if (autoLink) {
          htmlContent = autoLinkHtml(htmlContent, isEnglish);
        }
        blocks.push(
          <p
            key={key}
            className="mb-4 text-gray-700 leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );
      }
    } else if (currentBlockType === 'ul') {
      blocks.push(
        <ul key={key} className="list-disc pl-6 mb-6 space-y-2 text-gray-700 text-lg">
          {currentLines.map((line, idx) => {
            const cleanLine = line.replace(/^[\*\-]\s+/, '');
            let htmlContent = parseInline(cleanLine);
            if (autoLink) {
              htmlContent = autoLinkHtml(htmlContent, isEnglish);
            }
            return (
              <li
                key={idx}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            );
          })}
        </ul>
      );
    } else if (currentBlockType === 'ol') {
      blocks.push(
        <ol key={key} className="list-decimal pl-6 mb-6 space-y-2 text-gray-700 text-lg">
          {currentLines.map((line, idx) => {
            const cleanLine = line.replace(/^\d+\.\s+/, '');
            let htmlContent = parseInline(cleanLine);
            if (autoLink) {
              htmlContent = autoLinkHtml(htmlContent, isEnglish);
            }
            return (
              <li
                key={idx}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            );
          })}
        </ol>
      );
    } else if (currentBlockType === 'table') {
      const tableRows = currentLines.map(line => {
        const parts = line.split('|');
        if (parts[0].trim() === '') parts.shift();
        if (parts[parts.length - 1]?.trim() === '') parts.pop();
        return parts.map(p => p.trim());
      }).filter(row => {
        return !row.every(cell => cell.match(/^[\s\-\:]+$/));
      });

      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const bodyRows = tableRows.slice(1);
        blocks.push(
          <div key={key} className="overflow-x-auto my-8 rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-6 py-3.5 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200"
                      dangerouslySetInnerHTML={{ __html: parseInline(header) }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
                        dangerouslySetInnerHTML={{ __html: parseInline(cell) }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    } else if (currentBlockType === 'blockquote') {
      const joined = currentLines.join('\n').trim();
      const firstLine = currentLines[0] || '';
      const alertMatch = firstLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      
      if (alertMatch) {
        const type = alertMatch[1].toUpperCase();
        const remainingContent = currentLines.slice(1).join('\n').trim();
        
        let bgColor = 'bg-blue-50 border-blue-200 text-blue-900';
        let icon = 'ℹ️';
        let label = 'Nota';
        
        if (type === 'TIP') {
          bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-950';
          icon = '💡';
          label = 'Consejo';
        } else if (type === 'IMPORTANT') {
          bgColor = 'bg-indigo-50 border-indigo-200 text-indigo-950';
          icon = '✨';
          label = 'Importante';
        } else if (type === 'WARNING') {
          bgColor = 'bg-amber-50 border-amber-200 text-amber-950';
          icon = '⚠️';
          label = 'Advertencia';
        } else if (type === 'CAUTION') {
          bgColor = 'bg-rose-50 border-rose-200 text-rose-950';
          icon = '🚨';
          label = 'Precaución';
        }

        blocks.push(
          <div key={key} className={`p-5 rounded-2xl border ${bgColor} shadow-sm my-6 flex items-start gap-4`}>
            <span className="text-2xl shrink-0">{icon}</span>
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider mb-1">{label}</h4>
              <p className="text-sm leading-relaxed m-0 animate-fade-in" dangerouslySetInnerHTML={{ __html: parseInline(remainingContent) }} />
            </div>
          </div>
        );
      } else {
        blocks.push(
          <blockquote key={key} className="pl-4 border-l-4 border-indigo-500 italic text-gray-600 my-4 py-1 text-lg">
            <p dangerouslySetInnerHTML={{ __html: parseInline(joined) }} />
          </blockquote>
        );
      }
    }
    
    currentLines = [];
    currentBlockType = null;
  };

  let blockIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      flushBlock(blockIdx++);
      continue;
    }

    if (trimmed.startsWith('#')) {
      flushBlock(blockIdx++);
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const text = trimmed.replace(/^#+\s+/, '');
      const cleanText = parseInline(text);
      
      if (level === 1) {
        blocks.push(<h1 key={blockIdx++} className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-8 mb-4 leading-tight" dangerouslySetInnerHTML={{ __html: cleanText }} />);
      } else if (level === 2) {
        const cleanTextStr = text.replace(/<[^>]*>?/gm, '');
        const headingId = cleanTextStr
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');

        blocks.push(
          <h2 
            key={blockIdx++} 
            id={headingId} 
            className="text-2xl font-bold text-gray-900 mt-8 mb-4 leading-tight scroll-mt-20" 
            dangerouslySetInnerHTML={{ __html: cleanText }} 
          />
        );
      } else {
        blocks.push(<h3 key={blockIdx++} className="text-xl font-bold text-gray-900 mt-6 mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: cleanText }} />);
      }
      continue;
    }

    if (trimmed.startsWith('>')) {
      if (currentBlockType !== 'blockquote') {
        flushBlock(blockIdx++);
        currentBlockType = 'blockquote';
      }
      const cleanLine = line.replace(/^\s*>\s?/, '');
      currentLines.push(cleanLine);
      continue;
    }

    if (trimmed.startsWith('|')) {
      if (currentBlockType !== 'table') {
        flushBlock(blockIdx++);
        currentBlockType = 'table';
      }
      currentLines.push(line);
      continue;
    }

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (currentBlockType !== 'ul') {
        flushBlock(blockIdx++);
        currentBlockType = 'ul';
      }
      currentLines.push(trimmed);
      continue;
    }

    if (trimmed.match(/^\d+\.\s+/)) {
      if (currentBlockType !== 'ol') {
        flushBlock(blockIdx++);
        currentBlockType = 'ol';
      }
      currentLines.push(trimmed);
      continue;
    }

    if (currentBlockType !== 'p') {
      flushBlock(blockIdx++);
      currentBlockType = 'p';
    }
    currentLines.push(line);
  }

  flushBlock(blockIdx++);

  return <div className="markdown-content">{blocks}</div>;
}
