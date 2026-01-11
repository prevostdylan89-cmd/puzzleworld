import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImagePlus, Puzzle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreatePostModal({ isOpen, onClose, onPostCreated, user }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [puzzleName, setPuzzleName] = useState('');
  const [puzzleBrand, setPuzzleBrand] = useState('');
  const [puzzlePieces, setPuzzlePieces] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please write something');
      return;
    }

    if (postType === 'completion' && (!puzzleName || !puzzlePieces)) {
      toast.error('Please fill in puzzle details');
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = null;

      // Upload image if exists
      if (imageFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = file_url;
      }

      // Create post
      const postData = {
        content: content.trim(),
        type: postType,
        image_url: imageUrl,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        likes_count: 0,
        comments_count: 0
      };

      if (postType === 'completion') {
        postData.puzzle_name = puzzleName;
        postData.puzzle_brand = puzzleBrand;
        postData.puzzle_pieces = parseInt(puzzlePieces);

        // Also add to completed puzzles
        await base44.entities.CompletedPuzzle.create({
          user_email: user.email,
          puzzle_name: puzzleName,
          puzzle_brand: puzzleBrand,
          puzzle_pieces: parseInt(puzzlePieces),
          image_url: imageUrl
        });
      }

      await base44.entities.Post.create(postData);

      toast.success('Post created successfully!');
      onPostCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setPostType('text');
    setPuzzleName('');
    setPuzzleBrand('');
    setPuzzlePieces('');
    setImageFile(null);
    setImagePreview(null);
    setTags('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#0a0a2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#0a0a2e] border-b border-white/10 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-white">Create Post</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
                  {user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-medium">{user?.full_name || 'User'}</p>
                <p className="text-white/50 text-sm">{user?.email}</p>
              </div>
            </div>

            {/* Post Type Selector */}
            <div className="flex gap-2">
              <Button
                variant={postType === 'text' ? 'default' : 'outline'}
                size="sm"
                className={postType === 'text' ? 'bg-orange-500' : 'border-white/20 text-white'}
                onClick={() => setPostType('text')}
              >
                Text Post
              </Button>
              <Button
                variant={postType === 'completion' ? 'default' : 'outline'}
                size="sm"
                className={postType === 'completion' ? 'bg-orange-500' : 'border-white/20 text-white'}
                onClick={() => setPostType('completion')}
              >
                <Puzzle className="w-4 h-4 mr-2" />
                Puzzle Completion
              </Button>
            </div>

            {/* Content */}
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={postType === 'completion' ? 'Share your puzzle completion story...' : 'What\'s on your mind?'}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px] resize-none"
            />

            {/* Image Upload */}
            <div>
              <Label className="text-white/70 text-sm mb-2 block">
                {postType === 'completion' ? 'Puzzle Image' : 'Add Image (Optional)'}
              </Label>
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="w-4 h-4 text-white" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-white/40" />
                  <span className="text-white/60">Click to upload image</span>
                </label>
              )}
            </div>

            {/* Puzzle Details (if completion post) */}
            {postType === 'completion' && (
              <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <Label className="text-white/70 text-sm">Puzzle Name *</Label>
                  <Input
                    value={puzzleName}
                    onChange={(e) => setPuzzleName(e.target.value)}
                    placeholder="e.g., Starry Night"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Brand</Label>
                  <Input
                    value={puzzleBrand}
                    onChange={(e) => setPuzzleBrand(e.target.value)}
                    placeholder="e.g., Ravensburger"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Number of Pieces *</Label>
                  <Input
                    type="number"
                    value={puzzlePieces}
                    onChange={(e) => setPuzzlePieces(e.target.value)}
                    placeholder="e.g., 1000"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <Label className="text-white/70 text-sm">Tags (comma separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., landscape, 1000pieces, ravensburger"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#0a0a2e] border-t border-white/10 p-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}