/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface CustomerReview {
  id: string;
  name: string;
  role: string;
  text: string;
  stars: number;
  image: string;
  created_at?: string;
}

// Hardcoded highly elegant seed reviews as absolute fallback or initial display
export const MOCK_TESTIMONIALS: CustomerReview[] = [
  {
    id: 'seed-1',
    text: "Getting high-quality Fisherman Soup and yellow garri on a student budget felt impossible. With JDH Kitchen's pool model, my entire floor gets chef meals delivered hot right to the hostel gate. It was green-lit on Wednesday!",
    name: "Amara Okafor",
    role: "Moremi Hall President",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    stars: 5,
  },
  {
    id: 'seed-2',
    text: "The zero-waste refund model is brilliant. I ordered the Peppered Gizzard Platter, we missed the threshold by 3 orders, and my wallet was automatically credited instantly. No hassle, no lost funds. Big props to this system.",
    name: "Tunde Balogun",
    role: "Engineering • Year 4",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    stars: 5,
  },
  {
    id: 'seed-3',
    text: "Best catering website on campus, hands down! The UI is exceptionally clean, ordering is smooth, and the food tastes authentic. Group delivery is always on time, which helps me optimize my study schedule.",
    name: "Fatimah Yusuf",
    role: "Eni Njoku Hostel",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    stars: 5,
  }
];

export const reviewsService = {
  /**
   * Fetches reviews ordered by created_at descending.
   * If supabase is offline or table is not accessible, falls back to MOCK_TESTIMONIALS.
   */
  async getReviews(): Promise<CustomerReview[]> {
    if (!isSupabaseConfigured) {
      return MOCK_TESTIMONIALS;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch online reviews:', error.message);
        return MOCK_TESTIMONIALS;
      }

      if (!data || data.length === 0) {
        return MOCK_TESTIMONIALS;
      }

      // Combine database reviews with our seed testimonials so we always have a healthy pool
      const mappedReviews: CustomerReview[] = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        text: r.text,
        stars: r.stars || 5,
        image: r.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        created_at: r.created_at
      }));

      // Return database reviews first, then append seed reviews to ensure continuous pagination/carousel
      return [...mappedReviews, ...MOCK_TESTIMONIALS];
    } catch (err) {
      console.error('Error fetching reviews:', err);
      return MOCK_TESTIMONIALS;
    }
  },

  /**
   * Uploads review avatar/image to Supabase Storage 'reviewer-avatars' bucket.
   */
  async uploadAvatar(file: File): Promise<string> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase storage not configured.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('reviewer-avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('reviewer-avatars')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to retrieve public URL of uploaded avatar.');
    }

    return publicUrlData.publicUrl;
  },

  /**
   * Submits a new review to Supabase.
   */
  async submitReview(review: Omit<CustomerReview, 'id' | 'created_at'>): Promise<CustomerReview> {
    if (!isSupabaseConfigured) {
      // Local addition helper for frontend simulation if offline
      const simulated: CustomerReview = {
        id: `simulated-${Date.now()}`,
        ...review,
        created_at: new Date().toISOString()
      };
      return simulated;
    }

    const { data, error } = await (supabase as any)
      .from('customer_reviews')
      .insert([review])
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned on saving review.');
    }

    const r = data[0];
    return {
      id: r.id,
      name: r.name,
      role: r.role,
      text: r.text,
      stars: r.stars || 5,
      image: r.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      created_at: r.created_at
    };
  }
};
