import { supabase } from '../src/lib/supabase';

async function clearData() {
  try {
    // Delete from club_memberships first due to foreign key constraints
    const { error: membershipError } = await supabase.from('club_memberships').delete().neq('id', 0);
    if (membershipError) throw membershipError;

    // Delete from clubs
    const { error: clubsError } = await supabase.from('clubs').delete().neq('id', 0);
    if (clubsError) throw clubsError;

    // Delete from events
    const { error: eventsError } = await supabase.from('events').delete().neq('id', 0);
    if (eventsError) throw eventsError;

    // Delete from announcements
    const { error: announcementsError } = await supabase.from('announcements').delete().neq('id', 0);
    if (announcementsError) throw announcementsError;

    console.log('Data cleared successfully');
  } catch (err) {
    console.error('Error clearing data:', err);
  }
}

clearData();
