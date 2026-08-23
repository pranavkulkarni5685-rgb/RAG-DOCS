import React from 'react';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  const renderFormattedText = (text) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let language = '';
        let code = lines.join('\n');
        if (lines.length > 0 && !lines[0].includes(' ') && lines[0].length < 20) {
          language = lines[0];
          code = lines.slice(1).join('\n');
        }
        return (
          <div key={index} style={{ margin: '0.75rem 0', position: 'relative' }}>
            {language && (
              <div style={{
                background: '#1e293b',
                color: '#94a3b8',
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                fontFamily: 'var(--font-mono)'
              }}>
                {language}
              </div>
            )}
            <pre style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '1rem',
              borderRadius: language ? '0 0 6px 6px' : '6px',
              overflowX: 'auto',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)'
            }}>
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const paragraphs = part.split(/\n\n+/);
      return (
        <div key={index}>
          {paragraphs.map((p, pIdx) => {
            const trimmed = p.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const items = trimmed.split(/\n[•\-*]\s*/);
              return (
                <ul key={pIdx} style={{ marginLeft: '1.25rem', marginBottom: '0.75rem' }}>
                  {items.map((it, iIdx) => {
                    const cleanItem = it.replace(/^[•\-*]\s*/, '');
                    return <li key={iIdx} style={{ marginBottom: '0.25rem' }}>{formatInline(cleanItem)}</li>;
                  })}
                </ul>
              );
            }

            if (/^\d+\.\s+/.test(trimmed)) {
              const items = trimmed.split(/\n\d+\.\s+/);
              return (
                <ol key={pIdx} style={{ marginLeft: '1.25rem', marginBottom: '0.75rem' }}>
                  {items.map((it, iIdx) => {
                    const cleanItem = it.replace(/^\d+\.\s+/, '');
                    return <li key={iIdx} style={{ marginBottom: '0.25rem' }}>{formatInline(cleanItem)}</li>;
                  })}
                </ol>
              );
            }

            return (
              <p key={pIdx} style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}>
                {formatInline(trimmed)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const formatInline = (inlineText) => {
    // Bold **text**
    const parts = inlineText.split(/(\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return <div className="markdown-content">{renderFormattedText(content)}</div>;
}
