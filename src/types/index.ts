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
  created_at: string;
}

export interface TripItem {
  id: string;
  trip_id: string;
  experience_id: string | null;
  location_id: string | null;
  experience_title: string | null;
  experience_location: string | null;
  experience_image: string | null;
  experience_category: string | null;
  day_number: number;
  time_slot: TimeSlot;
  note: string | null;
  sort_order: number;
  // joined via select('*, locations(...)')
  locations?: {
    name: string;
    category: string | null;
    hint: string | null;
    cover_image: string | null;
    district: string | null;
    address: string | null;
  } | null;
}

export interface Location {
  id: string;
  name: string;
  category: string;
  vibes: string[];
  hint: string | null;
  description: string | null;
  short_description: string | null;
  cover_image: string | null;
  images: string[];
  price_per_person: number;
  duration_minutes: number;
  rating: number | null;
  address: string | null;
  district: string | null;
  city: string | null;
  coordinates: { lat: number; lng: number } | null;
  opening_hours: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
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
