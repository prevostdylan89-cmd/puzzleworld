import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Puzzle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreatePostForm({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [isCompletionPost, setIsCompletionPost] = useState(false);
  const [puzzleName, setPuzzleName] = useState('');
  const [puzzleBrand, setPuzzleBrand] = useState('');
  const [puzzlePieces, setPuzzlePieces] = useState('');
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

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) {
      toast.error('Please add some content or an image');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = '';
      
      // Upload image if present
      if (imageFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = uploadResult.file_url;
      }

      // Create post
      const postData = {
        content: content.trim(),
        is_completion_post: isCompletionPost,
        author_name: user.full_name || user.email,
        likes_count: 0,
        comments_count: 0
      };

      if (imageUrl) postData.image_url = imageUrl;
      if (isCompletionPost) {
        if (puzzleName) postData.puzzle_name = puzzleName;
        if (puzzleBrand) postData.puzzle_brand = puzzleBrand;
        if (puzzlePieces) postData.puzzle_pieces = parseInt(puzzlePieces);
      }

      await base44.entities.Post.create(postData);

      // If completion post, also add to completed puzzles
      if (isCompletionPost && puzzleName) {
        await base44.entities.CompletedPuzzle.create({
          puzzle_name: puzzleName,
          puzzle_brand: puzzleBrand || '',
          puzzle_pieces: parseInt(puzzlePieces) || 0,
          image_url: imageUrl
        });

        // Check for achievements
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

      // Reset form
      setContent('');
      setIsCompletionPost(false);
      setPuzzleName('');
      setPuzzleBrand('');
      setPuzzlePieces('');
      removeImage();
      
      toast.success('Post created successfully!');
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
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
            placeholder="Share your puzzle journey..."
            className="bg-transparent border-none text-white placeholder:text-white/40 resize-none min-h-[80px] p-0 focus-visible:ring-0"
          />

          {/* Image Preview */}
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

          {/* Puzzle Details Checkbox */}
          <div className="flex items-center space-x-2 mt-3">
            <Checkbox
              id="completion"
              checked={isCompletionPost}
              onCheckedChange={setIsCompletionPost}
              className="border-white/20 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <label htmlFor="completion" className="text-sm text-white/70 cursor-pointer flex items-center gap-1">
              <Puzzle className="w-4 h-4 text-orange-400" />
              This is a puzzle completion post
            </label>
          </div>

          {/* Puzzle Details Form */}
          <AnimatePresence>
            {isCompletionPost && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]"
              >
                <div>
                  <Label htmlFor="puzzleName" className="text-white/70 text-xs">Puzzle Name *</Label>
                  <Input
                    id="puzzleName"
                    value={puzzleName}
                    onChange={(e) => setPuzzleName(e.target.value)}
                    placeholder="e.g., Starry Night"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="puzzleBrand" className="text-white/70 text-xs">Brand</Label>
                    <Input
                      id="puzzleBrand"
                      value={puzzleBrand}
                      onChange={(e) => setPuzzleBrand(e.target.value)}
                      placeholder="e.g., Ravensburger"
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="puzzlePieces" className="text-white/70 text-xs">Pieces</Label>
                    <Input
                      id="puzzlePieces"
                      type="number"
                      value={puzzlePieces}
                      onChange={(e) => setPuzzlePieces(e.target.value)}
                      placeholder="e.g., 1000"
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="imageUpload"
              />
              <label htmlFor="imageUpload">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="text-white/40 hover:text-orange-400 hover:bg-orange-500/10"
                  asChild
                >
                  <span>
                    <ImagePlus className="w-5 h-5" />
                  </span>
                </Button>
              </label>
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !imageFile)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post
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