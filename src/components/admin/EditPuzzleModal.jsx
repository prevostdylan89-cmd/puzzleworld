import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EditPuzzleModal({ isOpen, onClose, puzzle, onPuzzleUpdated }) {
  const [formData, setFormData] = useState({
    puzzle_name: '',
    puzzle_brand: '',
    puzzle_pieces: '',
    puzzle_reference: '',
    affiliate_link: '',
    difficulty: '',
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (puzzle) {
      setFormData({
        puzzle_name: puzzle.puzzle_name || '',
        puzzle_brand: puzzle.puzzle_brand || '',
        puzzle_pieces: puzzle.puzzle_pieces || '',
        puzzle_reference: puzzle.puzzle_reference || '',
        affiliate_link: puzzle.affiliate_link || '',
        difficulty: puzzle.difficulty || '',
        category: puzzle.category || ''
      });
    }
  }, [puzzle]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await base44.entities.GlobalPuzzle.update(puzzle.id, {
        puzzle_name: formData.puzzle_name,
        puzzle_brand: formData.puzzle_brand,
        puzzle_pieces: parseInt(formData.puzzle_pieces),
        puzzle_reference: formData.puzzle_reference,
        affiliate_link: formData.affiliate_link,
        difficulty: formData.difficulty,
        category: formData.category
      });

      toast.success('Puzzle updated successfully!');
      onPuzzleUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating puzzle:', error);
      toast.error('Failed to update puzzle');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !puzzle) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#0a0a2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#0a0a2e] border-b border-white/10 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-white">Edit Puzzle</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-white/70 text-sm">Puzzle Name</Label>
              <Input
                value={formData.puzzle_name}
                onChange={(e) => setFormData({ ...formData, puzzle_name: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 text-sm">Brand</Label>
                <Input
                  value={formData.puzzle_brand}
                  onChange={(e) => setFormData({ ...formData, puzzle_brand: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/70 text-sm">Number of Pieces</Label>
                <Input
                  type="number"
                  value={formData.puzzle_pieces}
                  onChange={(e) => setFormData({ ...formData, puzzle_pieces: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/70 text-sm">Reference Number</Label>
              <Input
                value={formData.puzzle_reference}
                onChange={(e) => setFormData({ ...formData, puzzle_reference: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1"
                disabled
              />
              <p className="text-white/40 text-xs mt-1">Reference cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 text-sm">Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a2e] border-white/10">
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70 text-sm">Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Landscape, Abstract"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/70 text-sm">Affiliate Link</Label>
              <Input
                value={formData.affiliate_link}
                onChange={(e) => setFormData({ ...formData, affiliate_link: e.target.value })}
                placeholder="https://..."
                className="bg-white/5 border-white/10 text-white mt-1"
              />
              <p className="text-white/40 text-xs mt-1">Add purchase link for monetization</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2">Puzzle Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/50">Total Completions</p>
                  <p className="text-white font-semibold">{puzzle.completion_count || 0}</p>
                </div>
                <div>
                  <p className="text-white/50">Unique Players</p>
                  <p className="text-white font-semibold">{puzzle.unique_players?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#0a0a2e] border-t border-white/10 p-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}