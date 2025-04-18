import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshProfile } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(user?.date_of_birth || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getEmail() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || '');
    }
    if (isOpen) getEmail();
  }, [isOpen]);

  const uploadAvatar = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    try {
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let newAvatarUrl = avatarUrl;

      // If there's a new avatar file, upload it
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          date_of_birth: dateOfBirth,
          phone,
          bio,
          avatar_url: newAvatarUrl,
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      await refreshProfile();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/95 flex items-start justify-center z-50 overflow-y-auto min-h-screen">
      <div className="w-full max-w-xl mx-auto my-8 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Edit Profile</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-base text-gray-900 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-base text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-base text-gray-900 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-base text-gray-900 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-base text-gray-900 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm"
            />
          </div>

          <div>
            <label className="block text-base text-gray-900 mb-2">
              Profile Picture
            </label>
            {/* Display current avatar if exists */}
            {avatarUrl && !avatarFile && (
              <div className="mb-4">
                <img 
                  src={avatarUrl} 
                  alt="Current profile picture" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              </div>
            )}
            <div className="mt-1 flex items-center space-x-4">
              <label 
                htmlFor="avatar-upload" 
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Image
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)}
                className="sr-only"
              />
              {avatarFile && (
                <span className="text-sm text-gray-500">
                  Selected: {avatarFile.name}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Supported formats: JPG, PNG, GIF. Max file size: 5MB
            </p>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}