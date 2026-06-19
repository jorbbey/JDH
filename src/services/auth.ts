/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database, UserRole } from '../types/database.types';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Fallback user state for sandboxed preview experience when Supabase is not connected
const MOCK_USER = {
  id: 'mock-student-id-12345',
  email: 'student@campus.edu',
  role: 'student' as UserRole,
  full_name: 'Damilola Adebayo',
  phone: '+234 812 345 6789',
  hostel_name: 'Moremi Hall',
  room_number: 'B204',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const getStoredMockUser = () => {
  if (typeof window === 'undefined') return MOCK_USER;
  const stored = localStorage.getItem('campus_feast_mock_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }
  return MOCK_USER;
};

const setStoredMockUser = (user: any) => {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('campus_feast_mock_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('campus_feast_mock_user');
    }
  }
};

/**
 * Handles all Authentication and User Profile operations
 */
export const authService = {
  /**
   * Register a new student or administrator
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    hostelName?: string,
    roomNumber?: string
  ) {
    if (!isSupabaseConfigured) {
      console.info('Supabase unconfigured, simulating local developer registration');
      const newUser = {
        id: `mock-user-${Date.now()}`,
        email,
        role: (email.toLowerCase().includes('admin') ? 'admin' : 'student') as UserRole,
        full_name: fullName,
        phone: phone || null,
        hostel_name: hostelName || null,
        room_number: roomNumber || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setStoredMockUser(newUser);
      return { data: { user: { id: newUser.id, email } }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          hostel_name: hostelName,
          room_number: roomNumber,
        },
      },
    });

    return { data, error };
  },

  /**
   * Log into the platform
   */
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      if (email.toLowerCase().includes('admin')) {
        console.info('Supabase unconfigured, logging in as dummy admin');
        const adminUser = {
          id: 'mock-admin-id-999',
          email: email,
          role: 'admin' as UserRole,
          full_name: 'Executive Chef Admin',
          phone: '+234 801 111 2222',
          hostel_name: 'Kitchen HQ',
          room_number: 'Suite A',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setStoredMockUser(adminUser);
        return {
          data: {
            user: { id: adminUser.id, email },
            session: { access_token: 'dummy-token' },
          },
          error: null,
        };
      }
      console.info('Supabase unconfigured, logging in as dummy student');
      const studentUser = {
        id: 'mock-student-id-12345',
        email: email || 'student@campus.edu',
        role: 'student' as UserRole,
        full_name: 'Damilola Adebayo',
        phone: '+234 812 345 6789',
        hostel_name: 'Moremi Hall',
        room_number: 'B204',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setStoredMockUser(studentUser);
      return {
        data: {
          user: { id: studentUser.id, email: studentUser.email },
          session: { access_token: 'dummy-token' },
        },
        error: null,
      };
    }

    return await supabase.auth.signInWithPassword({ email, password });
  },

  /**
   * Terminate current session
   */
  async signOut() {
    if (!isSupabaseConfigured) {
      setStoredMockUser(null);
      return { error: null };
    }
    return await supabase.auth.signOut();
  },

  /**
   * Get the active session metadata
   */
  async getSession() {
    if (!isSupabaseConfigured) {
      return { data: { session: null }, error: null };
    }
    return await supabase.auth.getSession();
  },

  /**
   * Retrieve the complete profile of the authenticated user
   */
  async getCurrentProfile(): Promise<ProfileRow | null> {
    if (!isSupabaseConfigured) {
      return getStoredMockUser();
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return null;

    const { data: profile, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.info('Profile missing from database. Auto-creating profile for authenticated user...');
        const email = authData.user.email || '';
        const role: UserRole = (email.toLowerCase().includes('admin') || email === 'admin@jdhkitchen.com') ? 'admin' : 'student';
        const fullName = authData.user.user_metadata?.full_name || email.split('@')[0] || 'User';
        const hostelName = authData.user.user_metadata?.hostel_name || 'N/A';
        const roomNumber = authData.user.user_metadata?.room_number || 'N/A';
        const phone = authData.user.user_metadata?.phone || '';

        const { data: newProfile, error: insertError } = await (supabase as any)
          .from('profiles')
          .insert({
            id: authData.user.id,
            role,
            full_name: fullName,
            email,
            phone,
            hostel_name: hostelName,
            room_number: roomNumber
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          console.info('Auto-created missing profile successfully:', newProfile);
          return newProfile;
        } else {
          console.error('Failed to auto-create missing profile:', insertError);
        }
      }
      console.error('Error fetching profile:', error);
      return null;
    }

    if (profile && profile.role !== 'admin' && profile.email && profile.email.toLowerCase().includes('admin')) {
      console.info('Auto-promoting user to admin role:', profile.email);
      const { data: updatedProfile, error: updateErr } = await (supabase as any)
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', authData.user.id)
        .select()
        .single();
      
      if (!updateErr && updatedProfile) {
        return updatedProfile;
      }
    }

    return profile;
  },

  /**
   * Update student delivery location parameters
   */
  async updateProfile(updates: ProfileUpdate): Promise<{ data: ProfileRow | null; error: any }> {
    if (!isSupabaseConfigured) {
      Object.assign(MOCK_USER, updates, { updated_at: new Date().toISOString() });
      return { data: MOCK_USER, error: null };
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return { data: null, error: new Error('User not logged in') };
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', authData.user.id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Subscribes to authenticating flow events
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured) {
      // Return a dummy unsubscribe routine for development
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};
