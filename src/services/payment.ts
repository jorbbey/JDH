/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database, ProofStatus } from '../types/database.types';

export type PaymentProofRow = Database['public']['Tables']['payment_proofs']['Row'];

export interface PaymentProofInput {
  order_id: string;
  transaction_reference?: string;
  proof_image_url: string;
}

const MOCK_PROOFS: PaymentProofRow[] = [];

/**
 * Service representing manual student payments verification
 */
export const paymentService = {
  /**
   * Submits bank transfer receipt details and transitions the student order status to 'payment_under_verification'
   */
  async submitPaymentProof(input: PaymentProofInput): Promise<PaymentProofRow> {
    if (!isSupabaseConfigured) {
      const mockResult: PaymentProofRow = {
        id: `proof-${Date.now()}`,
        order_id: input.order_id,
        transaction_reference: input.transaction_reference || null,
        proof_image_url: input.proof_image_url,
        status: 'pending',
        verified_by: null,
        verified_at: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_PROOFS.push(mockResult);
      return mockResult;
    }

    // 1. Write receipt reference and image URL to payment_proofs table
    const { data: proof, error: proofError } = await (supabase as any)
      .from('payment_proofs')
      .insert({
        order_id: input.order_id,
        transaction_reference: input.transaction_reference || null,
        proof_image_url: input.proof_image_url,
        status: 'pending',
      })
      .select()
      .single();

    if (proofError) {
      console.error('Error recording payment receipt:', proofError);
      throw proofError;
    }

    if (!proof) {
      throw new Error('Failed to create payment proof record');
    }

    // 2. Transition target order status to let the admin know there is a verification task
    const { error: orderError } = await (supabase as any)
      .from('orders')
      .update({ status: 'payment_under_verification' })
      .eq('id', input.order_id);

    if (orderError) {
      console.error('Payment proof recorded, but order status transition failed:', orderError);
    }

    return proof;
  },

  /**
   * Retrieves payment proof linked to a specific customer order
   */
  async getPaymentProofForOrder(orderId: string): Promise<PaymentProofRow | null> {
    if (!isSupabaseConfigured) {
      return MOCK_PROOFS.find((p) => p.order_id === orderId) || null;
    }

    const { data, error } = await (supabase as any)
      .from('payment_proofs')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) {
      console.error(`Error loading payment proof for order ${orderId}:`, error);
      return null;
    }

    return data;
  },

  /**
   * Admin-only: Verifies or rejects uploaded bank transfer receipts
   */
  async verifyPayment(
    proofId: string,
    orderId: string,
    approve: boolean,
    rejectionReason?: string
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      const proofIdx = MOCK_PROOFS.findIndex((p) => p.id === proofId);
      if (proofIdx !== -1) {
        MOCK_PROOFS[proofIdx].status = approve ? 'approved' : 'rejected';
        MOCK_PROOFS[proofIdx].rejection_reason = approve ? null : rejectionReason || 'Invalid receipt';
        MOCK_PROOFS[proofIdx].verified_at = new Date().toISOString();
        MOCK_PROOFS[proofIdx].verified_by = 'admin-id';
      }
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const adminId = authData?.user?.id || null;

    const newProofStatus: ProofStatus = approve ? 'approved' : 'rejected';
    const newOrderStatus = approve ? 'paid' : 'pending_payment';

    // 1. Update the payment proof record status
    const { error: proofError } = await (supabase as any)
      .from('payment_proofs')
      .update({
        status: newProofStatus,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejection_reason: approve ? null : rejectionReason || null,
      })
      .eq('id', proofId);

    if (proofError) {
      console.error(`Failed to verify proof with ID ${proofId}:`, proofError);
      throw proofError;
    }

    // 2. Adjust parent order status
    const { error: orderError } = await (supabase as any)
      .from('orders')
      .update({ status: newOrderStatus })
      .eq('id', orderId);

    if (orderError) {
      console.error(`Payment state resolved correctly, but failed to transition order ${orderId} state:`, orderError);
      throw orderError;
    }
  },

  /**
   * Production helper: Uploads student paper receipt images to Supabase Storage
   * Bucket: 'payment-proofs' (must exist and be public/authenticated bucket in Supabase dashboard)
   */
  async uploadProofImageFile(file: File): Promise<string> {
    if (!isSupabaseConfigured) {
      // Simulate slow cloud file upload upload in local preview
      await new Promise((resolve) => setTimeout(resolve, 800));
      return `https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600&mock-receipt=${Date.now()}`;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file);

    if (error) {
      console.error('Failure saving receipt in Supabase Storage:', error);
      throw error;
    }

    // Retrieve and return public image URL
    const { data: publicUrlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  },

  /**
   * Future Paystack implementation placeholder helper
   * Resolves Paystack web hook triggers or verification keys
   */
  async verifyPaystackTransaction(reference: string): Promise<{ success: boolean; data?: any }> {
    console.info(`Init placeholder Paystack verification for reference: ${reference}`);
    // Simulate real server-side transaction verification proxy ping
    await new Promise((r) => setTimeout(r, 1000));
    return { success: true, data: { channel: 'card', brand: 'visa', reference } };
  },
};
