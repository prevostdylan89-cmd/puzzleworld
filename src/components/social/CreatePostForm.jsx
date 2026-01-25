import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Puzzle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PUZZLE_CATEGORIES = ['Nature', 'Art & Culture', 'Architecture', 'Abstract'];

export default function CreatePostForm({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [isCompletionPost, setIsCompletionPost] = useState(false);
  const [puzzleName, setPuzzleName] = useState('');
  const [puzzleBrand, setPuzzleBrand] = useState('');
  const [puzzlePieces, setPuzzlePieces] = useState('');
  const [puzzleCategory, setPuzzleCategory] = useState('');
  const [puzzleReference, setPuzzleReference] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const validatePuzzlePost = () => {
    if (!isCompletionPost) return true;

    const errors = [];
    if (!puzzleCategory) errors.push('Catégorie');
    if (!puzzlePieces || puzzlePieces <= 0) errors.push('Nombre de pièces');
    if (!puzzleBrand) errors.push('Marque');
    if (!imageFile && !imagePreview) errors.push('Photo');
    if (!puzzleReference) errors.push('Référence');

    if (errors.length > 0) {
      toast.error(`Champs requis manquants: ${errors.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) {
      toast.error('Veuillez ajouter du contenu ou une image');
      return;
    }

    if (!validatePuzzlePost()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = '';
      
      if (imageFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = uploadResult.file_url;
      }

      const postData = {
        content: content.trim(),
        is_completion_post: isCompletionPost,
        author_name: user.full_name || user.email,
        likes_count: 0,
        comments_count: 0
      };

      if (imageUrl) postData.image_url = imageUrl;
      if (isCompletionPost) {
        postData.puzzle_name = puzzleName || 'Puzzle';
        postData.puzzle_brand = puzzleBrand;
        postData.puzzle_pieces = parseInt(puzzlePieces);
        postData.puzzle_category = puzzleCategory;
        postData.puzzle_reference = puzzleReference;
      }

      await base44.entities.Post.create(postData);

      if (isCompletionPost) {
        await base44.entities.CompletedPuzzle.create({
          puzzle_name: puzzleName || 'Puzzle',
          puzzle_brand: puzzleBrand,
          puzzle_pieces: parseInt(puzzlePieces),
          image_url: imageUrl
        });

        const completedCount = (await base44.entities.CompletedPuzzle.filter({ created_by: user.email })).length;
        
        if (completedCount === 1) {
          await base44.entities.Achievement.create({
            achievement_type: 'first_puzzle',
            title: 'First Steps',
            description: 'Complete your first puzzle',
            icon: 'trophy',
            color: 'orange'
          });
          toast.success('Achievement Unlocked: First Steps! 🏆');
        } else if (completedCount === 100) {
          await base44.entities.Achievement.create({
            achievement_type: 'hundred_club',
            title: 'Century',
            description: 'Complete 100 puzzles',
            icon: 'crown',
            color: 'pink'
          });
          toast.success('Achievement Unlocked: Century! 👑');
        }
      }

      setContent('');
      setIsCompletionPost(false);
      setPuzzleName('');
      setPuzzleBrand('');
      setPuzzlePieces('');
      setPuzzleCategory('');
      setPuzzleReference('');
      removeImage();
      
      toast.success('Post créé avec succès!');
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Échec de la création du post. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 mb-6"
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Partagez votre passion pour les puzzles..."
            className="bg-transparent border-none text-white placeholder:text-white/40 resize-none min-h-[80px] p-0 focus-visible:ring-0"
          />

          <AnimatePresence>
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative mt-3 rounded-xl overflow-hidden"
              >
                <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-cover rounded-xl" />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
            <Button 
              onClick={() => setIsCompletionPost(!isCompletionPost)}
              variant={isCompletionPost ? "default" : "ghost"}
              size="sm"
              className={`rounded-full ${isCompletionPost ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'text-white/60 hover:text-orange-400'}`}
            >
              <Puzzle className="w-4 h-4 mr-1" />
              {isCompletionPost ? 'Poste Puzzle Actif' : 'Créer un Poste Puzzle'}
            </Button>
          </div>

          <AnimatePresence>
            {isCompletionPost && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-xs">Catégorie *</Label>
                    <Select value={puzzleCategory} onValueChange={setPuzzleCategory}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a2e] border-white/10">
                        {PUZZLE_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat} className="text-white hover:bg-white/10">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs">Nombre de pièces *</Label>
                    <Input
                      type="number"
                      value={puzzlePieces}
                      onChange={(e) => setPuzzlePieces(e.target.value)}
                      placeholder="ex: 1000"
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70 text-xs">Marque *</Label>
                  <Input
                    value={puzzleBrand}
                    onChange={(e) => setPuzzleBrand(e.target.value)}
                    placeholder="ex: Ravensburger"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-xs">Référence du puzzle *</Label>
                  <Input
                    value={puzzleReference}
                    onChange={(e) => setPuzzleReference(e.target.value)}
                    placeholder="ex: RAV-12345"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-xs">Nom du puzzle (optionnel)</Label>
                  <Input
                    value={puzzleName}
                    onChange={(e) => setPuzzleName(e.target.value)}
                    placeholder="ex: Starry Night"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Photo du puzzle *</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="puzzleImageUpload"
                  />
                  <label htmlFor="puzzleImageUpload">
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      asChild
                    >
                      <span>
                        <ImagePlus className="w-4 h-4 mr-2" />
                        {imageFile ? 'Changer la photo' : 'Ajouter une photo'}
                      </span>
                    </Button>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/[0.06]">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !imageFile)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  Publier
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}