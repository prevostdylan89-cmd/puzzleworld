import React from 'react';
import { ExternalLink, Link } from 'lucide-react';

function renderText(text = '') {
  // Convert **bold** and *italic* to HTML spans
  let result = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}

function HeadingRenderer({ block }) {
  const className = block.level === 'h2'
    ? "text-2xl lg:text-3xl font-bold text-white mt-10 mb-4"
    : "text-xl lg:text-2xl font-bold text-white mt-8 mb-3";
  if (block.level === 'h3') return <h3 className={className}>{block.text}</h3>;
  return <h2 className={className}>{block.text}</h2>;
}

function ParagraphRenderer({ block }) {
  return (
    <p className="text-white/80 text-base lg:text-lg leading-relaxed mb-0">
      {renderText(block.text)}
    </p>
  );
}

function ImageRenderer({ block }) {
  if (!block.url) return null;
  return (
    <figure className="my-2">
      <img src={block.url} alt={block.alt || ''} className="w-full rounded-xl object-cover max-h-96" />
      {block.caption && (
        <figcaption className="text-center text-white/40 text-sm mt-2 italic">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function ListRenderer({ block }) {
  const items = block.items?.filter(i => i.trim()) || [];
  if (items.length === 0) return null;
  const cls = "text-white/80 text-base lg:text-lg leading-relaxed space-y-2";
  if (block.style === 'ordered') {
    return (
      <ol className={`list-decimal list-inside ${cls}`}>
        {items.map((item, i) => <li key={i}>{renderText(item)}</li>)}
      </ol>
    );
  }
  return (
    <ul className={`list-disc list-inside ${cls}`}>
      {items.map((item, i) => <li key={i}>{renderText(item)}</li>)}
    </ul>
  );
}

function LinkRenderer({ block }) {
  if (!block.url && !block.label) return null;
  const isInternal = block.linkType === 'internal';
  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${isInternal ? 'bg-orange-500/10 border-orange-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
      {isInternal ? <Link className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" /> : <ExternalLink className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
      <div>
        {block.description && <p className="text-white/50 text-sm mb-1">{block.description}</p>}
        <a href={block.url} target={isInternal ? '_self' : '_blank'} rel="noopener noreferrer"
          className={`font-semibold hover:underline ${isInternal ? 'text-orange-400' : 'text-blue-400'}`}>
          {block.label || block.url}
        </a>
      </div>
    </div>
  );
}

function QuoteRenderer({ block }) {
  return (
    <blockquote className="border-l-4 border-orange-500 pl-6 my-2">
      <p className="text-white/70 text-lg italic leading-relaxed">{block.text}</p>
    </blockquote>
  );
}

function DividerRenderer() {
  return <hr className="border-white/10 my-2" />;
}

export default function BlockRenderer({ blocks = [] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading': return <HeadingRenderer key={block.id} block={block} />;
          case 'paragraph': return <ParagraphRenderer key={block.id} block={block} />;
          case 'image': return <ImageRenderer key={block.id} block={block} />;
          case 'list': return <ListRenderer key={block.id} block={block} />;
          case 'link': return <LinkRenderer key={block.id} block={block} />;
          case 'quote': return <QuoteRenderer key={block.id} block={block} />;
          case 'divider': return <DividerRenderer key={block.id} />;
          default: return null;
        }
      })}
    </div>
  );
}