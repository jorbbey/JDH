/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database, OrderStatus } from '../types/database.types';

export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

export interface OrderInput {
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  hostel_name: string;
  room_number: string;
  notes?: string;
  pickup_code?: string;
  items: Array<{
    menu_meal_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface DetailedOrderItem {
  id: string;
  menu_meal_id: string;
  quantity: number;
  unit_price: number;
  meal: {
    name: string;
    category: string;
    image_url: string | null;
  };
}

export interface DetailedOrder extends OrderRow {
  items: DetailedOrderItem[];
  customer_name?: string;
  customer_phone?: string;
  customer_whatsapp?: string;
  pickup_code_direct?: string;
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
    whatsapp?: string;
  } | null;
}

/**
 * Standard guest metadata parser to retrieve guest fields across any DB schema version
 */
export function parseGuestOrder(o: any): DetailedOrder {
  let customerName = o.customer_name;
  let customerPhone = o.customer_phone;
  let customerWhatsapp = o.customer_whatsapp;
  let pickupCode = o.pickup_code;
  let cleanNotes = o.notes;

  if (o.notes && o.notes.startsWith('[GUEST:')) {
    const guestMatch = o.notes.match(/\[GUEST:\s*([^]]+)/);
    const phoneMatch = o.notes.match(/\[Phone:\s*([^]]+)/);
    const whatsappMatch = o.notes.match(/\[WhatsApp:\s*([^]]+)/);
    const codeMatch = o.notes.match(/\[PickupCode:\s*([^]]+)/);

    if (guestMatch) customerName = guestMatch[1];
    if (phoneMatch) customerPhone = phoneMatch[1].trim();
    if (whatsappMatch) customerWhatsapp = whatsappMatch[1];
    if (codeMatch) pickupCode = codeMatch[1];

    // Strip serialization block from display notes
    cleanNotes = o.notes.replace(/^\[GUEST:[^]]+\]\s*\[Phone:[^]]+\]\s*\[WhatsApp:[^]]+\]\s*\[PickupCode:[^]]+\]\s*/, '');
  }

  if (!pickupCode) {
    pickupCode = `ML-${o.id ? o.id.slice(0, 5).toUpperCase() : Math.floor(10000 + Math.random() * 90000)}`;
  }

  return {
    ...o,
    notes: cleanNotes,
    pickup_code_direct: pickupCode,
    customer_name: customerName || 'Guest Student',
    customer_phone: customerPhone || '',
    customer_whatsapp: customerWhatsapp || '',
    profiles: o.profiles ? o.profiles : {
      full_name: customerName || 'Guest Student',
      email: 'guest@campus.edu',
      phone: customerPhone || '',
      whatsapp: customerWhatsapp || '',
    },
  };
}

// Local mock storage for preview testing
const MOCK_ORDERS: DetailedOrder[] = [
  {
    id: 'ord-101',
    user_id: 'mock-student-id-12345',
    status: 'pending_payment' as OrderStatus,
    total_amount: 11000.00,
    hostel_name: 'Moremi Hall',
    room_number: 'B204',
    notes: 'Please add extra plantain to the Jollof Rice if possible.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer_name: 'Damilola Adebayo',
    customer_phone: '+234 812 345 6789',
    customer_whatsapp: '+234 812 345 6789',
    pickup_code_direct: 'RC-10492',
    items: [
      {
        id: 'oi-101a',
        menu_meal_id: 'mm-1',
        quantity: 2,
        unit_price: 3500.00,
        meal: {
          name: 'Party Jollof Rice with Roasted Chicken',
          category: 'rice',
          image_url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=400',
        },
      },
      {
        id: 'oi-101b',
        menu_meal_id: 'mm-2',
        quantity: 1,
        unit_price: 4000.00,
        meal: {
          name: 'Special Fried Rice & Peppered Fish',
          category: 'rice',
          image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=400',
        },
      },
    ],
    profiles: {
      full_name: 'Damilola Adebayo',
      email: 'student@campus.edu',
      phone: '+234 812 345 6789',
    },
  },
];

/**
 * Service to manage student orders and admin fulfillments
 */
export const orderService = {
  /**
   * Places a guest student order, creating both the parent order and nested ordered items sequentially
   */
  async createOrder(input: OrderInput): Promise<OrderRow> {
    const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    // Map a clean pickup code
    const randCode = Math.floor(10000 + Math.random() * 90000);
    const pickupCode = input.pickup_code || `RC-${randCode}`;

    // Build the serialization notes payload to guarantee standard guest lookup on any schema
    const notesPayload = `[GUEST: ${input.customer_name}] [Phone: ${input.customer_phone}] [WhatsApp: ${input.customer_whatsapp || ''}] [PickupCode: ${pickupCode}] ${input.notes || ''}`;

    if (!isSupabaseConfigured) {
      const newOrderId = `ord-${Date.now()}`;
      const newOrder: DetailedOrder = {
        id: newOrderId,
        user_id: 'mock-student-id-12345',
        status: 'pending_payment',
        total_amount: totalAmount,
        hostel_name: input.hostel_name,
        room_number: input.room_number,
        notes: notesPayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_whatsapp: input.customer_whatsapp,
        pickup_code_direct: pickupCode,
        items: input.items.map((it, index) => ({
          id: `oi-${Date.now()}-${index}`,
          menu_meal_id: it.menu_meal_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          meal: {
            name: 'Smokey Party Jollof Rice with Chicken',
            category: 'rice',
            image_url: null,
          },
        })),
        profiles: {
          full_name: input.customer_name,
          email: 'guest@campus.edu',
          phone: input.customer_phone,
        },
      };

      MOCK_ORDERS.unshift(newOrder);
      return parseGuestOrder(newOrder);
    }

    // Try finding live authenticated user (if an admin is logged in or they want authentication)
    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    // Auto-resolve any unlinked catalog dishes prior to checkout to bypass foreign key constraints
    let activeMenuId: string | null = null;
    try {
      const { data: activeMenu } = await (supabase as any)
        .from('weekly_menus')
        .select('id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      activeMenuId = activeMenu?.id || null;
      if (!activeMenuId) {
        const { data: latestMenu } = await (supabase as any)
          .from('weekly_menus')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        activeMenuId = latestMenu?.id || null;
      }
    } catch (err) {
      console.warn('Could not query active menu for checkout healing:', err);
    }

    const processedItems = [];
    for (const item of input.items) {
      let resolvedMenuMealId = item.menu_meal_id;

      try {
        // Verify if the menu_meal_id refers to a genuine entry in menu_meals
        const { data: exists } = await (supabase as any)
          .from('menu_meals')
          .select('id')
          .eq('id', item.menu_meal_id)
          .maybeSingle();

        if (!exists && activeMenuId) {
          // Check if this meal is already linked to the activeMenuId
          const { data: alreadyLinked } = await (supabase as any)
            .from('menu_meals')
            .select('id')
            .eq('menu_id', activeMenuId)
            .eq('meal_id', item.menu_meal_id)
            .maybeSingle();

          if (alreadyLinked) {
            resolvedMenuMealId = alreadyLinked.id;
          } else {
            // Auto-link this universal meal to our menu on demand
            const { data: newLink, error: linkErr } = await (supabase as any)
              .from('menu_meals')
              .insert({
                menu_id: activeMenuId,
                meal_id: item.menu_meal_id,
                min_threshold: 40
              })
              .select()
              .single();

            if (!linkErr && newLink) {
              resolvedMenuMealId = newLink.id;
            }
          }
        }
      } catch (err) {
        console.warn('Error auto-healing menu junction:', err);
      }

      processedItems.push({
        ...item,
        menu_meal_id: resolvedMenuMealId
      });
    }

    // 1. Create the parent order
    const insertObj: any = {
      user_id: authData?.user?.id || null, // Allow nullable user_id for guest flow
      total_amount: totalAmount,
      hostel_name: input.hostel_name,
      room_number: input.room_number,
      notes: notesPayload,
      status: 'pending_payment',
    };

    // If schema has been altered, send custom columns directly too
    try {
      insertObj.customer_name = input.customer_name;
      insertObj.customer_phone = input.customer_phone;
      insertObj.customer_whatsapp = input.customer_whatsapp;
      insertObj.pickup_code = pickupCode;
    } catch (e) {
      // ignore
    }

    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert(insertObj)
      .select()
      .single();

    if (orderError) {
      console.error('Error inserting order:', orderError);
      throw orderError;
    }

    if (!order) {
      throw new Error('Failed to create parent order record');
    }

    // 2. Prepare order items using processedItems
    const orderItemsToInsert = processedItems.map((item) => ({
      order_id: (order as any).id,
      menu_meal_id: item.menu_meal_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    // 3. Insert order items
    const { error: itemsError } = await (supabase as any)
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('Failed to insert order items, rolling back status manually:', itemsError);
      // Clean up orphaned parent order
      await (supabase as any).from('orders').delete().eq('id', (order as any).id);
      throw itemsError;
    }

    return parseGuestOrder(order);
  },

  /**
   * Retrieves orders placed by the currently logged-in student
   */
  /**
   * Retrieves orders placed by the currently logged-in student (if any)
   */
  async getUserOrders(): Promise<DetailedOrder[]> {
    if (!isSupabaseConfigured) {
      return MOCK_ORDERS.map(o => parseGuestOrder(o));
    }

    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!authData?.user) return [];

    // Fetch orders with order items and linked meals
    const { data: orders, error } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        items:order_items(
          id,
          menu_meal_id,
          quantity,
          unit_price,
          menu_meals(
            meals(
              name,
              category,
              image_url
            )
          )
        )
      `)
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }

    // Adapt nested structure to simpler model
    return (orders || []).map((o: any) => {
      const parsed = parseGuestOrder(o);
      parsed.items = o.items.map((item: any) => ({
        id: item.id,
        menu_meal_id: item.menu_meal_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        meal: {
          name: item.menu_meals?.meals?.name || 'Unknown Meal',
          category: item.menu_meals?.meals?.category || 'other',
          image_url: item.menu_meals?.meals?.image_url || null,
        },
      }));
      return parsed;
    });
  },

  /**
   * Retrieves guest orders matching a search term (Phone Number or Pickup Code)
   */
  async getOrdersByPhoneOrCode(searchTerm: string): Promise<DetailedOrder[]> {
    const formattedTerm = searchTerm.trim().toUpperCase();
    if (!formattedTerm) return [];

    if (!isSupabaseConfigured) {
      return MOCK_ORDERS.map((o) => parseGuestOrder(o)).filter((o) => {
        const ph = formattedTerm.replace(/[^\d]/g, '');
        const checkPh = (o.customer_phone || '').replace(/[^\d]/g, '');
        const checkCode = (o.pickup_code_direct || '').toUpperCase();
        return (ph && checkPh.includes(ph)) || checkCode.includes(formattedTerm);
      });
    }

    const { data: orders, error } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        profiles(
          full_name,
          email,
          phone
        ),
        items:order_items(
          id,
          menu_meal_id,
          quantity,
          unit_price,
          menu_meals(
            meals(
              name,
              category,
              image_url
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders for lookup:', error);
      throw error;
    }

    return (orders || [])
      .map((o: any) => {
        const parsed = parseGuestOrder(o);
        parsed.items = o.items.map((item: any) => ({
          id: item.id,
          menu_meal_id: item.menu_meal_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          meal: {
            name: item.menu_meals?.meals?.name || 'Unknown Meal',
            category: item.menu_meals?.meals?.category || 'other',
            image_url: item.menu_meals?.meals?.image_url || null,
          },
        }));
        return parsed;
      })
      .filter((o: any) => {
        const cleanPh = formattedTerm.replace(/[^\d]/g, '');
        const itemPh = (o.customer_phone || '').replace(/[^\d]/g, '');
        const itemCo = (o.pickup_code_direct || '').toUpperCase();
        return (cleanPh && itemPh.includes(cleanPh)) || itemCo.includes(formattedTerm);
      });
  },

  /**
   * Fetches specific order along with items for tracking & detailing
   */
  async getOrderById(orderId: string): Promise<DetailedOrder | null> {
    if (!isSupabaseConfigured) {
      const match = MOCK_ORDERS.find((o) => o.id === orderId);
      return match ? parseGuestOrder(match) : null;
    }

    const { data: order, error } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        profiles(
          full_name,
          email,
          phone
        ),
        items:order_items(
          id,
          menu_meal_id,
          quantity,
          unit_price,
          menu_meals(
            meals(
              name,
              category,
              image_url
            )
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error(`Error querying order ${orderId}:`, error);
      return null;
    }

    if (!order) return null;

    const parsed = parseGuestOrder(order);
    parsed.items = (order.items as any[]).map((item) => ({
      id: item.id,
      menu_meal_id: item.menu_meal_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      meal: {
        name: item.menu_meals?.meals?.name || 'Unknown Meal',
        category: item.menu_meals?.meals?.category || 'other',
        image_url: item.menu_meals?.meals?.image_url || null,
      },
    }));

    return parsed;
  },

  /**
   * Admin-only: Fetch all student orders sorted by date
   */
  async getAllOrders(): Promise<DetailedOrder[]> {
    if (!isSupabaseConfigured) {
      return MOCK_ORDERS.map(o => parseGuestOrder(o));
    }

    const { data: orders, error } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        profiles(
          full_name,
          email,
          phone
        ),
        items:order_items(
          id,
          menu_meal_id,
          quantity,
          unit_price,
          menu_meals(
            meals(
              name,
              category,
              image_url
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all customer orders:', error);
      throw error;
    }

    return (orders || []).map((o: any) => {
      const parsed = parseGuestOrder(o);
      parsed.items = o.items.map((item: any) => ({
        id: item.id,
        menu_meal_id: item.menu_meal_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        meal: {
          name: item.menu_meals?.meals?.name || 'Unknown Meal',
          category: item.menu_meals?.meals?.category || 'other',
          image_url: item.menu_meals?.meals?.image_url || null,
        },
      }));
      return parsed;
    });
  },

  /**
   * Action to transition order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = MOCK_ORDERS.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        MOCK_ORDERS[idx].status = status;
        MOCK_ORDERS[idx].updated_at = new Date().toISOString();
      }
      return;
    }

    const { error } = await (supabase as any)
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error(`Failed to update status on order ${orderId}:`, error);
      throw error;
    }
  },
};
