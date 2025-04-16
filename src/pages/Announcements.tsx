import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../types/supabase'
import { Button } from '../components/ui/button'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { CreateAnnouncementModal } from '../components/CreateAnnouncementModal'
import { EditAnnouncementModal } from '../components/EditAnnouncementModal'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Announcement = Database['public']['Tables']['announcements']['Row']

// Define the payload types more precisely
type AnnouncementChanges = RealtimePostgresChangesPayload<{
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by?: string;
  priority?: boolean;
}>

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin || false

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToAnnouncements = () => {
    const subscription = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        (payload: AnnouncementChanges) => {
          if (payload.eventType === 'INSERT') {
            setAnnouncements(prev => [payload.new as Announcement, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev => prev.filter(ann => ann.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setAnnouncements(prev => 
              prev.map(ann => ann.id === payload.new.id ? payload.new as Announcement : ann)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  useEffect(() => {
    fetchData()
    const unsubscribe = subscribeToAnnouncements()
    return () => {
      unsubscribe()
    }
  }, [])

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Announcement deleted successfully')
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`p-4 rounded-lg shadow ${
              announcement.priority ? 'bg-red-50 border border-red-200' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{announcement.title}</h3>
                <p className="text-gray-600 mt-2">{announcement.message}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Posted on {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </div>
              {isAdmin && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(announcement)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateAnnouncementModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showEditModal && selectedAnnouncement && (
        <EditAnnouncementModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedAnnouncement(null)
          }}
          announcement={selectedAnnouncement}
        />
      )}
    </div>
  )
}
