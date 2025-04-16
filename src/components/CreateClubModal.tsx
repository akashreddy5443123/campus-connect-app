import React, { useState } from 'react';
import { X, Upload, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClubCreated: () => Promise<void>;
}

const CATEGORIES = [
  { id: 'Academic', label: 'Academic' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Arts', label: 'Arts & Culture' },
  { id: 'Technology', label: 'Technology' },
  { id: 'Social', label: 'Social' }
];

export function CreateClubModal({ isOpen, onClose, onClubCreated }: CreateClubModalProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !description.trim() || !category) {
      setError('Please fill in all required fields (name, description, and category)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let uploadedImageUrl: string | null = null;

      // Handle image upload if a file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `clubs/${user.id}/${fileName}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('club_images')
            .upload(filePath, imageFile);

          if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

          const { data: urlData } = supabase.storage
            .from('club_images')
            .getPublicUrl(filePath);

          if (!urlData?.publicUrl) throw new Error("Could not get public URL for uploaded image.");
          uploadedImageUrl = urlData.publicUrl;

        } catch (uploadErr) {
          throw new Error(uploadErr instanceof Error ? uploadErr.message : "Failed to upload image");
        }
      }

      const { error: insertError } = await supabase.from('clubs').insert({
        name: name.trim(),
        description: description.trim(),
        category,
        meeting_time: meetingTime.trim(),
        location: location.trim(),
        email: email.trim(),
        website: website.trim(),
        image_url: uploadedImageUrl || imageUrl.trim(),
        created_by: user.id
      });

      if (insertError) throw insertError;

      // Reset form
      setName('');
      setDescription('');
      setCategory('');
      setMeetingTime('');
      setLocation('');
      setEmail('');
      setWebsite('');
      setImageFile(null);
      setImageUrl('');
      
      onClose();
      await onClubCreated();
    } catch (err) {
      console.error('Error creating club:', err);
      setError(err instanceof Error ? err.message : 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Create New Club</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Club Name */}
            <div className="col-span-2">
              <label htmlFor="club-name" className="block text-sm font-medium text-gray-700 mb-1">
                Club Name *
              </label>
              <input
                type="text"
                id="club-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    "w-full rounded-xl border border-gray-300 px-4 py-2 text-left text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500",
                    "flex items-center justify-between",
                    !category && "text-gray-500"
                  )}
                >
                  {category || 'Select a category'}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl bg-white shadow-lg border border-gray-200">
                    <div className="py-1">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.id);
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-sm text-left hover:bg-purple-50",
                            category === cat.id ? "bg-purple-50 text-purple-700" : "text-gray-700"
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Time */}
            <div>
              <label htmlFor="meeting-time" className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Time
              </label>
              <input
                type="text"
                id="meeting-time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="e.g., Every Monday at 5 PM"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="e.g., Room 101, Building A"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="https://"
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 mb-1">
                Club Image URL
              </label>
              <input
                type="url"
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="https://"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "px-6 py-2 rounded-xl bg-purple-600 text-white",
                "hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                loading && "opacity-75 cursor-not-allowed"
              )}
            >
              {loading ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}