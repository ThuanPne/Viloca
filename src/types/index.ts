export type ExperienceCategory = 'food_tour' | 'workshop' | 'trekking' | 'cultural';
export type TripStatus = 'planning' | 'active' | 'completed';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface Experience {
  id: string;
  title: string;
  location: string;
  category: ExperienceCategory;
  price: number;
  rating: number;
  reviewCount: number;
  durationHours: number;
  coverImage: string;
  guideName: string;
  guideAvatar: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  city: string | null;
  category: string;
  vibes: string[];
  price_per_person: number;
  duration_minutes: number;
  rating: number | null;
  hint: string | null;
  cover_image: string | null;
  images: string[];
  description: string | null;
  short_description: string | null;
  opening_hours: string | null;
  coordinates: { lat: number; lng: number } | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  travel_style: string[];
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image: string | null;
  status: TripStatus;
  summary_note: string | null;
  is_ai_generated: boolean;
  created_at: string;
}

export interface TripItem {
  id: string;
  trip_id: string;
  location_id: string | null;
  experience_id: string | null;
  experience_title: string | null;
  experience_location: string | null;
  experience_image: string | null;
  experience_category: string | null;
  day_number: number;
  time_slot: TimeSlot;
  visit_time: string | null;
  note: string | null;
  ai_reason: string | null;
  sort_order: number;
  // Populated when queried with .select('*, locations(name,category,hint,cover_image,district)')
  locations?: {
    name: string;
    category: string;
    hint: string | null;
    cover_image: string | null;
    district: string | null;
  } | null;
}

export type BookmarkStatus = 'want' | 'planned' | 'done';

export interface Bookmark {
  id: string;
  user_id: string;
  experience_id: string;
  status: BookmarkStatus;
  created_at: string;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  name: string;
  is_packed: boolean;
  category: string;
  sort_order: number;
  created_at: string;
}

export interface TripJournal {
  id: string;
  trip_id: string;
  day_number: number;
  content: string;
  photos: string[];
  mood: 'great' | 'good' | 'okay' | 'tired' | null;
  weather: 'sunny' | 'rainy' | 'cloudy' | null;
  created_at: string;
}
