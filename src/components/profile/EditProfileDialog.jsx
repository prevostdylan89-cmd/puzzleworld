import React, { useState, useRef } from 'react';
import { Camera, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
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
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [coverPhoto, setCoverPhoto] = useState(user?.cover_photo || '');

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop grande (max 5MB)');
      return;
    }

    setUploadingProfile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfilePhoto(file_url);
      toast.success('Image uploadée!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop grande (max 5MB)');
      return;
    }

    setUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCoverPhoto(file_url);
      toast.success('Image uploadée!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingCover(false);
    }
  };

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
          className="border-white/20 text-white bg-transparent hover:bg-white/5"
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
          {/* Profile Photo */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Photo de profil</label>
            <div className="flex items-center gap-3">
              {profilePhoto && (
                <img
                  src={profilePhoto}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
                />
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleProfileUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('profile-upload').click()}
                  disabled={uploadingProfile}
                  variant="outline"
                  className="w-full border-white/20 text-white bg-transparent hover:bg-white/5"
                >
                  {uploadingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choisir une image
                    </>
                  )}
                </Button>
                <p className="text-xs text-white/40">JPG, PNG - Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Photo de couverture</label>
            <div className="space-y-2">
              {coverPhoto && (
                <img
                  src={coverPhoto}
                  alt="Preview"
                  className="w-full h-32 rounded-lg object-cover border-2 border-white/10"
                />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleCoverUpload}
                className="hidden"
                id="cover-upload"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('cover-upload').click()}
                disabled={uploadingCover}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/5"
              >
                {uploadingCover ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choisir une bannière
                  </>
                )}
              </Button>
              <p className="text-xs text-white/40">JPG, PNG - Max 5MB - Recommandé: 1200x400px</p>
            </div>
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