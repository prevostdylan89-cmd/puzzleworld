import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EditProfileDialog({ user, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [coverPhoto, setCoverPhoto] = useState(user?.cover_photo || '');

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        profile_photo: profilePhoto,
        cover_photo: coverPhoto
      });
      
      toast.success('Profil mis à jour');
      setOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/5"
        >
          <Camera className="w-4 h-4 mr-2" />
          Modifier le profil
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Modifier le profil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-2 block">Photo de profil (URL)</label>
            <Input
              placeholder="https://..."
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            {profilePhoto && (
              <img
                src={profilePhoto}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover mt-2"
              />
            )}
          </div>
          <div>
            <label className="text-white/70 text-sm mb-2 block">Photo de couverture (URL)</label>
            <Input
              placeholder="https://..."
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            {coverPhoto && (
              <img
                src={coverPhoto}
                alt="Preview"
                className="w-full h-24 rounded-lg object-cover mt-2"
              />
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}