import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Puzzle, Send, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ScanPuzzleModal from '@/components/scan/ScanPuzzleModal';

const PUZZLE_CATEGORIES = ['Nature', 'Art & Culture', 'Architecture', 'Abstract'];

export default function CreatePostForm({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text'); // 'text', 'photo', 'puzzle'
  const [puzzleName, setPuzzleName] = useState('');
  const [puzzleBrand, setPuzzleBrand] = useState('');
  const [puzzlePieces, setPuzzlePieces] = useState('');
  const [puzzleCategory, setPuzzleCategory] = useState('');
  const [puzzleReference, setPuzzleReference] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);

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

  const handlePuzzleScanned = (puzzle) => {
    setPuzzleData(puzzle);
    setPuzzleName(puzzle.title || '');
    setPuzzleBrand(puzzle.brand || '');
    setPuzzlePieces(puzzle.piece_count || '');
    setPuzzleReference(puzzle.asin || '');
    setImagePreview(puzzle.image_hd || '');
    setPostType('puzzle');
    setShowScanModal(false);
    toast.success('Puzzle ajouté au post!');
  };

  const validatePost = () => {
    if (!content.trim() && postType === 'text') {
      toast.error('Veuillez ajouter du contenu');
      return false;
    }

    if (postType === 'photo' && !imageFile && !imagePreview) {
      toast.error('Veuillez ajouter une photo');
      return false;
    }

    if (postType === 'puzzle') {
      const errors = [];
      if (!puzzleBrand) errors.push('Marque');
      if (!puzzlePieces || puzzlePieces <= 0) errors.push('Nombre de pièces');
      if (!puzzleReference) errors.push('Référence');
      if (!imagePreview) errors.push('Photo du puzzle');

      if (errors.length > 0) {
        toast.error(`Champs manquants: ${errors.join(', ')}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePost()) return;

    setIsSubmitting(true);

    try {
      let imageUrl = imagePreview;
      
      // Upload image only if it's a local file
      if (imageFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = uploadResult.file_url;
      }

      const postData = {
        content: content.trim() || '',
        is_completion_post: postType === 'puzzle',
        author_name: user.full_name || user.email,
        likes_count: 0,
        comments_count: 0
      };

      if (imageUrl) postData.image_url = imageUrl;
      
      if (postType === 'puzzle') {
        postData.puzzle_name = puzzleName || 'Puzzle';
        postData.puzzle_brand = puzzleBrand;
        postData.puzzle_pieces = parseInt(puzzlePieces);
        postData.puzzle_category = puzzleCategory || 'Autre';
        postData.puzzle_reference = puzzleReference;

        // Add to completed puzzles
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

      await base44.entities.Post.create(postData);

      // Reset form
      setContent('');
      setPostType('text');
      setPuzzleName('');
      setPuzzleBrand('');
      setPuzzlePieces('');
      setPuzzleCategory('');
      setPuzzleReference('');
      setPuzzleData(null);
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

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="photoUpload"
            />
            <label htmlFor="photoUpload">
              <Button 
                type="button"
                variant="ghost"
                size="sm"
                className={`rounded-full ${postType === 'photo' ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:text-blue-400'}`}
                asChild
              >
                <span>
                  <ImagePlus className="w-4 h-4 mr-1" />
                  Photo
                </span>
              </Button>
            </label>

            <Button 
              onClick={() => setShowScanModal(true)}
              variant="ghost"
              size="sm"
              className={`rounded-full ${postType === 'puzzle' ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-orange-400'}`}
            >
              <Scan className="w-4 h-4 mr-1" />
              Scanner Puzzle
            </Button>
          </div>

          <AnimatePresence>
            {postType === 'puzzle' && puzzleData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium text-sm flex items-center gap-2">
                    <Puzzle className="w-4 h-4 text-orange-400" />
                    Puzzle scanné
                  </h4>
                  <button
                    onClick={() => {
                      setPostType('text');
                      setPuzzleData(null);
                      removeImage();
                    }}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-white/70 space-y-1">
                  <p><strong>{puzzleName}</strong></p>
                  <p>Marque: {puzzleBrand}</p>
                  <p>Pièces: {puzzlePieces}</p>
                  <p>Réf: {puzzleReference}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/[0.06]">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
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

      {/* Scan Puzzle Modal */}
      <ScanPuzzleModal 
        open={showScanModal} 
        onClose={() => setShowScanModal(false)}
        onPuzzleAdded={handlePuzzleScanned}
        skipCollectionAdd={true}
      />
    </motion.div>
  );
}