import { orderService } from './orders';

export const web3FormsService = {
  getAccessKey(): string {
    return (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string) || '';
  },

  async sendContactMessage(name: string, email: string, message: string): Promise<boolean> {
    const key = this.getAccessKey();
    if (!key) {
      console.warn('Web3Forms Access Key is not configured in environment variables (VITE_WEB3FORMS_ACCESS_KEY). Simulated success.');
      // Simulating success so user experience is not blocked in preview
      await new Promise((r) => setTimeout(r, 1000));
      return true;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: key,
          name: name,
          email: email,
          message: message,
          subject: `New Contact Inquiry from ${name}`,
          from_name: 'JDH Kitchen Hub',
        }),
      });

      const result = await response.json();
      return !!result.success;
    } catch (error) {
      console.error('Error sending Web3Forms contact message:', error);
      return false;
    }
  },

  async sendOrderPlacedNotification(
    orderId: string,
    totalAmount: number,
    txRef?: string,
    proofImageUrl?: string
  ): Promise<boolean> {
    const key = this.getAccessKey();
    if (!key) {
      console.warn('Web3Forms Access Key is not configured for order notifications (VITE_WEB3FORMS_ACCESS_KEY). Simulated success.');
      return true;
    }

    try {
      // Fetch order details for rich notification
      const order = await orderService.getOrderById(orderId);

      let customerName = 'Unknown Student';
      let customerPhone = 'N/A';
      let customerEmail = 'N/A';
      let orderItemsStr = '';

      if (order) {
        if (order.profiles) {
          customerName = order.profiles.full_name || customerName;
          customerPhone = order.profiles.phone || customerPhone;
          customerEmail = order.profiles.email || customerEmail;
        }

        if (order.items && order.items.length > 0) {
          orderItemsStr = order.items
            .map((item: any) => {
              const mealName = item.meal?.name || 'Co-op Meal';
              const quantityStr = `${item.quantity}x`;
              const priceStr = `₦${(item.unit_price || 0).toLocaleString()}`;
              return `- ${quantityStr} ${mealName} (${priceStr} each)`;
            })
            .join('\n');
        }
      }

      const formattedMessage = `
🔔 NEW PAID PRE-ORDER RECEIVED

An order has been placed and payment proof has been submitted by the student.

--- ORDER SUMMARY ---
Order ID: ${orderId}
Total Amount: ₦${totalAmount.toLocaleString()}
Hostel/Room No: ${order?.room_number || 'N/A'}
Notes: ${order?.notes || 'None'}

--- CUSTOMER INFO ---
Name: ${customerName}
Phone: ${customerPhone}
Email: ${customerEmail}

--- MEALS ORDERED ---
${orderItemsStr || 'No details retrieved'}

--- PAYMENT REFERENCE ---
Student Ref: ${txRef || 'None provided'}
Proof Image URL: ${proofImageUrl || 'No receipt URL provided'}

Please log in to the JDH Kitchen Admin Dashboard to Approve or Reject this payment proof.
      `.trim();

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: key,
          name: 'JDH Kitchen System',
          email: 'system@jdh-kitchen.com',
          message: formattedMessage,
          subject: `🔔 New Paid Pre-Order (₦${totalAmount.toLocaleString()}) - ${customerName}`,
          from_name: 'JDH Kitchen Co-Op System',
        }),
      });

      const result = await response.json();
      return !!result.success;
    } catch (error) {
      console.error('Error sending Web3Forms order notification:', error);
      return false;
    }
  },
};
