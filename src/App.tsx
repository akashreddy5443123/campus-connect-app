import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { Routes, Route, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Calendar, Users, Search, Bell, ChevronRight } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer'; // Import Footer
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore'; // Import auth store
import { Events } from './pages/Events';
import { Clubs } from './pages/Clubs';
import { EventsAndClubs } from './pages/EventsAndClubs';
import { UserDashboard } from './pages/UserDashboard';
import Announcements from './pages/Announcements'; // Updated import
import { SearchPage } from './pages/SearchPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { AdminDashboard } from './pages/AdminDashboard'; // Import AdminDashboard
import { ProtectedRoute } from './components/ProtectedRoute'; // Import ProtectedRoute

// Define Announcement type
interface Announcement {
  id: string;
  title: string;
  message: string; // Changed content to message
  created_at: string;
}

// Define Event type for featured events (adjust as needed based on your actual schema)
interface FeaturedEvent {
  id: string;
  title: string;
  date: string;
  image_url: string | null;
  club: {
    name: string;
  }[] | null;
  category?: string; // Add category if needed for filtering
}


function App() {
  const { user } = useAuthStore(); // Get user from auth store
  // State for announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  // State for featured events
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([]);
  const [loadingFeaturedEvents, setLoadingFeaturedEvents] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const navigate = useNavigate(); // Hook for navigation

  // Add state for statistics
  const [stats, setStats] = useState({
    clubCount: 0,
    eventCount: 0,
    memberCount: 0,
    loading: true
  });

  // Add state for event dates
  const [eventDates, setEventDates] = useState<{
    date: string;
    isPast: boolean;
  }[]>([]);

  // Function to fetch statistics
  const fetchStats = async () => {
    try {
      // Get total number of clubs
      const { count: clubCount, error: clubError } = await supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true });

      if (clubError) throw clubError;

      // Get total number of upcoming events in current month
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
      
      const { count: eventCount, error: eventError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth);

      if (eventError) throw eventError;

      // Get total number of unique users (members)
      const { count: memberCount, error: memberError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (memberError) throw memberError;

      setStats({
        clubCount: clubCount || 0,
        eventCount: eventCount || 0,
        memberCount: memberCount || 0,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Function to fetch event dates
  const fetchEventDates = async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('events')
        .select('date')
        .gte('date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      // Format dates and check if they're past
      const formattedDates = (data || []).map(event => ({
        date: new Date(event.date).getDate().toString(),
        isPast: new Date(event.date) < today
      }));

      setEventDates(formattedDates);
    } catch (error) {
      console.error('Error fetching event dates:', error);
    }
  };

  // Fetch announcements and featured events on component mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, message, created_at') // Select message instead of *
          .order('created_at', { ascending: false }) // Get latest first
          .limit(3); // Limit to 3 for the homepage preview

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        // Handle error display if needed
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    const fetchFeaturedEvents = async () => {
      setLoadingFeaturedEvents(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            date,
            image_url,
            club:clubs ( name )
          `)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(3);

        if (error) throw error;
        setFeaturedEvents(data || []);
      } catch (error) {
        console.error('Error fetching featured events:', error);
        setFeaturedEvents([]);
      } finally {
        setLoadingFeaturedEvents(false);
      }
    };

    fetchAnnouncements();
    fetchFeaturedEvents();
    fetchStats(); // Add this line
    fetchEventDates(); // Add this line

    // Set up real-time subscription for stats
    const clubsSubscription = supabase
      .channel('clubs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, fetchStats)
      .subscribe();

    const eventsSubscription = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchStats)
      .subscribe();

    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .subscribe();

    return () => {
      clubsSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
    };
  }, []);

  // Helper function to get date status
  const getDateStatus = (day: number) => {
    const event = eventDates.find(e => parseInt(e.date) === day);
    if (!event) return 'normal';
    return event.isPast ? 'past' : 'upcoming';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col">
              {/* Hero Section */}
              <section className="h-[60vh] relative overflow-hidden bg-gradient-to-br from-[#16213E] via-[#0F3460] to-[#533483]">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a2e]/50 to-[#1a1a2e]"></div>
                
                {/* Left decorative image */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 opacity-20 hidden lg:block">
                  <img 
                    src="/campus-life-1.png" 
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Right decorative image */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 opacity-20 hidden lg:block">
                  <img 
                    src="/campus-life-2.png" 
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center px-4">
                  <div className="max-w-4xl w-full text-center">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white font-poppins leading-tight">
                      Discover Your Campus Vibe
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-12 font-light max-w-2xl mx-auto">
                      Connect with events, clubs, and exciting opportunities
                    </p>
                    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search events, clubs, or activities..."
                        className="w-full pl-6 pr-12 py-4 rounded-full bg-white/10 backdrop-blur-md text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#533483] focus:border-transparent shadow-lg text-lg"
                      />
                      <button
                        type="submit"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                        aria-label="Search"
                      >
                        <Search className="h-6 w-6" />
                      </button>
                    </form>
                  </div>
                </div>
              </section>

              {/* Quick Links Section */}
              <section className="py-16 px-4 bg-[#1a1a2e]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Link
                    to="/events"
                    className="group rounded-xl text-white hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-blue-500/25 overflow-hidden"
                  >
                    {/* Calendar Design */}
                    <div className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] p-6">
                      {/* Calendar Header */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-t-lg p-4 text-center border-b border-white/20">
                        <h2 className="text-2xl font-bold">Events Calendar</h2>
                      </div>
                      
                      {/* Calendar Body */}
                      <div className="bg-white/5 backdrop-blur-sm rounded-b-lg p-4">
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-4">
                          {/* Weekday Headers */}
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-blue-200 py-1">
                              {day}
                            </div>
                          ))}
                          
                          {/* Calendar Days */}
                          {[...Array(31)].map((_, i) => {
                            const day = i + 1;
                            const status = getDateStatus(day);
                            return (
                              <div 
                                key={i} 
                                className={`text-center text-sm py-2 rounded transition-colors ${
                                  status === 'upcoming' 
                                    ? 'bg-blue-500/30 text-white font-medium' 
                                    : status === 'past'
                                    ? 'bg-green-500/30 text-white font-medium'
                                    : day === new Date().getDate()
                                    ? 'bg-white/20 font-bold'
                                    : 'text-white/70'
                                }`}
                              >
                                {day}
                                {(status === 'upcoming' || status === 'past') && (
                                  <div className="w-1 h-1 rounded-full mx-auto mt-1 bg-current opacity-70" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-blue-500/30" />
                            <span>Upcoming</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-green-500/30" />
                            <span>Past</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-white/20" />
                            <span>Today</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-blue-100 mb-4">Discover exciting happenings around campus</p>
                        
                        {/* Action Button */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center group-hover:text-white transition-colors">
                            Check it out <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <div className="bg-white/10 rounded-full p-2 group-hover:bg-white/20 transition-colors">
                            <Calendar className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/clubs"
                    className="group bg-gradient-to-br from-[#533483] to-[#4c2885] rounded-xl p-8 text-white hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-purple-500/25"
                  >
                    <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                      <Users className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Clubs Directory</h2>
                    <p className="text-purple-100 mb-6">Find your tribe and unlock your potential</p>
                    <div className="text-sm font-medium flex items-center">
                      Browse clubs <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>

                  <Link
                    to="/announcements"
                    className="group bg-gradient-to-br from-[#E94560] to-[#c81d4c] rounded-xl p-8 text-white hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-pink-500/25"
                  >
                    <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                      <Bell className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Announcements</h2>
                    <p className="text-pink-100 mb-6">Stay in the loop with the latest updates</p>
                    <div className="text-sm font-medium flex items-center">
                      Stay updated <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              </section>

              {/* Featured Events Section */}
              <section className="py-16 px-4 bg-[#16213E]">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-bold text-white mb-8 font-poppins">Featured Events</h2>
                  <div className="bg-[#1a1a2e]/50 backdrop-blur-md rounded-xl p-8 shadow-xl">
                    {loadingFeaturedEvents ? (
                      <p className="text-gray-300">Loading events...</p>
                    ) : featuredEvents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredEvents.map((event) => (
                          <Link 
                            key={event.id} 
                            to={`/events/${event.id}`}
                            className="block bg-[#1a1a2e]/50 rounded-lg p-4 hover:bg-[#1a1a2e]/70 transition-colors"
                          >
                            <div className="aspect-video rounded-lg overflow-hidden mb-4">
                              <img 
                                src={event.image_url || '/default-event.jpg'} 
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                            <p className="text-gray-300">{new Date(event.date).toLocaleDateString()}</p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-300 text-center py-8">No upcoming events featured at the moment.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Statistics Section */}
              <section className="py-16 px-4 bg-gradient-to-b from-[#16213E] to-[#1a1a2e]">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-bold text-white text-center mb-12 font-poppins">Join Thousands of Students</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="bg-[#1a1a2e]/50 rounded-xl p-8 backdrop-blur-md shadow-xl border border-white/5">
                      <p className="text-4xl font-bold text-white mb-2">
                        {stats.loading ? (
                          <span className="inline-block w-12 h-8 bg-[#533483]/50 animate-pulse rounded"></span>
                        ) : (
                          `${stats.clubCount}+`
                        )}
                      </p>
                      <p className="text-gray-300">Active Clubs</p>
                    </div>
                    <div className="bg-[#1a1a2e]/50 rounded-xl p-8 backdrop-blur-md shadow-xl border border-white/5">
                      <p className="text-4xl font-bold text-white mb-2">
                        {stats.loading ? (
                          <span className="inline-block w-12 h-8 bg-[#533483]/50 animate-pulse rounded"></span>
                        ) : (
                          `${stats.eventCount}+`
                        )}
                      </p>
                      <p className="text-gray-300">Events Monthly</p>
                    </div>
                    <div className="bg-[#1a1a2e]/50 rounded-xl p-8 backdrop-blur-md shadow-xl border border-white/5">
                      <p className="text-4xl font-bold text-white mb-2">
                        {stats.loading ? (
                          <span className="inline-block w-12 h-8 bg-[#533483]/50 animate-pulse rounded"></span>
                        ) : (
                          `${stats.memberCount}+`
                        )}
                      </p>
                      <p className="text-gray-300">Student Members</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer Info */}
              <section className="py-16 px-4 bg-[#1a1a2e]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2 font-poppins">Presidency University</h2>
                    <p className="text-gray-300">Connect, Learn, Grow</p>
                  </div>
                  <div className="flex gap-8 mt-8 md:mt-0">
                    <Link to="/about" className="text-gray-300 hover:text-white transition-colors">About</Link>
                    <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</Link>
                    <Link to="/support" className="text-gray-300 hover:text-white transition-colors">Support</Link>
                  </div>
                </div>
              </section>
            </div>
          } />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} /> {/* Add route for event detail */}
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:clubId" element={<ClubDetailPage />} /> {/* Add route for club detail */}
          <Route path="/announcements" element={<Announcements />} /> {/* Add route for announcements */}
          <Route path="/search" element={<SearchPage />} /> {/* Add route for search results */}
          <Route path="/events-and-clubs" element={<EventsAndClubs />} />
          <Route path="/dashboard" element={<UserDashboard />} />

          {/* Admin Route */}
          <Route element={<ProtectedRoute isAdminRoute={true} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>
      <Footer /> {/* Add Footer component here */}
    </div>
  );
}

export default App;
