/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../types/database.types';

import jollofImg from '../assets/Jollof Rice and Beef.jpg';
import stewImg from '../assets/Nigerian Beef Stew (African Stew).jpg';
import egusiImg from '../assets/Egusi Soup.jpg';
import friedRiceImg from '../assets/Fried Rice.jpg';
import ogbonoImg from '../assets/ogbono soup.jpg';
import pepperedChickenImg from '../assets/peppered kitche.jpg';

export type MealRow = Database['public']['Tables']['meals']['Row'];
export type MealInsert = Database['public']['Tables']['meals']['Insert'];
export type MealUpdate = Database['public']['Tables']['meals']['Update'];

// Preloaded popular items matching university selection
const MOCK_MEALS: MealRow[] = [
  {
    id: 'meal-1',
    name: 'Signature Jollof Rice',
    description: 'Rich, authentic smoky party jollof rice cooked with traditional spices, served with soft succulent beef and dodo.',
    category: 'rice',
    price: 2500.00,
    image_url: jollofImg,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'meal-2',
    name: 'Stew',
    description: 'Chunky succulent beef stew slow cooked in traditional rich tomato and pepper base.',
    category: 'stew',
    price: 2000.00,
    image_url: stewImg,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'meal-3',
    name: 'Egusi Soup',
    description: 'Classic rich Egusi soup prepared with melon seeds, pumpkin greens, and premium local seasoning.',
    category: 'soup',
    price: 3000.00,
    image_url: egusiImg,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'meal-4',
    name: 'Fried Rice',
    description: 'Nicely seasoned fried rice loaded with sweet carrots, green peas, sweet corn, and savory herbs.',
    category: 'rice',
    price: 2400.00,
    image_url: friedRiceImg,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'meal-5',
    name: 'Ogbono Soup',
    description: 'Thick, aromatic wild mango seed soup cooked with spinach, stock fish, and pure red palm oil.',
    category: 'soup',
    price: 2800.00,
    image_url: ogbonoImg,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'meal-6',
    name: 'Peppered Chicken',
    description: 'Crispy fried chicken parts thoroughly tossed in rich, fiery spicy pepper sauce and local garnished greens.',
    category: 'other',
    price: 1800.00,
    image_url: pepperedChickenImg,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Service to manage meals in the universal catalog
 */
export const mealService = {
  /**
   * Retrieves all meals listed inside the catalog
   */
  async getAllMeals(): Promise<MealRow[]> {
    if (!isSupabaseConfigured) {
      return MOCK_MEALS;
    }

    const { data, error } = await (supabase as any)
      .from('meals')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetches single meal details based on unique identifier
   */
  async getMealById(id: string): Promise<MealRow | null> {
    if (!isSupabaseConfigured) {
      return MOCK_MEALS.find((m) => m.id === id) || null;
    }

    const { data, error } = await (supabase as any)
      .from('meals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching meal by id ${id}:`, error);
      return null;
    }

    return data;
  },

  /**
   * Admin-only: Creates new culinary dish in catalog
   */
  async createMeal(meal: MealInsert): Promise<MealRow> {
    if (!isSupabaseConfigured) {
      const newMeal: MealRow = {
        ...meal,
        id: `meal-${Date.now()}`,
        description: meal.description || null,
        image_url: meal.image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_MEALS.push(newMeal);
      return newMeal;
    }

    const { data, error } = await (supabase as any)
      .from('meals')
      .insert(meal)
      .select()
      .single();

    if (error) {
      console.error('Error creating meal:', error);
      throw error;
    }

    return data;
  },

  /**
   * Admin-only: Updates existing dish details
   */
  async updateMeal(id: string, updates: MealUpdate): Promise<MealRow> {
    if (!isSupabaseConfigured) {
      const idx = MOCK_MEALS.findIndex((m) => m.id === id);
      if (idx === -1) throw new Error('Meal not found');
      const updated = { ...MOCK_MEALS[idx], ...updates, updated_at: new Date().toISOString() };
      MOCK_MEALS[idx] = updated;
      return updated;
    }

    const { data, error } = await (supabase as any)
      .from('meals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating meal ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Admin-only: Deletes food catalog entry
   */
  async deleteMeal(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = MOCK_MEALS.findIndex((m) => m.id === id);
      if (idx !== -1) MOCK_MEALS.splice(idx, 1);
      return;
    }

    const { error } = await (supabase as any)
      .from('meals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting meal ${id}:`, error);
      throw error;
    }
  },
};
