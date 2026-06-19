/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'admin';
export type MenuStatus = 'draft' | 'active' | 'archived';
export type MealCategory = 'soup' | 'stew' | 'rice' | 'other';
export type OrderStatus =
  | 'pending_payment'
  | 'payment_under_verification'
  | 'paid'
  | 'confirmed'
  | 'delivered'
  | 'cancelled';
export type ProofStatus = 'pending' | 'approved' | 'rejected';
export type CateringStatus =
  | 'pending'
  | 'reviewed'
  | 'quoted'
  | 'accepted'
  | 'completed'
  | 'cancelled';
export type ScheduleStatus = 'open' | 'closed' | 'completed';

// =====================================================================
// DIRECT CORE DOMAIN INTERFACES (Top Level Exports)
// =====================================================================

export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  hostel_name: string | null;
  room_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  role?: UserRole;
  full_name: string;
  email: string;
  phone?: string | null;
  hostel_name?: string | null;
  room_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  id?: string;
  role?: UserRole;
  full_name?: string;
  email?: string;
  phone?: string | null;
  hostel_name?: string | null;
  room_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MealRow {
  id: string;
  name: string;
  description: string | null;
  category: MealCategory;
  price: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealInsert {
  id?: string;
  name: string;
  description?: string | null;
  category: MealCategory;
  price: number;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MealUpdate {
  id?: string;
  name?: string;
  description?: string | null;
  category?: MealCategory;
  price?: number;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyMenuRow {
  id: string;
  start_date: string;
  end_date: string;
  status: MenuStatus;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenuInsert {
  id?: string;
  start_date: string;
  end_date: string;
  status?: MenuStatus;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyMenuUpdate {
  id?: string;
  start_date?: string;
  end_date?: string;
  status?: MenuStatus;
  created_at?: string;
  updated_at?: string;
}

export interface MenuMealRow {
  id: string;
  menu_id: string;
  meal_id: string;
  min_threshold: number;
  created_at: string;
}

export interface MenuMealInsert {
  id?: string;
  menu_id: string;
  meal_id: string;
  min_threshold?: number;
  created_at?: string;
}

export interface MenuMealUpdate {
  id?: string;
  menu_id?: string;
  meal_id?: string;
  min_threshold?: number;
  created_at?: string;
}

export interface OrderRow {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  hostel_name: string;
  room_number: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderInsert {
  id?: string;
  user_id: string;
  status?: OrderStatus;
  total_amount: number;
  hostel_name: string;
  room_number: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderUpdate {
  id?: string;
  user_id?: string;
  status?: OrderStatus;
  total_amount?: number;
  hostel_name?: string;
  room_number?: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_meal_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  menu_meal_id: string;
  quantity: number;
  unit_price: number;
  created_at?: string;
}

export interface OrderItemUpdate {
  id?: string;
  order_id?: string;
  menu_meal_id?: string;
  quantity?: number;
  unit_price?: number;
  created_at?: string;
}

export interface PaymentProofRow {
  id: string;
  order_id: string;
  transaction_reference: string | null;
  proof_image_url: string;
  status: ProofStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProofInsert {
  id?: string;
  order_id: string;
  transaction_reference?: string | null;
  proof_image_url: string;
  status?: ProofStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentProofUpdate {
  id?: string;
  order_id?: string;
  transaction_reference?: string | null;
  proof_image_url?: string;
  status?: ProofStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CateringRequestRow {
  id: string;
  user_id: string;
  event_name: string;
  event_date: string;
  estimated_guests: number;
  special_instructions: string | null;
  status: CateringStatus;
  quoted_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface CateringRequestInsert {
  id?: string;
  user_id: string;
  event_name: string;
  event_date: string;
  estimated_guests: number;
  special_instructions?: string | null;
  status?: CateringStatus;
  quoted_price?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CateringRequestUpdate {
  id?: string;
  user_id?: string;
  event_name?: string;
  event_date?: string;
  estimated_guests?: number;
  special_instructions?: string | null;
  status?: CateringStatus;
  quoted_price?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryScheduleRow {
  id: string;
  menu_id: string;
  delivery_date: string;
  cutoff_time: string;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
}

export interface DeliveryScheduleInsert {
  id?: string;
  menu_id: string;
  delivery_date: string;
  cutoff_time: string;
  status?: ScheduleStatus;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryScheduleUpdate {
  id?: string;
  menu_id?: string;
  delivery_date?: string;
  cutoff_time?: string;
  status?: ScheduleStatus;
  created_at?: string;
  updated_at?: string;
}

export interface MenuMealProgress {
  menu_meal_id: string;
  menu_id: string;
  meal_id: string;
  meal_name: string;
  meal_category: MealCategory;
  unit_price: number;
  image_url: string | null;
  min_threshold: number;
  total_ordered_quantity: number;
  remaining_orders_needed: number;
  is_threshold_met: boolean;
}

// =====================================================================
// DATABASE TYPE DEFINITION MATCHING@supabase/supabase-js SPEC
// =====================================================================

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      meals: {
        Row: MealRow;
        Insert: MealInsert;
        Update: MealUpdate;
      };
      weekly_menus: {
        Row: WeeklyMenuRow;
        Insert: WeeklyMenuInsert;
        Update: WeeklyMenuUpdate;
      };
      menu_meals: {
        Row: MenuMealRow;
        Insert: MenuMealInsert;
        Update: MenuMealUpdate;
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItemRow;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
      payment_proofs: {
        Row: PaymentProofRow;
        Insert: PaymentProofInsert;
        Update: PaymentProofUpdate;
      };
      catering_requests: {
        Row: CateringRequestRow;
        Insert: CateringRequestInsert;
        Update: CateringRequestUpdate;
      };
      delivery_schedules: {
        Row: DeliveryScheduleRow;
        Insert: DeliveryScheduleInsert;
        Update: DeliveryScheduleUpdate;
      };
    };
    Views: {
      vw_menu_meals_progress: {
        Row: MenuMealProgress;
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
