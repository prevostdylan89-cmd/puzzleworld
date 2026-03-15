import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, ImageIcon, Link, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';


const CATEGORIES = ["Conseils", "Actualités", "Tutoriels", "Puzzles", "Communauté", "SEO"];

const EMPTY_FORM = {
  title: '', subtitle: '', slug: '', content: '', cover_image: '',
  category: 'Conseils', tags: '', meta_description: '',
  external_link: '', external_link_label: '',
  puzzle_catalog_id: '', puzzle_title: '', puzzle_image: '',
  is_published: false, read_time: 5
};

function generateSlug(title) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function DashboardBlog() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [puzzleSearch, setPuzzleSearch] = useState('');
  const [puzzleResults, setPuzzleResults] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.BlogArticle.list('-created_date');
      setArticles(data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (article) => {
    setForm({ ...EMPTY_FORM, ...article });
    setEditingId(article.id);
    setShowForm(true);
  };

  const handleTitleChange = (val) => {
    setForm(f => ({ ...f, title: val, slug: f.slug || generateSlug(val) }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, cover_image: file_url }));
      toast.success('Image uploadée');
    } catch { toast.error("Erreur upload"); }
    finally { setUploading(false); }
  };

  const searchPuzzle = async () => {
    if (!puzzleSearch.trim()) return;
    const results = await base44.entities.PuzzleCatalog.filter({ title: { $regex: puzzleSearch, $options: 'i' } }, '-created_date', 10);
    setPuzzleResults(results);
  };

  const selectPuzzle = (p) => {
    setForm(f => ({ ...f, puzzle_catalog_id: p.id, puzzle_title: p.title, puzzle_image: p.image_hd || '' }));
    setPuzzleResults([]);
    setPuzzleSearch('');
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { toast.error('Titre et contenu requis'); return; }
    setSaving(true);
    try {
      const data = { ...form, slug: form.slug || generateSlug(form.title) };
      if (editingId) {
        await base44.entities.BlogArticle.update(editingId, data);
        toast.success('Article modifié');
      } else {
        await base44.entities.BlogArticle.create(data);
        toast.success('Article créé');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Erreur sauvegarde'); }
    finally { setSaving(false); }
  };

  const togglePublish = async (article) => {
    await base44.entities.BlogArticle.update(article.id, { is_published: !article.is_published });
    toast.success(article.is_published ? 'Article dépublié' : 'Article publié');
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet article ?')) return;
    await base44.entities.BlogArticle.delete(id);
    toast.success('Article supprimé');
    load();
  };

  if (showForm) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{editingId ? 'Modifier l\'article' : 'Nouvel article'}</h2>
          <Button variant="ghost" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Titre *</label>
              <Input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                placeholder="Titre de l'article" className="bg-white/5 border-white/20 text-white" />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Sous-titre</label>
              <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="Sous-titre accrocheur" className="bg-white/5 border-white/20 text-white" />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Contenu * <span className="text-white/30">(HTML supporté)</span></label>
              <Textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Écrivez votre article ici... Vous pouvez utiliser du HTML (<b>, <i>, <p>, <h2>, <ul>, <li>, <a href='...'>, etc.)"
                className="bg-white/5 border-white/20 text-white font-mono text-sm"
                rows={18}
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Description SEO (meta)</label>
              <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                placeholder="Description courte pour les moteurs de recherche (150 car. max)" maxLength={160}
                className="bg-white/5 border-white/20 text-white" rows={2} />
              <p className="text-xs text-white/30 mt-1">{form.meta_description?.length || 0}/160</p>
            </div>
          </div>

          {/* Right: settings */}
          <div className="space-y-4">
            {/* Image */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <label className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Image de couverture
              </label>
              {form.cover_image && (
                <img src={form.cover_image} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <label className="cursor-pointer block">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="border-2 border-dashed border-white/20 rounded-lg p-3 text-center text-white/50 text-sm hover:border-orange-500/50 transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Cliquer pour uploader'}
                </div>
              </label>
              <Input value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                placeholder="Ou coller une URL" className="bg-white/5 border-white/20 text-white mt-2 text-xs" />
            </div>

            {/* Meta */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <label className="text-sm font-semibold text-white">Paramètres</label>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Catégorie</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#0a0a2e] border border-white/20 text-white rounded-md px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Slug URL</label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="mon-article-seo" className="bg-white/5 border-white/20 text-white text-xs" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Tags (virgule)</label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="puzzle, conseil, débutant" className="bg-white/5 border-white/20 text-white text-xs" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Temps de lecture (min)</label>
                <Input type="number" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: Number(e.target.value) }))}
                  className="bg-white/5 border-white/20 text-white text-xs" />
              </div>
            </div>

            {/* Lien externe */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <label className="text-sm font-semibold text-white flex items-center gap-2"><Link className="w-4 h-4" /> Lien externe</label>
              <Input value={form.external_link} onChange={e => setForm(f => ({ ...f, external_link: e.target.value }))}
                placeholder="https://..." className="bg-white/5 border-white/20 text-white text-xs" />
              <Input value={form.external_link_label} onChange={e => setForm(f => ({ ...f, external_link_label: e.target.value }))}
                placeholder="Libellé du lien" className="bg-white/5 border-white/20 text-white text-xs" />
            </div>

            {/* Fiche puzzle */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <label className="text-sm font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4" /> Fiche puzzle</label>
              {form.puzzle_title && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                  {form.puzzle_image && <img src={form.puzzle_image} alt="" className="w-10 h-10 object-cover rounded" />}
                  <span className="text-xs text-white flex-1">{form.puzzle_title}</span>
                  <button onClick={() => setForm(f => ({ ...f, puzzle_catalog_id: '', puzzle_title: '', puzzle_image: '' }))}>
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              )}
              <div className="flex gap-1">
                <Input value={puzzleSearch} onChange={e => setPuzzleSearch(e.target.value)}
                  placeholder="Rechercher un puzzle..." className="bg-white/5 border-white/20 text-white text-xs" onKeyDown={e => e.key === 'Enter' && searchPuzzle()} />
                <Button size="sm" onClick={searchPuzzle} className="bg-orange-500 hover:bg-orange-600 text-xs px-2">OK</Button>
              </div>
              {puzzleResults.map(p => (
                <button key={p.id} onClick={() => selectPuzzle(p)}
                  className="w-full text-left flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg">
                  {p.image_hd && <img src={p.image_hd} alt="" className="w-8 h-8 object-cover rounded" />}
                  <span className="text-xs text-white truncate">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
          <Button onClick={() => { setForm(f => ({ ...f, is_published: false })); setTimeout(handleSave, 0); }}
            variant="outline" className="border-white/20 text-white hover:bg-white/10" disabled={saving}>
            Sauvegarder brouillon
          </Button>
          <Button onClick={() => { setForm(f => ({ ...f, is_published: true })); setTimeout(handleSave, 0); }}
            className="bg-orange-500 hover:bg-orange-600" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Publier l'article
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Blog</h2>
          <p className="text-white/50 text-sm">{articles.length} article(s)</p>
        </div>
        <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" /> Nouvel article
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-400" /></div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Aucun article. Créez le premier !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(a => (
            <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
              {a.cover_image && <img src={a.cover_image} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={a.is_published ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/10 text-white/50 border-white/20'}>
                    {a.is_published ? 'Publié' : 'Brouillon'}
                  </Badge>
                  {a.category && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{a.category}</Badge>}
                </div>
                <h3 className="font-semibold text-white truncate">{a.title}</h3>
                {a.subtitle && <p className="text-white/50 text-sm truncate">{a.subtitle}</p>}
                <p className="text-white/30 text-xs mt-1">/blog/{a.slug} • {a.read_time} min</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => togglePublish(a)} title={a.is_published ? 'Dépublier' : 'Publier'}>
                  {a.is_published ? <EyeOff className="w-4 h-4 text-white/50" /> : <Eye className="w-4 h-4 text-green-400" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                  <Pencil className="w-4 h-4 text-white/50" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}