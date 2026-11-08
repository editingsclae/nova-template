import React from 'react';

const SAFE_SCHEMES = /^(https?:\/\/|mailto:|tel:)/i;

function renderInlinePiece(piece, i) {
  if (!piece) return null;
  if (piece.type === 'break') {
    return <br key={i} />;
  }

  if (piece.type === 'text') {
    let el = piece.text;
    if (piece.bold) el = <strong>{el}</strong>;
    if (piece.italic) el = <em>{el}</em>;
    return <React.Fragment key={i}>{el}</React.Fragment>;
  }

  if (piece.type === 'link') {
    const href = String(piece.href || '').trim();
    const isSafe = SAFE_SCHEMES.test(href);
    const children = Array.isArray(piece.children)
      ? piece.children.map(renderInlinePiece)
      : href;

    if (!isSafe) {
      return <React.Fragment key={i}>{children}</React.Fragment>;
    }

    const isExternal = /^https?:\/\//i.test(href);
    return (
      <a
        key={i}
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  }

  return null;
}

function renderContent(content) {
  if (!content) return null;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(renderInlinePiece);
  return null;
}

function ListBlock({ list, depth = 0 }) {
  if (!list || !Array.isArray(list.items) || depth > 4) return null;
  const Tag = list.ordered ? 'ol' : 'ul';

  return (
    <Tag>
      {list.items.map((item, i) => (
        <li key={i}>
          {renderContent(item.content)}
          {item.children && Array.isArray(item.children)
            ? item.children.map((sub, j) => (
                <ListBlock key={j} list={sub} depth={depth + 1} />
              ))
            : null}
        </li>
      ))}
    </Tag>
  );
}

export default function RichBlocks({ blocks, text, pageTitle }) {
  if (Array.isArray(blocks) && blocks.length > 0) {
    let skippedFirstTitle = false;

    return (
      <>
        {blocks.map((b, i) => {
          if (!b || !b.type) return null;

          if (b.type === 'heading') {
            const headingText = (Array.isArray(b.content) ? b.content.map(c => c.text || '').join('') : '').trim();
            // Skip first heading if it repeats the page title
            if (!skippedFirstTitle && i === 0 && pageTitle && headingText.toLowerCase() === pageTitle.trim().toLowerCase()) {
              skippedFirstTitle = true;
              return null;
            }

            const level = b.level || 1;
            const content = renderContent(b.content);
            if (level === 1) return <h2 key={i} className="doc__sec">{content}</h2>;
            if (level === 2) return <h3 key={i} className="doc__sec">{content}</h3>;
            return <h4 key={i} className="doc__sec">{content}</h4>;
          }

          if (b.type === 'paragraph') {
            return <p key={i}>{renderContent(b.content)}</p>;
          }

          if (b.type === 'list') {
            return <ListBlock key={i} list={b} depth={0} />;
          }

          if (b.type === 'rule') {
            return <hr key={i} />;
          }

          return null;
        })}
      </>
    );
  }

  // Fallback to text: blank line starts a paragraph, single line break stays a line break
  if (text) {
    const paragraphs = String(text).split(/\n\s*\n/);
    return (
      <>
        {paragraphs.map((p, i) => {
          const lines = p.split('\n');
          return (
            <p key={i}>
              {lines.map((l, j) => (
                <React.Fragment key={j}>
                  {l}
                  {j < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        })}
      </>
    );
  }

  return null;
}
