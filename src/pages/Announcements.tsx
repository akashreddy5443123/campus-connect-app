import { useState, useEffect } from 'react';
import { Bell, Plus, Pencil, Trash2, ChevronRight, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { shallow } from 'zustand/shallow';
import { CreateAnnouncementModal } from '../components/CreateAnnouncementModal';
import { EditAnnouncementModal } from '../components/EditAnnouncementModal';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface Announcement {
  id: string;
  title: string;
  message: string;
  category: string;
  created_at: string;
  created_by?: string;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  Academic: 'bg-blue-500/20 text-blue-100',
  Events: 'bg-purple-500/20 text-purple-100',
  Campus: 'bg-green-500/20 text-green-100',
  Club: 'bg-yellow-500/20 text-yellow-100',
  Sports: 'bg-orange-500/20 text-orange-100',
  Important: 'bg-red-500/20 text-red-100',
};

export default function Announcements() {
  const { user } = useAuthStore(state => ({ user: state.user }), shallow);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement');
    }
  };

  const filteredAnnouncements = selectedCategory === 'All'
    ? announcements
    : announcements.filter(a => a.category === selectedCategory);

  const categories = ['All', ...Object.keys(CATEGORY_COLORS)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-900 via-rose-800 to-rose-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Announcements</h1>
              <p className="text-rose-200">Stay in the loop with the latest updates</p>
            </div>
            {user?.is_admin && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm"
              >
                <Plus className="w-5 h-5 mr-2" /> New Announcement
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  selectedCategory === category
                    ? "bg-white text-rose-600"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
              <p className="text-rose-200">Loading announcements...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-400">{error}</div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="w-12 h-12 text-rose-300 mx-auto mb-4" />
              <p className="text-rose-200">
                {selectedCategory === 'All'
                  ? 'No announcements yet'
                  : `No ${selectedCategory} announcements yet`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAnnouncements.map((announcement) => (
                <div 
                  key={announcement.id}
                  className="group bg-white/10 backdrop-blur-md rounded-xl overflow-hidden hover:bg-white/20 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{announcement.title}</h3>
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-xs font-medium",
                            CATEGORY_COLORS[announcement.category] || "bg-gray-500/20 text-gray-100"
                          )}>
                            {announcement.category}
                          </span>
                        </div>
                        <p className="text-rose-200 text-sm">
                          {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {(user?.is_admin || user?.id === announcement.created_by) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-rose-200 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            className="p-2 text-rose-200 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-rose-100 leading-relaxed">{announcement.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAnnouncementCreated={fetchAnnouncements}
      />

      {editingAnnouncement && (
        <EditAnnouncementModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAnnouncement(null);
          }}
          announcement={editingAnnouncement}
          onAnnouncementUpdated={fetchAnnouncements}
        />
      )}
    </div>
  );
}
