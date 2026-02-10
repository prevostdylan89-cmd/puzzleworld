import React, { useState } from 'react';
import { Gamepad2, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function DashboardOnline() {
  const [games, setGames] = useState([
    {
      id: 1,
      title: 'Jigsaw Explorer',
      description: 'Thousands of free online jigsaw puzzles with stunning HD images.',
      image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600&h=300&fit=crop',
      url: '#',
      platform: 'Web'
    },
    {
      id: 2,
      title: 'Puzzle Party',
      description: 'Compete with friends in real-time puzzle challenges.',
      image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=600&h=300&fit=crop',
      url: '#',
      platform: 'Web & Mobile'
    }
  ]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    url: '',
    platform: ''
  });

  const handleAdd = () => {
    setEditingGame(null);
    setFormData({ title: '', description: '', image: '', url: '', platform: '' });
    setShowDialog(true);
  };

  const handleEdit = (game) => {
    setEditingGame(game);
    setFormData(game);
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    setGames(games.filter(g => g.id !== id));
    toast.success('Jeu supprimé');
  };

  const handleSave = () => {
    if (!formData.title || !formData.description) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (editingGame) {
      setGames(games.map(g => g.id === editingGame.id ? { ...formData, id: g.id } : g));
      toast.success('Jeu modifié');
    } else {
      setGames([...games, { ...formData, id: Date.now() }]);
      toast.success('Jeu ajouté');
    }
    setShowDialog(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Jeux En Ligne</h2>
          <p className="text-white/60">Gérez les jeux de puzzle disponibles en ligne</p>
        </div>
        <Button onClick={handleAdd} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un jeu
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group"
          >
            <div className="aspect-video bg-white/5">
              <img
                src={game.image}
                alt={game.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold mb-1">{game.title}</h3>
              <p className="text-white/50 text-sm mb-2 line-clamp-2">{game.description}</p>
              <p className="text-orange-400 text-xs mb-3">{game.platform}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(game)}
                  size="sm"
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Modifier
                </Button>
                <Button
                  onClick={() => handleDelete(game.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGame ? 'Modifier le jeu' : 'Ajouter un jeu'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70 mb-2 block">Titre *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Nom du jeu"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                rows={3}
                placeholder="Description du jeu"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">URL de l'image</label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">URL du jeu</label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">Plateforme</label>
              <Input
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Web, Mobile, Web & Mobile..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1 border-white/20 text-white">
                Annuler
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600">
                {editingGame ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}