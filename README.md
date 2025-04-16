# Campus Connect - Event & Club Management App

A modern web application built with React, TypeScript, Vite, Tailwind CSS, and Supabase to manage campus events, clubs, and announcements, featuring role-based permissions and a beautiful, responsive design.

## Features

*   **Modern UI Design:**
    *   Beautiful hero section with background image and search functionality
    *   Clean, card-based layout for events, clubs, and announcements
    *   Responsive design that works on all devices
    *   Consistent white text theme with proper contrast
*   **Homepage:** 
    *   Hero section with search functionality
    *   Featured events with image uploads
    *   Latest announcements
    *   Quick links to event/club directories
*   **Events:** 
    *   Browse upcoming events with image previews
    *   View details on a dedicated page (`/events/:eventId`)
    *   Register/unregister for events
    *   Image upload support for event covers
*   **Clubs:** 
    *   Browse student clubs with cover images
    *   View details and join/leave clubs
    *   Image upload support for club covers
*   **Announcements:** 
    *   View campus announcements
    *   Admins can create announcements
    *   Creators/admins can edit/delete them
*   **Authentication:** 
    *   User sign-up, sign-in, and password reset using Supabase Auth
    *   Secure session management
*   **User Profile:** 
    *   View and edit user profile information
    *   Customizable profile settings
*   **Event/Club Creation:** 
    *   Modals for creating new events and clubs
    *   Image upload support
    *   Rich text descriptions
*   **Search Functionality:**
    *   Global search across events, clubs, and announcements
    *   Real-time search results
    *   Clean, white-text results display
*   **Permissions:**
    *   **Admin Role:** An `is_admin` flag in the `profiles` table grants administrative privileges
    *   **Creator/Admin Control:** Only the user who created an event/club/announcement or an admin can update or delete it
    *   **Admin-Only Creation:** Only admins can create announcements
*   **Notifications:** 
    *   Dropdown menu accessible via the bell icon
    *   Displays the 5 most recent announcements
*   **Footer:** 
    *   Contact information
    *   Social media links
    *   Credits and copyright details

## Project Structure

```
.
├── public/             # Static assets
├── scripts/
│   └── seed.cjs        # Node.js script to seed database (requires Service Role Key)
├── src/
│   ├── components/     # Reusable React components (Header, Footer, Modals, Cards, Dropdowns, etc.)
│   ├── lib/
│   │   └── supabase.ts # Supabase client initialization
│   ├── pages/          # Page-level components (Events, Clubs, Dashboard, EventDetail, etc.)
│   ├── stores/
│   │   └── authStore.ts# Zustand store for authentication state management
│   ├── App.tsx         # Main application component with routing
│   ├── index.css       # Global styles and Tailwind directives
│   └── main.tsx        # Application entry point
├── supabase/           # Supabase local development files
│   └── migrations/     # Database migration SQL files
├── .env                # Environment variables (Supabase URL & Anon Key)
├── index.html          # Main HTML entry point
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # Base TypeScript configuration
├── tsconfig.app.json   # TypeScript configuration for the app
├── tsconfig.node.json  # TypeScript configuration for Node.js scripts
└── vite.config.ts      # Vite build tool configuration
```

## Key Files & Functionality

*   **`src/App.tsx`**: 
    *   Sets up the main layout and routing
    *   Implements the hero section with search
    *   Manages the responsive design
*   **`src/pages/SearchPage.tsx`**: 
    *   Handles global search functionality
    *   Displays search results with white text theme
    *   Organizes results by category (events, clubs, announcements)
*   **`src/components/CreateEventModal.tsx`**: 
    *   Handles event creation with image upload
    *   Rich form validation
*   **`src/components/CreateClubModal.tsx`**: 
    *   Handles club creation with image upload
    *   Form validation and error handling
*   **`src/main.tsx`**: Renders the root React component (`App`) into the DOM. Imports global CSS.
*   **`src/index.css`**: Includes Tailwind CSS base, components, and utilities. Defines global `body` styles for the theme.
*   **`src/lib/supabase.ts`**: Initializes the Supabase client using credentials from `.env`.
*   **`src/stores/authStore.ts`**: Manages user authentication state (user object including `is_admin`, loading status) and provides functions (`signIn`, `signUp`, `signOut`, `resetPassword`, `initializeAuth`) using Zustand.
*   **`src/components/Header.tsx`**: Displays the site title and navigation. Conditionally shows Sign In/Sign Up buttons or the `ProfileDropdown`. Includes the notification bell dropdown fetching recent announcements.
*   **`src/components/Footer.tsx`**: Displays contact information, social media links, credits, and copyright details at the bottom of the application.
*   **`src/components/AuthModal.tsx`**: Handles user Sign In, Sign Up, and Password Reset flows. Interacts with `authStore`.
*   **`src/pages/Events.tsx`**: Fetches events, displays them, handles registration/unregistration, and includes the "Create Event" button. Shows delete button based on creator/admin status.
*   **`src/pages/EventDetailPage.tsx`**: Fetches and displays details for a single event based on the URL parameter. Handles registration/unregistration for the specific event.
*   **`src/pages/Clubs.tsx`**: Fetches and displays clubs, handles joining/leaving. Shows delete button based on creator/admin status.
*   **`src/pages/Announcements.tsx`**: Fetches and displays announcements. Shows "Create Announcement" button for admins. Shows Edit/Delete buttons based on creator/admin status.
*   **`src/components/CreateAnnouncementModal.tsx`**: Modal component used by admins to create new announcements.
*   **`src/pages/UserDashboard.tsx`**: (Assumed functionality) Displays user-specific information.
*   **`src/components/EditProfileModal.tsx`**: (Assumed functionality) Allows users to update their profile information stored in the Supabase `profiles` table.
*   **`supabase/migrations/`**: Contains SQL files defining the database schema changes, including adding `is_admin` to `profiles` and `created_by` to relevant tables.
*   **`scripts/seed.cjs`**: A script to populate the hosted Supabase database with sample clubs and events using the Service Role Key. Run with `node scripts/seed.cjs`.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/campus-connect-app.git
    cd campus-connect-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    *   Create a project on [Supabase](https://supabase.com/)
    *   Run the SQL migrations from `supabase/migrations/`
    *   Set up storage buckets for event and club images
    *   Configure environment variables in `.env`

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

*   Presidency University for the inspiration
*   Supabase for the backend infrastructure
*   All contributors who have helped shape this project
