import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnnouncementCreated: () => Promise<void>;
}

const ANNOUNCEMENT_CATEGORIES = [
  { id: 'Academic', label: 'Academic' },
  { id: 'Events', label: 'Events' },
  { id: 'Campus', label: 'Campus' },
  { id: 'Club', label: 'Club' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Important', label: 'Important' }
];

export function CreateAnnouncementModal({ isOpen, onClose, onAnnouncementCreated }: CreateAnnouncementModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim() || !message.trim() || !category) {
      setError('Please fill in all required fields (title, message, and category)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('announcements').insert({
        title: title.trim(),
        message: message.trim(),
        category,
        created_by: user.id
      });

      if (insertError) throw insertError;

      // Reset form
      setTitle('');
      setMessage('');
      setCategory('');
      
      onClose();
      await onAnnouncementCreated();
    } catch (err) {
      console.error('Error creating announcement:', err);
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
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

        <h2 className="text-2xl font-bold mb-6">Create New Announcement</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
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
                  "focus:outline-none focus:ring-2 focus:ring-rose-500",
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
                    {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-sm text-left hover:bg-rose-50",
                          category === cat.id ? "bg-rose-50 text-rose-700" : "text-gray-700"
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

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              required
            />
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
                "px-6 py-2 rounded-xl bg-rose-600 text-white",
                "hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
                loading && "opacity-75 cursor-not-allowed"
              )}
            >
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
