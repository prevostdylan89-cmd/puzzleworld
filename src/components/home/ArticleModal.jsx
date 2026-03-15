import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ArticleModal({ open, onClose, article }) {
  const navigate = useNavigate();
  
  if (!article) return null;

  const handleReadFull = () => {
    onClose();
    navigate(`${createPageUrl('Blog')}?article=${article.article_slug}`);
  };

  // Extrait le début du contenu (première 400 caractères ou premier paragraphe)
  const getPreview = () => {
    if (!article.content) return article.subtitle || '';
    // Enlève les tags HTML et nettoie
    const text = article.content
      .replace(/<[^>]*>/g, '') // Enlève les tags HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .trim();
    return text.substring(0, 400) + (text.length > 400 ? '...' : '');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            {article.article_title}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="space-y-4">
          {article.article_image && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={article.article_image} 
                alt={article.article_title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {article.article_category && (
             <div className="flex items-center gap-2">
               <span className="text-blue-300 text-sm font-semibold uppercase tracking-wide">
                 {article.article_category}
               </span>
             </div>
           )}

           <div className="bg-white/5 border border-white/10 rounded-lg p-4 min-h-[120px]">
             <p className="text-white/80 text-sm leading-relaxed">
               {getPreview()}
             </p>
           </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/5"
            >
              Fermer
            </Button>
            <Button 
              onClick={handleReadFull}
              className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              Lire l'article complet
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}