import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Calendar, Hash, Puzzle as PuzzleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AddPuzzleModal({ isOpen, onClose, onPuzzleAdded, user }) {
  const [formData, setFormData] = useState({
    puzzleName: '',
    pieces: '',
    reference: '',
    brand: '',
    completionDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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

  const handleSubmit = async () => {
    // Validation
    if (!formData.puzzleName.trim() || !formData.pieces || !formData.reference.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload a photo of your completed puzzle');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

      // Check if global puzzle exists
      const existingGlobalPuzzles = await base44.entities.GlobalPuzzle.filter({
        puzzle_reference: formData.reference
      });

      let globalPuzzle;
      
      if (existingGlobalPuzzles.length > 0) {
        // Update existing global puzzle
        globalPuzzle = existingGlobalPuzzles[0];
        const uniquePlayers = globalPuzzle.unique_players || [];
        
        if (!uniquePlayers.includes(user.email)) {
          uniquePlayers.push(user.email);
        }

        await base44.entities.GlobalPuzzle.update(globalPuzzle.id, {
          completion_count: (globalPuzzle.completion_count || 0) + 1,
          unique_players: uniquePlayers
        });
      } else {
        // Create new global puzzle
        globalPuzzle = await base44.entities.GlobalPuzzle.create({
          puzzle_reference: formData.reference,
          puzzle_name: formData.puzzleName,
          puzzle_brand: formData.brand || '',
          puzzle_pieces: parseInt(formData.pieces),
          image_url: file_url,
          completion_count: 1,
          unique_players: [user.email]
        });
      }

      // Add to user's completed puzzles
      const completedPuzzle = await base44.entities.CompletedPuzzle.create({
        user_email: user.email,
        puzzle_name: formData.puzzleName,
        puzzle_brand: formData.brand || '',
        puzzle_pieces: parseInt(formData.pieces),
        puzzle_reference: formData.reference,
        global_puzzle_id: globalPuzzle.id,
        image_url: file_url,
        completion_date: formData.completionDate
      });

      // Auto-create social post
      const postContent = `🧩 ${user.full_name || user.email} completed ${formData.puzzleName} (${formData.pieces} pieces) on ${format(new Date(formData.completionDate), 'MMM d, yyyy')}`;
      
      const post = await base44.entities.Post.create({
        content: postContent,
        type: 'completion',
        image_url: file_url,
        puzzle_name: formData.puzzleName,
        puzzle_brand: formData.brand || '',
        puzzle_pieces: parseInt(formData.pieces),
        tags: ['completion', formData.brand?.toLowerCase().replace(/\s+/g, '') || '', `${formData.pieces}pieces`].filter(Boolean),
        likes_count: 0,
        comments_count: 0
      });

      // Link post to completed puzzle
      await base44.entities.CompletedPuzzle.update(completedPuzzle.id, {
        post_id: post.id
      });

      // Check and award achievements
      const allCompleted = await base44.entities.CompletedPuzzle.filter({
        user_email: user.email
      });

      if (allCompleted.length === 1) {
        // First puzzle achievement
        const existing = await base44.entities.Achievement.filter({
          user_email: user.email,
          achievement_type: 'first_puzzle'
        });
        
        if (existing.length === 0) {
          await base44.entities.Achievement.create({
            user_email: user.email,
            achievement_type: 'first_puzzle',
            title: 'First Steps',
            description: 'Complete your first puzzle',
            icon: 'trophy',
            color: 'orange',
            unlocked_at: new Date().toISOString()
          });
        }
      }

      toast.success('Puzzle added successfully!');
      onPuzzleAdded();
      handleClose();
    } catch (error) {
      console.error('Error adding puzzle:', error);
      toast.error('Failed to add puzzle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      puzzleName: '',
      pieces: '',
      reference: '',
      brand: '',
      completionDate: format(new Date(), 'yyyy-MM-dd')
    });
    setImageFile(null);
    setImagePreview(null);
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
            <div>
              <h2 className="text-xl font-bold text-white">Add Completed Puzzle</h2>
              <p className="text-white/50 text-sm">Share your achievement with the community</p>
            </div>
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
          <div className="p-6 space-y-6">
            {/* Step 1: Puzzle Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <PuzzleIcon className="w-5 h-5" />
                <h3 className="font-semibold">Puzzle Details</h3>
              </div>

              <div>
                <Label className="text-white/70 text-sm">Puzzle Name *</Label>
                <Input
                  value={formData.puzzleName}
                  onChange={(e) => setFormData({ ...formData, puzzleName: e.target.value })}
                  placeholder="e.g., Starry Night, Mountain Landscape"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70 text-sm">Number of Pieces *</Label>
                  <Input
                    type="number"
                    value={formData.pieces}
                    onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                    placeholder="e.g., 1000"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Brand</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Ravensburger"
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white/70 text-sm">Reference / Model Number *</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g., RVB123456, unique identifier"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
                <p className="text-white/40 text-xs mt-1">
                  This helps us track the same puzzle across users
                </p>
              </div>

              <div>
                <Label className="text-white/70 text-sm">Completion Date *</Label>
                <Input
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>

            {/* Step 2: Photo Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Upload className="w-5 h-5" />
                <h3 className="font-semibold">Puzzle Photo *</h3>
              </div>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-orange-500/20">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-cover" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed border-orange-500/30 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors bg-orange-500/5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-orange-400" />
                  <div className="text-center">
                    <p className="text-white/80 font-medium">Upload completed puzzle photo</p>
                    <p className="text-white/40 text-sm mt-1">Click to browse your files</p>
                  </div>
                </label>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-300 text-sm">
                ℹ️ Your puzzle will be added to your personal collection and automatically shared with the community!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#0a0a2e] border-t border-white/10 p-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Puzzle'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}