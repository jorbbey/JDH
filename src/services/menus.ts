/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database, MenuStatus, ScheduleStatus } from '../types/database.types';

import jollofImg from '../assets/Jollof Rice and Beef.jpg';
import stewImg from '../assets/Nigerian Beef Stew (African Stew).jpg';
import egusiImg from '../assets/Egusi Soup.jpg';
import friedRiceImg from '../assets/Fried Rice.jpg';
import ogbonoImg from '../assets/ogbono soup.jpg';
import pepperedChickenImg from '../assets/peppered kitche.jpg';

export type WeeklyMenuRow = Database['public']['Tables']['weekly_menus']['Row'];
export type MenuMealRow = Database['public']['Tables']['menu_meals']['Row'];
export type MenuMealProgress = Database['public']['Views']['vw_menu_meals_progress']['Row'];
export type DeliveryScheduleRow = Database['public']['Tables']['delivery_schedules']['Row'];

// Robust local simulation states
const MOCK_WEEKLIES: WeeklyMenuRow[] = [
  {
    id: 'menu-week-24',
    start_date: '2026-06-08',
    end_date: '2026-06-14',
    status: 'active' as MenuStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_MENU_MEALS_PROGRESS: MenuMealProgress[] = [
  {
    menu_meal_id: 'mm-1',
    menu_id: 'menu-week-24',
    meal_id: 'meal-1',
    meal_name: 'Signature Jollof Rice',
    meal_category: 'rice',
    unit_price: 2500.00,
    image_url: jollofImg,
    min_threshold: 20,
    total_ordered_quantity: 18,
    remaining_orders_needed: 2,
    is_threshold_met: false,
  },
  {
    menu_meal_id: 'mm-2',
    menu_id: 'menu-week-24',
    meal_id: 'meal-2',
    meal_name: 'Stew',
    meal_category: 'stew',
    unit_price: 2000.00,
    image_url: stewImg,
    min_threshold: 20,
    total_ordered_quantity: 21,
    remaining_orders_needed: 0,
    is_threshold_met: true,
  },
  {
    menu_meal_id: 'mm-3',
    menu_id: 'menu-week-24',
    meal_id: 'meal-3',
    meal_name: 'Egusi Soup',
    meal_category: 'soup',
    unit_price: 3000.00,
    image_url: egusiImg,
    min_threshold: 20,
    total_ordered_quantity: 24,
    remaining_orders_needed: 0,
    is_threshold_met: true,
  },
  {
    menu_meal_id: 'mm-4',
    menu_id: 'menu-week-24',
    meal_id: 'meal-4',
    meal_name: 'Fried Rice',
    meal_category: 'rice',
    unit_price: 2400.00,
    image_url: friedRiceImg,
    min_threshold: 20,
    total_ordered_quantity: 12,
    remaining_orders_needed: 8,
    is_threshold_met: false,
  },
  {
    menu_meal_id: 'mm-5',
    menu_id: 'menu-week-24',
    meal_id: 'meal-5',
    meal_name: 'Ogbono Soup',
    meal_category: 'soup',
    unit_price: 2800.00,
    image_url: ogbonoImg,
    min_threshold: 20,
    total_ordered_quantity: 15,
    remaining_orders_needed: 5,
    is_threshold_met: false,
  },
  {
    menu_meal_id: 'mm-6',
    menu_id: 'menu-week-24',
    meal_id: 'meal-6',
    meal_name: 'Peppered Chicken',
    meal_category: 'other',
    unit_price: 1800.00,
    image_url: pepperedChickenImg,
    min_threshold: 20,
    total_ordered_quantity: 16,
    remaining_orders_needed: 4,
    is_threshold_met: false,
  },
];

const MOCK_DELIVERY_SCHEDULES: DeliveryScheduleRow[] = [
  {
    id: 'sched-1',
    menu_id: 'menu-week-24',
    delivery_date: '2026-06-14',
    cutoff_time: '2026-06-12T18:00:00Z',
    status: 'open' as ScheduleStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Service representing Menu configurations and dynamic item allocations
 */
export const menuService = {
  /**
   * Retrieves the currently published 'active' weekly menu
   */
  async getActiveMenu(): Promise<WeeklyMenuRow | null> {
    if (!isSupabaseConfigured) {
      return MOCK_WEEKLIES.find((m) => m.status === 'active') || null;
    }

    const { data, error } = await (supabase as any)
      .from('weekly_menus')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active menu:', error);
      return null;
    }

    return data;
  },

  /**
   * Fetches all menus (essential for admin schedules & management)
   */
  async getAllMenus(): Promise<WeeklyMenuRow[]> {
    if (!isSupabaseConfigured) {
      return MOCK_WEEKLIES;
    }

    const { data, error } = await (supabase as any)
      .from('weekly_menus')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching all menus:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetches dynamic list of meals active in the menu, incorporating cumulative ordered quantities
   */
  async getMenuMealsProgress(menuId: string): Promise<MenuMealProgress[]> {
    if (!isSupabaseConfigured) {
      return MOCK_MENU_MEALS_PROGRESS.filter((p) => p.menu_id === menuId);
    }

    const { data, error } = await (supabase as any)
      .from('vw_menu_meals_progress')
      .select('*')
      .eq('menu_id', menuId);

    if (error) {
      console.error(`Error querying meals progress for menu ${menuId}:`, error);
      throw error;
    }

    return data || [];
  },

  /**
   * Retrieves active delivery schedules matching a target weekly menu
   */
  async getDeliveryScheduleForMenu(menuId: string): Promise<DeliveryScheduleRow | null> {
    if (!isSupabaseConfigured) {
      return MOCK_DELIVERY_SCHEDULES.find((s) => s.menu_id === menuId) || null;
    }

    const { data, error } = await (supabase as any)
      .from('delivery_schedules')
      .select('*')
      .eq('menu_id', menuId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching delivery schedule for menu ${menuId}:`, error);
      return null;
    }

    return data;
  },

  /**
   * Admin-only: Creates a brand new weekly cycle
   */
  async createWeeklyMenu(startDate: string, endDate: string, status: MenuStatus = 'draft'): Promise<WeeklyMenuRow> {
    if (!isSupabaseConfigured) {
      const newMenu: WeeklyMenuRow = {
        id: `menu-week-${Date.now()}`,
        start_date: startDate,
        end_date: endDate,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_WEEKLIES.push(newMenu);
      return newMenu;
    }

    const { data, error } = await (supabase as any)
      .from('weekly_menus')
      .insert({ start_date: startDate, end_date: endDate, status })
      .select()
      .single();

    if (error) {
      console.error('Error creating menu:', error);
      throw error;
    }

    return data;
  },

  /**
   * Admin-only: Updates a weekly cycle status
   */
  async updateWeeklyMenuStatus(menuId: string, status: MenuStatus): Promise<WeeklyMenuRow> {
    if (!isSupabaseConfigured) {
      const idx = MOCK_WEEKLIES.findIndex((m) => m.id === menuId);
      if (idx === -1) throw new Error('Menu cycle not found');
      // If we are setting this to active, set all other menus to draft/archived
      if (status === 'active') {
        MOCK_WEEKLIES.forEach((m) => {
          if (m.id !== menuId && m.status === 'active') {
            m.status = 'archived';
          }
        });
      }
      MOCK_WEEKLIES[idx].status = status;
      MOCK_WEEKLIES[idx].updated_at = new Date().toISOString();
      return MOCK_WEEKLIES[idx];
    }

    const { data, error } = await (supabase as any)
      .from('weekly_menus')
      .update({ status })
      .eq('id', menuId)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu status:', error);
      throw error;
    }

    return data;
  },

  /**
   * Admin-only: Integrates a meal into a specific menu timeline
   */
  async addMealToMenu(menuId: string, mealId: string, minThreshold: number = 40): Promise<MenuMealRow> {
    if (!isSupabaseConfigured) {
      const id = `mm-simulated-${Date.now()}`;
      
      // Attempt to mock actual meal details
      let mealName = 'Simulated Menu Meal Added';
      let mealCategory = 'other' as const;
      let unitPrice = 2000.0;
      let imageUrl: string | null = null;

      const mockMealsList = [
        { id: 'meal-1', name: 'Party Jollof Rice with Roasted Chicken', category: 'rice', price: 3500.00, image_url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=400' },
        { id: 'meal-2', name: 'Special Fried Rice & Peppered Fish', category: 'rice', price: 4000.00, image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=400' },
        { id: 'meal-3', name: 'Ofada Rice & Ayamase Designer Stew', category: 'stew', price: 4500.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400' },
        { id: 'meal-4', name: 'Efo Riro (Rich Spinach Soup)', category: 'soup', price: 5000.00, image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400' }
      ];

      const foundMeal = mockMealsList.find(m => m.id === mealId);
      if (foundMeal) {
        mealName = foundMeal.name;
        mealCategory = foundMeal.category as any;
        unitPrice = foundMeal.price;
        imageUrl = foundMeal.image_url;
      }

      const newProgress: MenuMealProgress = {
        menu_meal_id: id,
        menu_id: menuId,
        meal_id: mealId,
        meal_name: mealName,
        meal_category: mealCategory,
        unit_price: unitPrice,
        image_url: imageUrl,
        min_threshold: minThreshold,
        total_ordered_quantity: 0,
        remaining_orders_needed: minThreshold,
        is_threshold_met: false,
      };
      MOCK_MENU_MEALS_PROGRESS.push(newProgress);

      return {
        id,
        menu_id: menuId,
        meal_id: mealId,
        min_threshold: minThreshold,
        created_at: new Date().toISOString(),
      };
    }

    const { data, error } = await (supabase as any)
      .from('menu_meals')
      .insert({ menu_id: menuId, meal_id: mealId, min_threshold: minThreshold })
      .select()
      .single();

    if (error) {
      console.error('Error linking meal to menu:', error);
      throw error;
    }

    return data;
  },

  /**
   * Admin-only: Removes a meal from a specific weekly menu timeline
   */
  async removeMealFromMenu(menuMealId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = MOCK_MENU_MEALS_PROGRESS.findIndex(m => m.menu_meal_id === menuMealId);
      if (idx !== -1) {
        MOCK_MENU_MEALS_PROGRESS.splice(idx, 1);
      }
      return;
    }

    const { error } = await (supabase as any)
      .from('menu_meals')
      .delete()
      .eq('id', menuMealId);

    if (error) {
      console.error('Error deleting menu meal association:', error);
      throw error;
    }
  },

  /**
   * Admin-only: Sets up a scheduled pickup/delivery day
   */
  async createDeliverySchedule(menuId: string, deliveryDate: string, cutoffTime: string): Promise<DeliveryScheduleRow> {
    if (!isSupabaseConfigured) {
      const sched: DeliveryScheduleRow = {
        id: `sched-${Date.now()}`,
        menu_id: menuId,
        delivery_date: deliveryDate,
        cutoff_time: cutoffTime,
        status: 'open' as ScheduleStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_DELIVERY_SCHEDULES.push(sched);
      return sched;
    }

    const { data, error } = await (supabase as any)
      .from('delivery_schedules')
      .insert({ menu_id: menuId, delivery_date: deliveryDate, cutoff_time: cutoffTime })
      .select()
      .single();

    if (error) {
      console.error('Error creating delivery schedule:', error);
      throw error;
    }

    return data;
  },

  /**
   * Admin-only: Updates an existing daily pickup/delivery schedule
   */
  async updateDeliverySchedule(
    scheduleId: string,
    updates: { delivery_date?: string; cutoff_time?: string; status?: ScheduleStatus }
  ): Promise<DeliveryScheduleRow> {
    if (!isSupabaseConfigured) {
      const idx = MOCK_DELIVERY_SCHEDULES.findIndex((s) => s.id === scheduleId);
      if (idx === -1) throw new Error('Delivery schedule not found');
      MOCK_DELIVERY_SCHEDULES[idx] = {
        ...MOCK_DELIVERY_SCHEDULES[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return MOCK_DELIVERY_SCHEDULES[idx];
    }

    const { data, error } = await (supabase as any)
      .from('delivery_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating delivery schedule ${scheduleId}:`, error);
      throw error;
    }

    return data;
  },
};
