import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PostAuthorAvatar({ authorEmail, authorInitials }) {
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    if (!authorEmail) return;

    const fetchPhoto = async () => {
      try {
        const profile = await base44.entities.UserProfile.filter({ email: authorEmail });
        if (profile.length > 0 && profile[0].profile_photo) {
          setProfilePhoto(profile[0].profile_photo);
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };

    fetchPhoto();
  }, [authorEmail]);

  return (
    <div className="h-10 w-10 rounded-full ring-2 ring-orange-500/20 overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 flex-shrink-0">
      {profilePhoto ? (
        <img src={profilePhoto} alt={authorEmail} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium">
          {authorInitials}
        </div>
      )}
    </div>
  );
}