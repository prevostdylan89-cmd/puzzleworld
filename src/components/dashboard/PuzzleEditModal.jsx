import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// puzzle=null means "create mode", puzzle=object means "edit mode"
export default function PuzzleEditModal({ open, onClose, puzzle, onUpdate }) {
  const isCreating = !puzzle;
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    piece_count: '',
    category_tag: '',
    price: '',
    asin: '',
    ean: '',
    image_hd: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (puzzle) {
      setFormData({
        title: puzzle.title || '',
        brand: puzzle.brand || '',
        piece_count: puzzle.piece_count || '',
        category_tag: puzzle.category_tag || '',
        price: puzzle.amazon_price || puzzle.price || '',
        asin: puzzle.asin || '',
        ean: puzzle.ean || '',
        image_hd: puzzle.image_hd || ''
      });
    } else {
      setFormData({ title: '', brand: '', piece_count: '', category_tag: '', price: '', asin: '', ean: '', image_hd: '' });
    }
  }, [puzzle, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        title: formData.title,
        brand: formData.brand,
        piece_count: parseInt(formData.piece_count) || 0,
        category_tag: formData.category_tag,
        price: parseFloat(formData.price) || 0,
        asin: formData.asin,
        amazon_link: formData.asin ? `https://www.amazon.fr/dp/${formData.asin}?tag=MON_PUZZLE_ID-21` : '',
        image_hd: formData.image_hd,
        socialScore: 0,
        wishlistCount: 0,
        added_count: 0,
        total_likes: 0,
        total_dislikes: 0
      };

      if (isCreating) {
        await base44.entities.PuzzleCatalog.create(data);
        toast.success('Puzzle ajouté à la collection !');
      } else {
        await base44.entities.PuzzleCatalog.update(puzzle.id, data);
        toast.success('Puzzle mis à jour');
      }
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating puzzle:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{isCreating ? 'Ajouter un puzzle' : 'Modifier le puzzle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-2 block">Titre</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Marque</label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">Nombre de pièces</label>
              <Input
                type="number"
                value={formData.piece_count}
                onChange={(e) => setFormData({ ...formData, piece_count: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">Catégorie</label>
            <Select
              value={formData.category_tag}
              onValueChange={(value) => setFormData({ ...formData, category_tag: value })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a2e] border-white/10">
                <SelectItem value="Nature" className="text-white">Nature</SelectItem>
                <SelectItem value="Abstract" className="text-white">Abstrait</SelectItem>
                <SelectItem value="Urban" className="text-white">Urbain</SelectItem>
                <SelectItem value="Space" className="text-white">Espace</SelectItem>
                <SelectItem value="Architecture" className="text-white">Architecture</SelectItem>
                <SelectItem value="Vintage" className="text-white">Vintage</SelectItem>
                <SelectItem value="Animals" className="text-white">Animaux</SelectItem>
                <SelectItem value="Art" className="text-white">Art</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">Prix (€)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">ASIN Amazon</label>
            <Input
              value={formData.asin}
              onChange={(e) => setFormData({ ...formData, asin: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="Ex: B07B9S8X1Q"
            />
            {formData.asin && (
              <p className="text-white/40 text-xs mt-1">
                → https://www.amazon.fr/dp/{formData.asin}
              </p>
            )}
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">URL Image HD</label>
            <Input
              value={formData.image_hd}
              onChange={(e) => setFormData({ ...formData, image_hd: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="https://..."
            />
          </div>

          {formData.image_hd && (
            <div>
              <label className="text-white/70 text-sm mb-2 block">Aperçu</label>
              <img
                src={formData.image_hd}
                alt="Preview"
                className="w-32 h-32 object-cover rounded"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                isCreating ? 'Ajouter le puzzle' : 'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}