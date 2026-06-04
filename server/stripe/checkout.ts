import Stripe from 'stripe';
import { ENV } from '../_core/env';
import { GYMHUB_PRODUCTS, getPlanByType } from './products';

const stripe = new Stripe(ENV.stripeSecretKey!);

interface CreateCheckoutParams {
  memberId: number;
  memberName: string;
  memberEmail?: string | null;
  planType: string;
  origin: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string> {
  const { memberId, memberName, memberEmail, planType, origin } = params;
  
  const plan = getPlanByType(planType);
  if (!plan) {
    throw new Error(`Invalid plan type: ${planType}`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${origin}/financeiro?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/financeiro?cancelled=true`,
    customer_email: memberEmail || undefined,
    client_reference_id: memberId.toString(),
    allow_promotion_codes: true,
    metadata: {
      member_id: memberId.toString(),
      member_name: memberName,
      plan_type: planType,
      customer_email: memberEmail || '',
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session.url;
}

export async function getPaymentHistory(customerId: string): Promise<Stripe.PaymentIntent[]> {
  const paymentIntents = await stripe.paymentIntents.list({
    customer: customerId,
    limit: 100,
  });
  
  return paymentIntents.data;
}
