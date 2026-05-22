// Payment service using Stripe
import axios from 'axios';

const STRIPE_API_URL = 'https://api.stripe.com/v1'; // Backend endpoint to handle payments

export async function createPaymentIntent(amount, currency = 'INR') {
  try {
    const response = await axios.post(`${STRIPE_API_URL}/payment_intents`, {
      amount: Math.round(amount * 100), // Convert to cents/paise
      currency,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Payment failed: ${error.message}`);
  }
}

export async function confirmPayment(paymentIntentId, paymentMethodId) {
  try {
    const response = await axios.post(`${STRIPE_API_URL}/payment_intents/${paymentIntentId}/confirm`, {
      payment_method: paymentMethodId,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Payment confirmation failed: ${error.message}`);
  }
}
