import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Globe, MapPin, Calendar, Plus, Check, X, Pencil, Trash2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { shallow } from 'zustand/shallow';
import { CreateClubModal } from '../components/CreateClubModal';
import { EditClubModal } from '../components/EditClubModal';

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
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingClubId, setActionLoadingClubId] = useState<string | null>(null);

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
  // Include fetchData in the dependency array
  }, [fetchData]); // Depend only on the memoized fetchData

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

  // Loading State - Show only if loading AND no clubs exist yet
  if (loading && clubs.length === 0) return <div className="text-center py-10">Loading clubs...</div>;
  if (error) return <div className="text-center py-10 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Clubs Directory</h1>
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" /> Create Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubsWithMembership.map((club) => (
          <div key={club.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            {/* Club image with error handling */}
            <div className="relative h-48">
              <img 
                src={club.image_url || '/default-club.jpg'} 
                alt={club.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/default-club.jpg';
                }}
              />
              <div className="absolute top-2 right-2">
                <span className="bg-white/90 text-indigo-600 text-xs font-medium px-2.5 py-0.5 rounded">
                  {club.category}
                </span>
              </div>
            </div>
            
            {/* Club info */}
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{club.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{club.description}</p>
              
              {/* Meeting details */}
              <div className="space-y-2 mb-4">
                {club.meeting_time && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{club.meeting_time}</span>
                  </div>
                )}
                {club.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{club.location}</span>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <Link 
                  to={`/clubs/${club.id}`} 
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Learn More
                </Link>
                {user && (
                  <button 
                    onClick={() => club.is_member ? handleLeave(club.id) : handleJoin(club.id)}
                    disabled={actionLoadingClubId === club.id}
                    className={`px-4 py-2 rounded-md text-sm ${
                      club.is_member 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {actionLoadingClubId === club.id 
                      ? 'Loading...' 
                      : club.is_member 
                        ? 'Joined Club' 
                        : 'Join Club'
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateClubModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); fetchData(); }} />
      <EditClubModal isOpen={isEditModalOpen} club={editingClub} onClose={() => { setIsEditModalOpen(false); setEditingClub(null); fetchData(); }} />

      {/* Removed invalid <style jsx> block. Apply Tailwind classes directly. */}
    </div>
  );
}
