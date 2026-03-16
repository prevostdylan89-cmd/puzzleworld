import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import {
  GripVertical, Plus, Trash2, Type, Image as ImageIcon,
  List, Link, Quote, Minus, Upload, Loader2, Search, AlignLeft, Grid3X3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const BLOCK_TYPES = [
  { type: 'heading', label: 'Titre (H2/H3)', icon: Type },
  { type: 'paragraph', label: 'Paragraphe', icon: AlignLeft },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'puzzle_card', label: 'Fiche Puzzle', icon: Grid3X3 },
  { type: 'list', label: 'Liste', icon: List },
  { type: 'link', label: 'Lien', icon: Link },
  { type: 'quote', label: 'Citation', icon: Quote },
  { type: 'divider', label: 'Séparateur', icon: Minus },
];

const BLOCK_LABELS = {
  heading: 'Titre', paragraph: 'Paragraphe', image: 'Image',
  list: 'Liste', link: 'Lien', quote: 'Citation', divider: 'Séparateur',
  puzzle_card: 'Fiche Puzzle',
};

export function generateBlockId() {
  return Math.random().toString(36).substr(2, 9);
}

export function createBlock(type) {
  const base = { id: generateBlockId(), type, column: 'full' };
  switch (type) {
    case 'heading': return { ...base, level: 'h2', text: '' };
    case 'paragraph': return { ...base, text: '' };
    case 'image': return { ...base, url: '', alt: '', caption: '' };
    case 'list': return { ...base, style: 'bullet', items: [''] };
    case 'link': return { ...base, linkType: 'external', url: '', label: '', description: '' };
    case 'quote': return { ...base, text: '' };
    case 'puzzle_card': return { ...base, puzzle_id: null, puzzle_title: '', puzzle_image: '', puzzle_brand: '', piece_count: null, amazon_link: '', amazon_price: null, amazon_rating: null, amazon_ratings_total: null, description: '', category_tag: '' };
    case 'divider': return base;
    default: return base;
  }
}

// --- Column Selector ---
function ColumnSelector({ column, onChange }) {
  const options = [
    { value: 'left', label: '⬅ Gauche' },
    { value: 'full', label: '↔ Entier' },
    { value: 'right', label: 'Droite ➡' },
  ];
  return (
    <div className="flex gap-1">
      {options.map(({ value, label }) => (
        <button key={value} onClick={() => onChange(value)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            (column || 'full') === value ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}

// --- Block content components ---

function HeadingBlock({ block, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {['h2', 'h3'].map(l => (
          <button key={l} onClick={() => onChange({ ...block, level: l })}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${block.level === l ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <Input value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder={`Titre ${block.level === 'h2' ? '2 (section principale)' : '3 (sous-section)'}...`}
        className={`bg-white/5 border-white/20 text-white font-bold ${block.level === 'h2' ? 'text-xl' : 'text-lg'}`} />
    </div>
  );
}

function ParagraphBlock({ block, onChange }) {
  return (
    <div>
      <Textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Écrivez votre paragraphe... Utilisez **texte** pour gras, *texte* pour italique"
        className="bg-white/5 border-white/20 text-white text-sm resize-none" rows={4} />
      <p className="text-xs text-white/20 mt-1">**gras** · *italique*</p>
    </div>
  );
}

function ImageBlock({ block, onChange }) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...block, url: file_url });
    setUploading(false);
  };
  return (
    <div className="space-y-2">
      {block.url && <img src={block.url} alt={block.alt} className="w-full max-h-56 object-cover rounded-lg" />}
      <label className="cursor-pointer block">
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-dashed border-white/20 rounded-lg text-white/50 text-sm hover:border-orange-500/50 transition-colors">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Upload en cours...' : block.url ? "Changer l'image" : 'Uploader une image'}
        </div>
      </label>
      <Input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
        placeholder="Ou coller une URL d'image" className="bg-white/5 border-white/20 text-white text-sm" />
      <Input value={block.alt} onChange={e => onChange({ ...block, alt: e.target.value })}
        placeholder="Texte ALT SEO" className="bg-white/5 border-white/20 text-white text-sm" />
      <Input value={block.caption} onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Légende (optionnel)" className="bg-white/5 border-white/20 text-white text-sm" />
    </div>
  );
}

function PuzzleCardBlock({ block, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPuzzles = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const res = await base44.entities.PuzzleCatalog.filter(
      { title: { $regex: search, $options: 'i' } }, '-total_likes', 12
    );
    setResults(res);
    setLoading(false);
  };

  const selectPuzzle = (p) => {
    onChange({
      ...block,
      puzzle_id: p.id,
      puzzle_title: p.title,
      puzzle_image: p.image_hd,
      puzzle_brand: p.brand,
      piece_count: p.piece_count,
      amazon_link: p.amazon_link || (p.asin ? `https://www.amazon.fr/dp/${p.asin}?tag=puzzleworld-21` : ''),
      amazon_price: p.amazon_price,
      amazon_rating: p.amazon_rating,
      amazon_ratings_total: p.amazon_ratings_total,
      description: p.description,
      category_tag: p.category_tag,
    });
    setResults([]);
    setSearch('');
  };

  return (
    <div className="space-y-3">
      {block.puzzle_id ? (
        <div className="flex gap-3 bg-white/5 rounded-lg p-3">
          {block.puzzle_image && (
            <img src={block.puzzle_image} alt={block.puzzle_title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{block.puzzle_title}</p>
            <p className="text-white/50 text-xs">{block.puzzle_brand} · {block.piece_count} pièces</p>
            {block.amazon_price && <p className="text-orange-400 text-sm font-bold">{block.amazon_price}€</p>}
            {block.amazon_rating && (
              <p className="text-yellow-400 text-xs">⭐ {block.amazon_rating}/5{block.amazon_ratings_total ? ` (${block.amazon_ratings_total} avis)` : ''}</p>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={() => onChange({ ...block, puzzle_id: null, puzzle_title: '' })}
            className="text-red-400 p-1 h-7 w-7 flex-shrink-0"><Trash2 className="w-3 h-3" /></Button>
        </div>
      ) : (
        <p className="text-white/30 text-sm italic">Aucun puzzle sélectionné</p>
      )}
      <div className="flex gap-1">
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un puzzle du catalogue..."
          className="bg-white/5 border-white/20 text-white text-sm"
          onKeyDown={e => e.key === 'Enter' && searchPuzzles()} />
        <Button size="sm" onClick={searchPuzzles} className="bg-orange-500 hover:bg-orange-600 px-2">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1 border border-white/10 rounded-lg p-1">
          {results.map(p => (
            <button key={p.id} onClick={() => selectPuzzle(p)}
              className="w-full flex items-center gap-2 text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors">
              {p.image_hd && <img src={p.image_hd} alt={p.title} className="w-10 h-10 object-cover rounded flex-shrink-0" />}
              <div className="min-w-0">
                <p className="truncate font-medium text-xs">{p.title}</p>
                <p className="text-white/40 text-[10px]">{p.brand} · {p.piece_count} pièces{p.amazon_price ? ` · ${p.amazon_price}€` : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListBlock({ block, onChange }) {
  const updateItem = (i, val) => { const items = [...block.items]; items[i] = val; onChange({ ...block, items }); };
  const addItem = () => onChange({ ...block, items: [...block.items, ''] });
  const removeItem = (i) => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 mb-1">
        {['bullet', 'ordered'].map(s => (
          <button key={s} onClick={() => onChange({ ...block, style: s })}
            className={`px-3 py-1 rounded text-xs transition-colors ${block.style === s ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {s === 'bullet' ? '• Puces' : '1. Numérotée'}
          </button>
        ))}
      </div>
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-white/40 text-sm w-5 text-right flex-shrink-0">{block.style === 'ordered' ? `${i + 1}.` : '•'}</span>
          <Input value={item} onChange={e => updateItem(i, e.target.value)}
            placeholder={`Élément ${i + 1}`} className="bg-white/5 border-white/20 text-white text-sm flex-1"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }} />
          <Button size="sm" variant="ghost" onClick={() => removeItem(i)} disabled={block.items.length <= 1}
            className="text-red-400 p-1 h-7 w-7 flex-shrink-0"><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={addItem} className="text-orange-400 text-xs">
        <Plus className="w-3 h-3 mr-1" /> Ajouter un élément
      </Button>
    </div>
  );
}

function LinkBlock({ block, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const searchArticles = async () => {
    if (!search.trim()) return;
    const res = await base44.entities.BlogArticle.filter({ title: { $regex: search, $options: 'i' }, is_published: true }, '-created_date', 10);
    setResults(res);
  };
  const selectArticle = (a) => {
    onChange({ ...block, linkType: 'internal', url: `/Blog?article=${a.slug}`, label: a.title });
    setResults([]); setSearch('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {['external', 'internal'].map(t => (
          <button key={t} onClick={() => onChange({ ...block, linkType: t })}
            className={`px-3 py-1 rounded text-xs transition-colors ${block.linkType === t ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {t === 'external' ? '🌐 Externe' : '🔗 Interne'}
          </button>
        ))}
      </div>
      {block.linkType === 'internal' && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un article..." className="bg-white/5 border-white/20 text-white text-sm"
              onKeyDown={e => e.key === 'Enter' && searchArticles()} />
            <Button size="sm" onClick={searchArticles} className="bg-orange-500 hover:bg-orange-600 px-2">
              <Search className="w-3.5 h-3.5" />
            </Button>
          </div>
          {results.map(a => (
            <button key={a.id} onClick={() => selectArticle(a)}
              className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white truncate">{a.title}</button>
          ))}
        </div>
      )}
      <Input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
        placeholder={block.linkType === 'external' ? 'https://...' : 'URL'} className="bg-white/5 border-white/20 text-white text-sm" />
      <Input value={block.label} onChange={e => onChange({ ...block, label: e.target.value })}
        placeholder="Texte du lien" className="bg-white/5 border-white/20 text-white text-sm" />
      <Input value={block.description} onChange={e => onChange({ ...block, description: e.target.value })}
        placeholder="Description courte (optionnel)" className="bg-white/5 border-white/20 text-white text-sm" />
    </div>
  );
}

function QuoteBlock({ block, onChange }) {
  return (
    <div className="border-l-4 border-orange-500 pl-4">
      <Textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Texte de la citation..." className="bg-white/5 border-white/20 text-white italic text-sm resize-none" rows={3} />
    </div>
  );
}

function BlockContent({ block, onChange }) {
  switch (block.type) {
    case 'heading': return <HeadingBlock block={block} onChange={onChange} />;
    case 'paragraph': return <ParagraphBlock block={block} onChange={onChange} />;
    case 'image': return <ImageBlock block={block} onChange={onChange} />;
    case 'puzzle_card': return <PuzzleCardBlock block={block} onChange={onChange} />;
    case 'list': return <ListBlock block={block} onChange={onChange} />;
    case 'link': return <LinkBlock block={block} onChange={onChange} />;
    case 'quote': return <QuoteBlock block={block} onChange={onChange} />;
    case 'divider': return <div className="h-px bg-white/20 rounded" />;
    default: return null;
  }
}

function AddBlockMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-center my-1">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-dashed border-white/20 text-white/40 hover:text-white hover:border-orange-500/50 hover:bg-orange-500/10 transition-all text-xs">
        <Plus className="w-3.5 h-3.5" /> Ajouter un bloc
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-8 z-20 bg-[#0d0d30] border border-white/20 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-1 min-w-[280px]">
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => { onAdd(bt.type); setOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left">
                <bt.icon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                {bt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function BlockEditor({ blocks, onChange }) {
  const updateBlock = (id, updated) => onChange(blocks.map(b => b.id === id ? updated : b));
  const deleteBlock = (id) => onChange(blocks.filter(b => b.id !== id));
  const addBlock = (type) => onChange([...blocks, createBlock(type)]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = [...blocks];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onChange(items);
  };

  return (
    <div className="space-y-2">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}
                      className={`group relative bg-[#0a0a2e] border rounded-xl p-4 transition-all ${
                        snapshot.isDragging ? 'border-orange-500/50 shadow-xl' : 'border-white/10 hover:border-white/20'
                      }`}>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <div {...provided.dragHandleProps} className="cursor-grab text-white/20 hover:text-white/50 transition-colors">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">
                          {BLOCK_LABELS[block.type]}
                          {block.type === 'heading' && ` — ${block.level?.toUpperCase()}`}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <ColumnSelector
                            column={block.column}
                            onChange={(col) => updateBlock(block.id, { ...block, column: col })}
                          />
                          <Button size="sm" variant="ghost" onClick={() => deleteBlock(block.id)}
                            className="text-red-400 hover:text-red-300 p-1 h-7 w-7">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <BlockContent block={block} onChange={(updated) => updateBlock(block.id, updated)} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <AddBlockMenu onAdd={addBlock} />

      {blocks.length === 0 && (
        <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
          Cliquez sur "+ Ajouter un bloc" pour commencer à écrire
        </div>
      )}
    </div>
  );
}