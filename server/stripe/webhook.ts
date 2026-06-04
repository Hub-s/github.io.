import { Router, raw } from 'express';
import Stripe from 'stripe';
import { ENV } from '../_core/env';
import * as db from '../db';
import { notifyOwner } from '../_core/notification';

const stripe = new Stripe(ENV.stripeSecretKey!);

export const stripeWebhookRouter = Router();

// Webhook endpoint - must use raw body for signature verification
stripeWebhookRouter.post(
  '/webhook',
  raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || !ENV.stripeWebhookSecret) {
      console.error('[Stripe Webhook] Missing signature or webhook secret');
      return res.status(400).send('Missing signature or webhook secret');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        ENV.stripeWebhookSecret
      );
    } catch (err: any) {
      console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle test events
    if (event.id.startsWith('evt_test_')) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ 
        verified: true,
      });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentSucceeded(paymentIntent);
          break;
        }
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe Webhook] Subscription ${event.type}: ${subscription.id}`);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe Webhook] Subscription cancelled: ${subscription.id}`);
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Stripe Webhook] Error processing event: ${error}`);
      return res.status(500).send('Webhook processing error');
    }

    res.json({ received: true });
  }
);

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe] Checkout completed: ${session.id}`);
  
  const memberId = session.metadata?.member_id;
  const planType = session.metadata?.plan_type;
  const memberName = session.metadata?.member_name;
  
  if (memberId && planType) {
    // Create payment record
    const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0';
    
    await db.createPayment({
      memberId: parseInt(memberId),
      amount,
      paymentMethod: 'stripe',
      status: 'paid',
      stripePaymentId: session.payment_intent as string,
      description: `Pagamento via Stripe - ${planType}`,
    });

    // Update member status to active
    await db.updateMember(parseInt(memberId), {
      status: 'active',
    });

    // Send notification to owner
    await notifyOwner({
      title: 'Pagamento Stripe Recebido',
      content: `Pagamento de R$ ${amount} recebido de ${memberName || 'Membro'} via Stripe`,
    });
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe] Payment succeeded: ${paymentIntent.id}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`[Stripe] Invoice paid: ${invoice.id}`);
  
  const subscriptionId = (invoice as any).subscription as string;
  const customerId = invoice.customer as string;
  
  if (subscriptionId) {
    console.log(`[Stripe] Subscription payment: ${subscriptionId} for customer ${customerId}`);
  }
}
