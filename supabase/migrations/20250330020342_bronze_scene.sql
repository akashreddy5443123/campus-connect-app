/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `is_admin` (boolean)
      - `created_at` (timestamp)
    - `clubs`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `meeting_time` (text)
      - `location` (text)
      - `email` (text)
      - `website` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (date)
      - `time` (text)
      - `location` (text)
      - `club_id` (uuid, references clubs)
      - `capacity` (integer)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)
    - `event_registrations`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Only create policies if they don't exist (wrapped in DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can read all profiles'
  ) THEN
    CREATE POLICY "Users can read all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  meeting_time text,
  location text,
  email text,
  website text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clubs' AND policyname = 'Anyone can read clubs'
  ) THEN
    CREATE POLICY "Anyone can read clubs"
      ON clubs FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clubs' AND policyname = 'Users can create clubs'
  ) THEN
    CREATE POLICY "Users can create clubs"
      ON clubs FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clubs' AND policyname = 'Club creators can update their clubs'
  ) THEN
    CREATE POLICY "Club creators can update their clubs"
      ON clubs FOR UPDATE
      TO authenticated
      USING (auth.uid() = created_by);
  END IF;
END
$$;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time text,
  location text,
  club_id uuid REFERENCES clubs(id),
  capacity integer,
  image_url text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Anyone can read events'
  ) THEN
    CREATE POLICY "Anyone can read events"
      ON events FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Club members can create events'
  ) THEN
    CREATE POLICY "Club members can create events"
      ON events FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = created_by AND
        (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
          OR
          club_id IS NULL OR
          EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = events.club_id
            AND clubs.created_by = auth.uid()
          )
        )
      );
  END IF;
END
$$;

-- Create event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id),
  user_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_registrations' AND policyname = 'Users can read their registrations'
  ) THEN
    CREATE POLICY "Users can read their registrations"
      ON event_registrations FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_registrations' AND policyname = 'Users can register for events'
  ) THEN
    CREATE POLICY "Users can register for events"
      ON event_registrations FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;