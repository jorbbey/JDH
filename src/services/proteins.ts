/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

export const SEED_PROTEINS: ExtraOption[] = [
  { id: 'opt-plantain', name: 'Plantain (Per Portion)', price: 300 },
  { id: 'opt-sausage', name: 'Sausage', price: 450 },
  { id: 'opt-gizzard', name: 'Gizzard', price: 300 },
  { id: 'opt-beef', name: 'Beef', price: 600 },
  { id: 'opt-egg', name: 'Egg (boiled)', price: 300 },
  { id: 'opt-hake-big', name: 'Hake Fish big', price: 1700 },
  { id: 'opt-chicken-gourmet', name: 'Peppered Chicken (Gourmet)', price: 3500 },
  { id: 'opt-turkey-medium', name: 'Peppered Medium Turkey', price: 3300 },
  { id: 'opt-turkey-big', name: 'Peppered Big Turkey', price: 5300 },
  { id: 'opt-chicken-regular', name: 'Peppered Chicken', price: 1500 },
  { id: 'opt-hake-mini', name: 'Hake fish mini', price: 1000 },
];

export const proteinService = {
  /**
   * Fetches protein/extra options.
   */
  async getProteinOptions(): Promise<ExtraOption[]> {
    if (!isSupabaseConfigured) {
      const local = localStorage.getItem('jdh_protein_options');
      if (local) {
        try {
          return JSON.parse(local);
        } catch (e) {
          return [];
        }
      }
      return [];
    }

    try {
      const { data, error } = await (supabase as any)
        .from('protein_options')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Could not fetch protein options from Supabase, using local fallback:', error.message);
        const local = localStorage.getItem('jdh_protein_options');
        if (local) {
          try {
            return JSON.parse(local);
          } catch (e) {
            return [];
          }
        }
        return [];
      }

      const parsedData = (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        price: Number(r.price),
      }));

      // Sync to localStorage
      localStorage.setItem('jdh_protein_options', JSON.stringify(parsedData));
      return parsedData;
    } catch (err) {
      console.error('Error in getProteinOptions:', err);
      const local = localStorage.getItem('jdh_protein_options');
      if (local) {
        try {
          return JSON.parse(local);
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  },

  /**
   * Saves or updates a protein/extra option
   */
  async saveProteinOption(option: ExtraOption): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await (supabase as any)
        .from('protein_options')
        .upsert({
          id: option.id,
          name: option.name,
          price: option.price,
        });

      if (error) {
        console.error('Failed to save to Supabase protein_options:', error.message);
        throw error;
      }
    }

    // Sync to local storage
    try {
      const local = localStorage.getItem('jdh_protein_options');
      let current: ExtraOption[] = [];
      if (local) {
        current = JSON.parse(local);
      }
      const existingIndex = current.findIndex((o) => o.id === option.id);
      if (existingIndex >= 0) {
        current[existingIndex] = option;
      } else {
        current.push(option);
      }
      localStorage.setItem('jdh_protein_options', JSON.stringify(current));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  },

  /**
   * Deletes a protein/extra option
   */
  async deleteProteinOption(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await (supabase as any)
        .from('protein_options')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete from Supabase protein_options:', error.message);
        throw error;
      }
    }

    // Sync to local storage
    try {
      const local = localStorage.getItem('jdh_protein_options');
      if (local) {
        const current: ExtraOption[] = JSON.parse(local);
        const updated = current.filter((o) => o.id !== id);
        localStorage.setItem('jdh_protein_options', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Error deleting from localStorage:', err);
    }
  },

  /**
   * Seeds the protein_options table (no-op to prevent unrequested default values)
   */
  async seedProteinOptions(options: ExtraOption[]): Promise<void> {
    // No-op per user's request to have the table empty on initialization
  },
};
