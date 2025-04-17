import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface RealtimeState {
  subscribeToEvents: () => void;
  subscribeToClubs: () => void;
  subscribeToAnnouncements: () => void;
  unsubscribeAll: () => void;
  onEventsChange: ((callback: (payload: any) => void) => void) | null;
  onClubsChange: ((callback: (payload: any) => void) => void) | null;
  onAnnouncementsChange: ((callback: (payload: any) => void) => void) | null;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => {
  let eventsSubscription: ReturnType<typeof supabase.channel> | null = null;
  let clubsSubscription: ReturnType<typeof supabase.channel> | null = null;
  let announcementsSubscription: ReturnType<typeof supabase.channel> | null = null;
  let eventsCallback: ((payload: any) => void) | null = null;
  let clubsCallback: ((payload: any) => void) | null = null;
  let announcementsCallback: ((payload: any) => void) | null = null;

  return {
    onEventsChange: (callback) => {
      eventsCallback = callback;
    },
    onClubsChange: (callback) => {
      clubsCallback = callback;
    },
    onAnnouncementsChange: (callback) => {
      announcementsCallback = callback;
    },
    subscribeToEvents: () => {
      if (eventsSubscription) return;

      eventsSubscription = supabase.channel('events-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events'
          },
          (payload) => {
            if (eventsCallback) {
              eventsCallback(payload);
            }
          }
        )
        .subscribe();
    },
    subscribeToClubs: () => {
      if (clubsSubscription) return;

      clubsSubscription = supabase.channel('clubs-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'clubs'
          },
          (payload) => {
            if (clubsCallback) {
              clubsCallback(payload);
            }
          }
        )
        .subscribe();
    },
    subscribeToAnnouncements: () => {
      if (announcementsSubscription) return;

      announcementsSubscription = supabase.channel('announcements-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'announcements'
          },
          (payload) => {
            if (announcementsCallback) {
              announcementsCallback(payload);
            }
          }
        )
        .subscribe();
    },
    unsubscribeAll: () => {
      if (eventsSubscription) {
        eventsSubscription.unsubscribe();
        eventsSubscription = null;
      }
      if (clubsSubscription) {
        clubsSubscription.unsubscribe();
        clubsSubscription = null;
      }
      if (announcementsSubscription) {
        announcementsSubscription.unsubscribe();
        announcementsSubscription = null;
      }
    }
  };
}); 