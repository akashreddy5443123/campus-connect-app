import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { Routes, Route, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Calendar, Users, Search, Bell, ChevronRight, GraduationCap, Trophy, Palette, Laptop } from 'lucide-react';
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
import { cn } from './lib/utils';

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
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-bold text-white mb-8 font-poppins">Quick Links</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Events Calendar Card */}
                    <Link
                      to="/events"
                      className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">Events Calendar</h3>
                        <Calendar className="w-8 h-8 text-blue-200" />
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                          <span className="text-blue-200 text-xs">S</span>
                          <span className="text-blue-200 text-xs">M</span>
                          <span className="text-blue-200 text-xs">T</span>
                          <span className="text-blue-200 text-xs">W</span>
                          <span className="text-blue-200 text-xs">T</span>
                          <span className="text-blue-200 text-xs">F</span>
                          <span className="text-blue-200 text-xs">S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center">
                          {Array.from({ length: 31 }, (_, i) => (
                            <span
                              key={i}
                              className={cn(
                                "text-sm py-1 rounded-lg",
                                i + 1 === new Date().getDate()
                                  ? "bg-white text-blue-600 font-medium"
                                  : "text-blue-100"
                              )}
                            >
                              {i + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-blue-100 mb-4">Discover exciting happenings around campus</p>
                      <div className="flex items-center text-blue-100 group-hover:text-white transition-colors">
                        Check it out <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>

                    {/* Clubs Directory Card */}
                    <Link
                      to="/clubs"
                      className="group bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">Clubs Directory</h3>
                        <Users className="w-8 h-8 text-purple-200" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                          <GraduationCap className="w-6 h-6 text-purple-200 mb-2" />
                          <span className="text-sm text-purple-100">Academic</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                          <Trophy className="w-6 h-6 text-purple-200 mb-2" />
                          <span className="text-sm text-purple-100">Sports</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                          <Palette className="w-6 h-6 text-purple-200 mb-2" />
                          <span className="text-sm text-purple-100">Arts</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                          <Laptop className="w-6 h-6 text-purple-200 mb-2" />
                          <span className="text-sm text-purple-100">Tech</span>
                        </div>
                      </div>
                      <p className="text-purple-100 mb-4">Find your tribe and unlock your potential</p>
                      <div className="flex items-center text-purple-100 group-hover:text-white transition-colors">
                        Browse clubs <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>

                    {/* Announcements Card */}
                    <Link
                      to="/announcements"
                      className="group bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">Announcements</h3>
                        <Bell className="w-8 h-8 text-red-200" />
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-red-200">Latest Updates</span>
                            <span className="text-xs text-red-200">Today</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 rounded-full bg-red-200 mt-1.5" />
                            <p className="text-sm text-red-100 line-clamp-2">Stay updated with the latest campus news and important announcements</p>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-red-200">Categories</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-red-100 bg-white/10 px-2 py-1 rounded-lg">Academic</span>
                            <span className="text-xs text-red-100 bg-white/10 px-2 py-1 rounded-lg">Events</span>
                            <span className="text-xs text-red-100 bg-white/10 px-2 py-1 rounded-lg">Campus</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-red-100 mb-4">Stay in the loop with the latest updates</p>
                      <div className="flex items-center text-red-100 group-hover:text-white transition-colors">
                        Stay updated <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </div>
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
