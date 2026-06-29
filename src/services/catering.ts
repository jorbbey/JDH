/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database, CateringStatus } from '../types/database.types';

export type CateringRequestRow = Database['public']['Tables']['catering_requests']['Row'];
export type CateringRequestInsert = Database['public']['Tables']['catering_requests']['Insert'];

export interface CateringDetailedItem extends CateringRequestRow {
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

const MOCK_CATERINGS: CateringDetailedItem[] = [
  {
    id: 'cat-001',
    user_id: 'mock-student-id-12345',
    event_name: 'Moremi Hall 3rd Block Birthday Banquet',
    event_date: '2026-07-20T17:00:00Z',
    estimated_guests: 55,
    special_instructions: 'Need large pots of Jollof Rice, Goat Meat pies, Coleslaw, and Hibiscus (Zobo) mocktail options.',
    status: 'pending' as CateringStatus,
    quoted_price: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      full_name: 'Damilola Adebayo',
      email: 'student@campus.edu',
      phone: '+234 703 891 2407',
    },
  },
];

export interface CateringRequestInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  event_name: string;
  event_date: string;
  estimated_guests: number;
  special_instructions: string;
}

/**
 * Service to manage student special event catering plans
 */
export const cateringService = {
  /**
   * Submits custom guest catering request
   */
  async submitCateringRequest(
    input: CateringRequestInput
  ): Promise<CateringRequestRow> {
    const formattedInstructions = `[Guest Name: ${input.customer_name}] [Phone: ${input.customer_phone}] [Email: ${input.customer_email || 'guest@campus.edu'}]\n---\n${input.special_instructions}`;

    if (!isSupabaseConfigured) {
      const newRequest: CateringDetailedItem = {
        id: `cat-${Date.now()}`,
        user_id: 'mock-student-id-12345',
        event_name: input.event_name,
        event_date: input.event_date,
        estimated_guests: input.estimated_guests,
        special_instructions: formattedInstructions,
        status: 'pending',
        quoted_price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          full_name: input.customer_name,
          email: input.customer_email || 'guest@campus.edu',
          phone: input.customer_phone,
        },
      };

      MOCK_CATERINGS.unshift(newRequest);
      return newRequest;
    }

    // Attempt to parse existing authenticated user
    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    const insertObj: any = {
      event_name: input.event_name,
      event_date: input.event_date,
      estimated_guests: input.estimated_guests,
      special_instructions: formattedInstructions,
      status: 'pending',
    };

    if (authData?.user) {
      insertObj.user_id = authData.user.id;
    } else {
      // For guest users, pass UUID as null or dummy, and set additional fields
      insertObj.user_id = null;
    }

    // Try sending native guest columns too in case they are added in the DB.
    // supabase insert is dynamically matched
    try {
      (insertObj as any).customer_name = input.customer_name;
      (insertObj as any).customer_phone = input.customer_phone;
      (insertObj as any).customer_email = input.customer_email || 'guest@campus.edu';
    } catch (e) {
      // ignore
    }

    const { data, error } = await (supabase as any)
      .from('catering_requests')
      .insert(insertObj)
      .select()
      .single();

    if (error) {
      console.error('Error submitting catering event request:', error);
      throw error;
    }

    return data;
  },

  /**
   * Retrieves active catering events by guest matching parameters (local cache or manual query)
   */
  async getCateringRequestsByPhone(phone: string): Promise<CateringDetailedItem[]> {
    if (!isSupabaseConfigured) {
      return MOCK_CATERINGS.filter((c) => {
        const hasPhoneMatch = c.profiles?.phone?.replace(/\s/g, '').includes(phone.replace(/\s/g, '')) ||
          c.special_instructions?.includes(phone);
        return !!hasPhoneMatch;
      });
    }

    const { data, error } = await (supabase as any)
      .from('catering_requests')
      .select(`
        *,
        profiles(
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading catering requests:', error);
      throw error;
    }

    return (data || []).map((o: any) => {
      let parsedName = (o as any).customer_name;
      let parsedPhone = (o as any).customer_phone;
      let parsedEmail = (o as any).customer_email;

      if (o.special_instructions && o.special_instructions.startsWith('[Guest Name:')) {
        const nameMatch = o.special_instructions.match(/\[Guest Name:\s*([^]]+)/);
        const phoneMatch = o.special_instructions.match(/\[Phone:\s*([^]]+)/);
        const emailMatch = o.special_instructions.match(/\[Email:\s*([^]]+)/);
        if (nameMatch) parsedName = nameMatch[1];
        if (phoneMatch) parsedPhone = phoneMatch[1].trim();
        if (emailMatch) parsedEmail = emailMatch[1];
      }

      return {
        ...o,
        profiles: o.profiles ? o.profiles : {
          full_name: parsedName || 'Guest Customer',
          phone: parsedPhone || (o as any).customer_phone || '',
          email: parsedEmail || (o as any).customer_email || 'guest@campus.edu',
        }
      };
    }).filter((o: any) => {
      const ph = phone.replace(/[^\d+]/g, '');
      const oPh = (o.profiles?.phone || '').replace(/[^\d+]/g, '');
      const oCoPh = (o.customer_phone || '').replace(/[^\d+]/g, '');
      return (oPh && oPh.includes(ph)) || (oCoPh && oCoPh.includes(ph)) || (o.special_instructions && o.special_instructions.includes(phone));
    });
  },

  /**
   * Retrieves active catering events assigned to the currently authenticated student
   */
  async getUserCateringRequests(): Promise<CateringDetailedItem[]> {
    if (!isSupabaseConfigured) {
      return MOCK_CATERINGS;
    }

    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!authData?.user) return [];

    const { data, error } = await (supabase as any)
      .from('catering_requests')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading user caterings:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Admin-only: Retrieves list of catering applications
   */
  async getAllCateringRequests(): Promise<CateringDetailedItem[]> {
    if (!isSupabaseConfigured) {
      return MOCK_CATERINGS;
    }

    const { data, error } = await (supabase as any)
      .from('catering_requests')
      .select(`
        *,
        profiles(
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing catering projects:', error);
      throw error;
    }

    return (data || []).map((o: any) => {
      let parsedName = (o as any).customer_name;
      let parsedPhone = (o as any).customer_phone;
      let parsedEmail = (o as any).customer_email;

      if (o.special_instructions && o.special_instructions.startsWith('[Guest Name:')) {
        const nameMatch = o.special_instructions.match(/\[Guest Name:\s*([^]]+)/);
        const phoneMatch = o.special_instructions.match(/\[Phone:\s*([^]]+)/);
        const emailMatch = o.special_instructions.match(/\[Email:\s*([^]]+)/);
        if (nameMatch) parsedName = nameMatch[1];
        if (phoneMatch) parsedPhone = phoneMatch[1].trim();
        if (emailMatch) parsedEmail = emailMatch[1];
      }

      return {
        ...o,
        profiles: o.profiles ? o.profiles : {
          full_name: parsedName || 'Guest Customer',
          phone: parsedPhone || (o as any).customer_phone || '',
          email: parsedEmail || (o as any).customer_email || 'guest@campus.edu',
        }
      };
    });
  },

  /**
   * Admin-only: Quotes prices and modifies state for catering projects
   */
  async reviewCateringRequest(
    requestId: string,
    status: CateringStatus,
    quotedPrice?: number
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = MOCK_CATERINGS.findIndex((c) => c.id === requestId);
      if (idx !== -1) {
        MOCK_CATERINGS[idx].status = status;
        if (quotedPrice !== undefined) {
          MOCK_CATERINGS[idx].quoted_price = quotedPrice;
        }
        MOCK_CATERINGS[idx].updated_at = new Date().toISOString();
      }
      return;
    }

    const { error } = await (supabase as any)
      .from('catering_requests')
      .update({
        status,
        quoted_price: quotedPrice !== undefined ? quotedPrice : null,
      })
      .eq('id', requestId);

    if (error) {
      console.error(`Error reviewing booking ID ${requestId}:`, error);
      throw error;
    }
  },
};
