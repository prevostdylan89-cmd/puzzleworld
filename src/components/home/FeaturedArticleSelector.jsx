import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function FeaturedArticleSelector({ open, onClose, position, currentArticle, onUpdate }) {
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) loadArticles();
  }, [open]);

  const loadArticles = async () => {
    setLoading(true);
    const data = await base44.entities.BlogArticle.filter({ is_published: true }, '-created_date', 50);
    setArticles(data);
    setLoading(false);
  };

  const filtered = articles.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  const selectArticle = async (article) => {
    setSaving(true);
    if (currentArticle) {
      await base44.entities.FeaturedArticle.update(currentArticle.id, {
        article_id: article.id,
        article_title: article.title,
        article_image: article.cover_image || '',
        article_category: article.category || '',
        article_slug: article.slug || '',
      });
    } else {
      await base44.entities.FeaturedArticle.create({
        position,
        article_id: article.id,
        article_title: article.title,
        article_image: article.cover_image || '',
        article_category: article.category || '',
        article_slug: article.slug || '',
      });
    }
    toast.success('Article sélectionné');
    await onUpdate();
    onClose();
    setSaving(false);
  };

  const removeArticle = async () => {
    if (!currentArticle) return;
    setSaving(true);
    await base44.entities.FeaturedArticle.delete(currentArticle.id);
    toast.success('Article retiré');
    await onUpdate();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Sélectionner un article — Position {position}</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="pl-10 bg-white/5 border-white/20 text-white"
          />
        </div>

        {currentArticle && (
          <div className="mb-3 flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <span className="text-orange-400 text-sm">Article actuel : {currentArticle.article_title}</span>
            <Button size="sm" variant="ghost" onClick={removeArticle} disabled={saving} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" /> Retirer
            </Button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-white/40">Aucun article publié trouvé</div>
          ) : (
            filtered.map(article => (
              <button
                key={article.id}
                onClick={() => selectArticle(article)}
                disabled={saving}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 rounded-lg transition-all text-left"
              >
                {article.cover_image ? (
                  <img src={article.cover_image} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm line-clamp-2">{article.title}</p>
                  {article.category && (
                    <span className="text-orange-400 text-xs">{article.category}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}