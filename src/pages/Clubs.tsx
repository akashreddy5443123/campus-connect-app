import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Globe, MapPin, Calendar, Plus, Check, X, Pencil, Trash2, Clock, Users, ChevronRight,
  GraduationCap, Trophy, Palette, Laptop, Users2, LayoutGrid
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useRealtimeStore } from '../stores/realtimeStore';
import { shallow } from 'zustand/shallow';
import { CreateClubModal } from '../components/CreateClubModal';
import { EditClubModal } from '../components/EditClubModal';
import { cn } from '../lib/utils';

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  meeting_time: string;
  location: string;
  email: string;
  website: string;
  image_url: string;
  is_member?: boolean;
  created_by?: string;
}

export function Clubs() {
  const { user } = useAuthStore(state => ({ user: state.user }), shallow);
  const { subscribeToClubs, onClubsChange, unsubscribeAll } = useRealtimeStore();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingClubId, setActionLoadingClubId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Wrap fetchData in useCallback, depending only on user?.id
  const fetchData = useCallback(async () => {
    // Only set loading true if there's no data currently displayed
    if (clubs.length === 0) {
        setLoading(true);
    }
    // setError(null); // Reset error later or on success/start
    try {
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('*, created_by');
      if (clubsError) throw clubsError;

      let userMemberships = new Set<string>();
      if (user?.id) {
        const { data: membershipData, error: membershipError } = await supabase
          .from('club_memberships')
          .select('club_id')
          .eq('user_id', user.id);
        if (membershipError) throw membershipError;
        userMemberships = new Set(membershipData?.map(m => m.club_id) || []);
      }
      setClubs(clubsData || []);
      setMemberships(userMemberships);
      setError(null); // Clear error on successful fetch
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Don't clear data on error
      // setClubs([]);
      // setMemberships(new Set());
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Dependency only on user?.id

  useEffect(() => {
    fetchData();

    // Set up real-time subscription
    if (subscribeToClubs && onClubsChange) {
      subscribeToClubs();
      onClubsChange((payload) => {
        console.log('Real-time club update:', payload);
        fetchData();
      });
    }

    // Cleanup subscriptions
    return () => {
      if (unsubscribeAll) {
        unsubscribeAll();
      }
    };
  }, [fetchData, subscribeToClubs, onClubsChange, unsubscribeAll]);

  const clubsWithMembership = useMemo(() => {
    return clubs.map(club => ({
      ...club,
      is_member: memberships.has(club.id)
    }));
  }, [clubs, memberships]);

  const handleJoin = async (clubId: string) => {
    if (!user) { alert('Please sign in to join clubs.'); return; }
    if (memberships.has(clubId)) { 
      alert('You are already a member of this club.');
      return; 
    }
    setActionLoadingClubId(clubId);
    try {
const { data, error } = await supabase.from('club_memberships').insert({ club_id: clubId, user_id: user?.id });
if (error) {
 console.error("Supabase error details:", error);
 throw error;
}
      console.log("Join club response data:", data);
      setMemberships(prev => new Set(prev).add(clubId));
      await fetchData(); // Refetch data after joining
    } catch (err) { 
      console.error("Error joining club:", err); 
      alert(err instanceof Error ? err.message : 'Failed to join club'); 
    }
    finally { setActionLoadingClubId(null); }
  };

  const handleLeave = async (clubId: string) => {
     if (!user) return;
     setActionLoadingClubId(clubId);
     try {
       const { error } = await supabase.from('club_memberships').delete().eq('club_id', clubId).eq('user_id', user.id);
       if (error) throw error;
       setMemberships(prev => { const newSet = new Set(prev); newSet.delete(clubId); return newSet; });
       await fetchData(); // Refetch data after leaving
     } catch (err) { console.error("Error leaving club:", err); alert(err instanceof Error ? err.message : 'Failed to leave club'); }
     finally { setActionLoadingClubId(null); }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) return;
    setActionLoadingClubId(clubId);
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', clubId);
      if (error) throw error;
      await fetchData();
    } catch (err) { console.error("Error deleting club:", err); alert(err instanceof Error ? err.message : 'Failed to delete club'); }
    finally { setActionLoadingClubId(null); }
  };

  const openEditModal = (clubToEdit: Club) => {
    setEditingClub(clubToEdit);
    setIsEditModalOpen(true);
  };

  const filteredClubs = useMemo(() => {
    return clubsWithMembership.filter(club => 
      selectedCategory === 'All' || club.category === selectedCategory
    );
  }, [clubsWithMembership, selectedCategory]);

  const categories = [
    { id: 'All', icon: LayoutGrid, label: 'All Clubs' },
    { id: 'Academic', icon: GraduationCap, label: 'Academic' },
    { id: 'Sports', icon: Trophy, label: 'Sports' },
    { id: 'Arts', icon: Palette, label: 'Arts & Culture' },
    { id: 'Technology', icon: Laptop, label: 'Technology' },
    { id: 'Social', icon: Users2, label: 'Social' }
  ];

  // Get count of clubs in each category
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { All: clubsWithMembership.length };
    clubsWithMembership.forEach(club => {
      counts[club.category] = (counts[club.category] || 0) + 1;
    });
    return counts;
  }, [clubsWithMembership]);

  // Loading State - Show only if loading AND no clubs exist yet
  if (loading && clubs.length === 0) return <div className="text-center py-10">Loading clubs...</div>;
  if (error) return <div className="text-center py-10 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Clubs Directory</h1>
              <p className="text-purple-200">Find your tribe and unlock your potential</p>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm"
            >
              <Plus className="w-5 h-5 mr-2" /> Create Club
            </button>
          </div>

          {/* Enhanced Club Categories with Icons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {categories.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300",
                  "hover:transform hover:scale-105",
                  selectedCategory === id
                    ? "bg-white text-purple-900 shadow-lg shadow-white/10"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <Icon className={cn(
                  "w-6 h-6 mb-2",
                  selectedCategory === id ? "text-purple-900" : "text-white"
                )} />
                <span className="text-sm font-medium">{label}</span>
                {categoryCounts[id] > 0 && (
                  <span className={cn(
                    "mt-2 inline-flex items-center justify-center rounded-full text-xs px-2 py-1",
                    selectedCategory === id
                      ? "bg-purple-900 text-white"
                      : "bg-white/20 text-white"
                  )}>
                    {categoryCounts[id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading && clubs.length === 0 ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
              <p className="text-purple-200">Discovering clubs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-400">{error}</div>
          ) : filteredClubs.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <p className="text-purple-200">No clubs found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => (
                <div 
                  key={club.id} 
                  className="group bg-white/10 backdrop-blur-md rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
                >
                  <div className="relative h-48">
                    <img 
                      src={club.image_url || '/default-club.jpg'} 
                      alt={club.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-club.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 text-purple-600 text-xs font-medium px-3 py-1 rounded-full">
                        {club.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{club.name}</h3>
                    <p className="text-purple-200 text-sm mb-4 line-clamp-2">{club.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      {club.meeting_time && (
                        <div className="flex items-center text-sm text-purple-200">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{club.meeting_time}</span>
                        </div>
                      )}
                      {club.location && (
                        <div className="flex items-center text-sm text-purple-200">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{club.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      {user && (
                        <button
                          onClick={() => club.is_member ? handleLeave(club.id) : handleJoin(club.id)}
                          disabled={actionLoadingClubId === club.id}
                          className={cn(
                            "flex items-center px-4 py-2 rounded-lg transition-all duration-300",
                            club.is_member
                              ? "bg-purple-500/20 text-purple-200 hover:bg-purple-500/30"
                              : "bg-white/20 text-white hover:bg-white/30"
                          )}
                        >
                          {actionLoadingClubId === club.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current"></div>
                          ) : club.is_member ? (
                            <>
                              <Check className="w-4 h-4 mr-2" /> Member
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" /> Join Club
                            </>
                          )}
                        </button>
                      )}
                      
                      {(user?.id === club.created_by || user?.is_admin) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(club)}
                            className="p-2 text-purple-200 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClub(club.id)}
                            disabled={actionLoadingClubId === club.id}
                            className="p-2 text-purple-200 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateClubModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClubCreated={fetchData}
      />

      {editingClub && (
        <EditClubModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingClub(null);
          }}
          club={editingClub}
          onClubUpdated={fetchData}
        />
      )}
    </div>
  );
}
