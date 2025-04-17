import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Import supabase
import { Trash2 } from 'lucide-react';

// Define types for data
interface ClubMembership {
  id: string;
  user_id: string;
  club_id: string;
  joined_at: string;
  user_full_name: string; // Added from join
  club_name: string;      // Added from join
  role: string;
}

export function AdminDashboard() {
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubMemberships = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch memberships and join with users and clubs tables
        const { data, error } = await supabase
          .from('club_memberships')
          .select(`
            id,
            user_id,
            club_id,
            role,
            joined_at,
            user:profiles ( full_name ),
            club:clubs ( name )
          `)
          .order('name', { foreignTable: 'clubs', ascending: true })
          .order('joined_at', { ascending: true });

        if (error) throw error;

        // Format the data to match ClubMembership interface
        const formattedData = data?.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          club_id: item.club_id,
          joined_at: item.joined_at,
          // Access nested data safely
          user_full_name: item.user?.full_name || 'Unknown User',
          club_name: item.club?.name || 'Unknown Club',
          role: item.role,
        })) || [];

        setMemberships(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load club memberships');
        console.error("Error fetching memberships:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubMemberships();
  }, []);

  const handleRemoveMember = async (id: string, userFullName: string, clubName: string) => {
    setActionLoadingId(id);
    try {
      const { data, error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMemberships((prevMemberships) =>
        prevMemberships.filter((member) => member.id !== id)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      console.error("Error removing member:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>

      {/* Club Memberships Table */}
      <div className="bg-white/90 p-6 rounded-lg shadow-md backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Club Memberships</h2>
        {loading ? (
          <p className="text-gray-500">Loading memberships...</p>
        ) : error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : memberships.length === 0 ? (
          <p className="text-gray-500">No club memberships found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberships.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.club_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.user_full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(member.joined_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user_full_name, member.club_name)}
                        disabled={actionLoadingId === member.id}
                        className={`text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Remove Member"
                      >
                        {actionLoadingId === member.id ? (
                          'Removing...'
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add more admin sections/components here as needed */}
    </div>
  );
}
