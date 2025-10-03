/**
 * Stripe Integration
 *
 * Automatically creates CertNode receipts for Stripe events:
 * - charge.succeeded → transaction receipt
 * - charge.refunded → transaction receipt (linked)
 * - charge.dispute.created → operations receipt
 * - payment_intent.succeeded → transaction receipt
 * - customer.subscription.created → transaction receipt
 *
 * Setup in Stripe:
 * Developers → Webhooks → Add endpoint
 * URL: https://certnode.io/api/integrations/stripe
 */

const { createReceipt, findParentReceipt } = require('./index');

async function handleStripeWebhook(event, apiKey, enterpriseId) {
  const { type, data } = event;

  switch (type) {
    case 'charge.succeeded':
      return await handleChargeSucceeded(data.object, apiKey, enterpriseId);

    case 'charge.refunded':
      return await handleChargeRefunded(data.object, apiKey, enterpriseId);

    case 'charge.dispute.created':
      return await handleDisputeCreated(data.object, apiKey, enterpriseId);

    case 'charge.dispute.updated':
      return await handleDisputeUpdated(data.object, apiKey, enterpriseId);

    case 'charge.dispute.closed':
      return await handleDisputeClosed(data.object, apiKey, enterpriseId);

    case 'payment_intent.succeeded':
      return await handlePaymentIntentSucceeded(data.object, apiKey, enterpriseId);

    case 'customer.subscription.created':
      return await handleSubscriptionCreated(data.object, apiKey, enterpriseId);

    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(data.object, apiKey, enterpriseId);

    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(data.object, apiKey, enterpriseId);

    case 'invoice.payment_succeeded':
      return await handleInvoicePaymentSucceeded(data.object, apiKey, enterpriseId);

    default:
      console.log(`Unhandled Stripe event: ${type}`);
      return null;
  }
}

async function handleChargeSucceeded(charge, apiKey, enterpriseId) {
  return await createReceipt({
    apiKey,
    domain: 'transaction',
    type: 'stripe-charge',
    data: {
      stripe_charge_id: charge.id,
      amount: charge.amount / 100, // Convert from cents
      currency: charge.currency.toUpperCase(),
      customer_id: charge.customer,
      customer_email: charge.billing_details?.email,
      payment_method: charge.payment_method_details?.type,
      card_last4: charge.payment_method_details?.card?.last4,
      card_brand: charge.payment_method_details?.card?.brand,
      status: charge.status,
      receipt_url: charge.receipt_url,
      description: charge.description,
      metadata: charge.metadata,
      created_at: new Date(charge.created * 1000).toISOString(),
      external_id: charge.id
    },
    parentIds: []
  });
}

async function handleChargeRefunded(charge, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, charge.id);

  return await createReceipt({
    apiKey,
    domain: 'transaction',
    type: 'stripe-refund',
    data: {
      stripe_charge_id: charge.id,
      refund_amount: charge.amount_refunded / 100,
      currency: charge.currency.toUpperCase(),
      refund_reason: charge.refunds?.data?.[0]?.reason,
      refund_status: charge.refunds?.data?.[0]?.status,
      refunded_at: new Date().toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleDisputeCreated(dispute, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, dispute.charge);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'stripe-dispute-created',
    data: {
      dispute_id: dispute.id,
      stripe_charge_id: dispute.charge,
      amount: dispute.amount / 100,
      currency: dispute.currency.toUpperCase(),
      reason: dispute.reason,
      status: dispute.status,
      evidence_due_by: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
      created_at: new Date(dispute.created * 1000).toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleDisputeUpdated(dispute, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, dispute.charge);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'stripe-dispute-updated',
    data: {
      dispute_id: dispute.id,
      stripe_charge_id: dispute.charge,
      status: dispute.status,
      evidence_submitted: dispute.evidence_details?.has_evidence,
      updated_at: new Date().toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleDisputeClosed(dispute, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, dispute.charge);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'stripe-dispute-closed',
    data: {
      dispute_id: dispute.id,
      stripe_charge_id: dispute.charge,
      status: dispute.status,
      outcome: dispute.evidence_details?.outcome,
      closed_at: new Date().toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handlePaymentIntentSucceeded(paymentIntent, apiKey, enterpriseId) {
  return await createReceipt({
    apiKey,
    domain: 'transaction',
    type: 'stripe-payment-intent',
    data: {
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      customer_id: paymentIntent.customer,
      payment_method: paymentIntent.payment_method,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
      external_id: paymentIntent.id
    },
    parentIds: []
  });
}

async function handleSubscriptionCreated(subscription, apiKey, enterpriseId) {
  return await createReceipt({
    apiKey,
    domain: 'transaction',
    type: 'stripe-subscription-created',
    data: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: subscription.status,
      plan_id: subscription.items?.data?.[0]?.price?.id,
      plan_amount: subscription.items?.data?.[0]?.price?.unit_amount / 100,
      currency: subscription.currency.toUpperCase(),
      interval: subscription.items?.data?.[0]?.price?.recurring?.interval,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date(subscription.created * 1000).toISOString(),
      external_id: subscription.id
    },
    parentIds: []
  });
}

async function handleSubscriptionUpdated(subscription, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, subscription.id);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'stripe-subscription-updated',
    data: {
      subscription_id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleSubscriptionDeleted(subscription, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, subscription.id);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'stripe-subscription-cancelled',
    data: {
      subscription_id: subscription.id,
      cancellation_reason: subscription.cancellation_details?.reason,
      cancelled_at: new Date(subscription.canceled_at * 1000).toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleInvoicePaymentSucceeded(invoice, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, invoice.subscription);

  return await createReceipt({
    apiKey,
    domain: 'transaction',
    type: 'stripe-invoice-paid',
    data: {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      customer_id: invoice.customer,
      amount_paid: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      invoice_pdf: invoice.invoice_pdf,
      paid_at: new Date(invoice.status_transitions?.paid_at * 1000).toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

module.exports = {
  handleStripeWebhook
};
