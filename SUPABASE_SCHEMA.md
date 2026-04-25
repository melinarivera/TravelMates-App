# TripMates – Supabase Database Schema

Ejecuta este SQL en el **SQL Editor** de tu proyecto Supabase.

```sql
-- ============================================================
-- TRIPMATES DATABASE SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (auto-created on auth.users insert)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trips (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  destination  TEXT,
  description  TEXT,
  start_date   DATE,
  end_date     DATE,
  status       TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'done')),
  cover_url    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIP MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trip_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id   UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role      TEXT DEFAULT 'invitado' CHECK (role IN ('titular', 'invitado')),
  status    TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(10,2) NOT NULL,
  category     TEXT DEFAULT 'Otros',
  paid_by      UUID REFERENCES auth.users(id),
  split_with   UUID[],
  receipt_url  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ITINERARY ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.itinerary_activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_date    DATE,
  time        TIME,
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  type        TEXT DEFAULT 'activity' CHECK (type IN ('activity', 'food', 'transport', 'accommodation')),
  source      TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'voting')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_votes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES public.itinerary_activities(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote        TEXT CHECK (vote IN ('up', 'down')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- ============================================================
-- POINTS OF INTEREST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pois (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  type       TEXT DEFAULT 'Otro',
  address    TEXT,
  lat        NUMERIC(10,6),
  lng        NUMERIC(10,6),
  maps_url   TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_activities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages         ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ------------------------------------------------------------
-- Trips
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "trips_select" ON public.trips;
CREATE POLICY "trips_select" ON public.trips FOR SELECT
  USING (auth.uid() = owner_id OR id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "trips_insert" ON public.trips;
CREATE POLICY "trips_insert" ON public.trips FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "trips_update" ON public.trips;
CREATE POLICY "trips_update" ON public.trips FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "trips_delete" ON public.trips;
CREATE POLICY "trips_delete" ON public.trips FOR DELETE USING (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- Trip members
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "trip_members_select" ON public.trip_members;
CREATE POLICY "trip_members_select" ON public.trip_members FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trip_members_insert" ON public.trip_members;
CREATE POLICY "trip_members_insert" ON public.trip_members FOR INSERT
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "trip_members_delete" ON public.trip_members;
CREATE POLICY "trip_members_delete" ON public.trip_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND owner_id = auth.uid()));

-- ------------------------------------------------------------
-- Expenses
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = expenses.trip_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = expenses.trip_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Itinerary
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "itinerary_select" ON public.itinerary_activities;
CREATE POLICY "itinerary_select" ON public.itinerary_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = itinerary_activities.trip_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "itinerary_insert" ON public.itinerary_activities;
CREATE POLICY "itinerary_insert" ON public.itinerary_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "itinerary_update" ON public.itinerary_activities;
CREATE POLICY "itinerary_update" ON public.itinerary_activities FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "itinerary_delete" ON public.itinerary_activities;
CREATE POLICY "itinerary_delete" ON public.itinerary_activities FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND owner_id = auth.uid()));

-- ------------------------------------------------------------
-- Votes
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "votes_select" ON public.activity_votes;
CREATE POLICY "votes_select" ON public.activity_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "votes_upsert" ON public.activity_votes;
CREATE POLICY "votes_upsert" ON public.activity_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_update" ON public.activity_votes;
CREATE POLICY "votes_update" ON public.activity_votes FOR UPDATE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- POIs
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "pois_select" ON public.pois;
CREATE POLICY "pois_select" ON public.pois FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = pois.trip_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "pois_insert" ON public.pois;
CREATE POLICY "pois_insert" ON public.pois FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pois_delete" ON public.pois;
CREATE POLICY "pois_delete" ON public.pois FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND owner_id = auth.uid()));

-- ------------------------------------------------------------
-- Chat
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "chat_select" ON public.chat_messages;
CREATE POLICY "chat_select" ON public.chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = chat_messages.trip_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "chat_insert" ON public.chat_messages;
CREATE POLICY "chat_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
```
