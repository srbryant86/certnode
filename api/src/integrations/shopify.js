/**
 * Shopify Integration
 *
 * Automatically creates CertNode receipts for Shopify events:
 * - orders/create → transaction receipt
 * - orders/fulfilled → operations receipt
 * - refunds/create → transaction receipt (linked to original)
 * - disputes/create → operations receipt
 *
 * Setup in Shopify:
 * Settings → Notifications → Webhooks → Create webhook
 * URL: https://certnode.io/api/integrations/shopify
 */

const { createReceipt, findParentReceipt } = require('./index');

async function handleShopifyWebhook(topic, data, apiKey, enterpriseId) {
  switch (topic) {
    case 'orders/create':
    case 'orders/paid':
      return await handleOrderCreated(data, apiKey, enterpriseId);

    case 'orders/fulfilled':
      return await handleOrderFulfilled(data, apiKey, enterpriseId);

    case 'refunds/create':
      return await handleRefundCreated(data, apiKey, enterpriseId);

    case 'disputes/create':
      return await handleDisputeCreated(data, apiKey, enterpriseId);

    case 'disputes/update':
      return await handleDisputeUpdated(data, apiKey, enterpriseId);

    case 'checkouts/create':
      return await handleCheckoutCreated(data, apiKey, enterpriseId);

    case 'orders/cancelled':
      return await handleOrderCancelled(data, apiKey, enterpriseId);

    default:
      console.log(`Unhandled Shopify event: ${topic}`);
      return null;
  }
}

async function handleOrderCreated(data, apiKey, enterpriseId) {
  return await createReceipt({
    apiKey,
    domain: 'transaction',
    type: 'shopify-order',
    data: {
      shopify_order_id: data.id,
      order_number: data.order_number,
      total_price: data.total_price,
      subtotal_price: data.subtotal_price,
      currency: data.currency,
      customer_email: data.customer?.email,
      customer_name: `${data.customer?.first_name} ${data.customer?.last_name}`,
      payment_status: data.financial_status,
      fulfillment_status: data.fulfillment_status,
      line_items: data.line_items?.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.title,
        quantity: item.quantity,
        price: item.price
      })),
      shipping_address: data.shipping_address,
      created_at: data.created_at,
      external_id: data.id
    },
    parentIds: []
  });
}

async function handleOrderFulfilled(data, apiKey, enterpriseId) {
  // Link to original order receipt
  const parentReceipt = await findParentReceipt(enterpriseId, data.id);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'shopify-fulfillment',
    data: {
      shopify_order_id: data.id,
      order_number: data.order_number,
      fulfillment_status: data.fulfillment_status,
      tracking_company: data.fulfillments?.[0]?.tracking_company,
      tracking_number: data.fulfillments?.[0]?.tracking_number,
      tracking_url: data.fulfillments?.[0]?.tracking_url,
      shipped_at: data.fulfillments?.[0]?.created_at,
      line_items: data.fulfillments?.[0]?.line_items
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleRefundCreated(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.order_id);

  return await createReceipt({
    apiKey,
    domain: 'transaction',
    type: 'shopify-refund',
    data: {
      shopify_order_id: data.order_id,
      refund_id: data.id,
      refund_amount: data.total_refund,
      currency: data.currency,
      reason: data.note,
      refund_line_items: data.refund_line_items,
      created_at: data.created_at
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleDisputeCreated(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.order_id);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'shopify-dispute',
    data: {
      shopify_order_id: data.order_id,
      dispute_id: data.id,
      dispute_type: data.type,
      reason: data.reason,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      evidence_due_by: data.evidence_due_by,
      created_at: data.created_at
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleDisputeUpdated(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.order_id);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'shopify-dispute-updated',
    data: {
      shopify_order_id: data.order_id,
      dispute_id: data.id,
      status: data.status,
      resolution: data.resolution,
      updated_at: data.updated_at
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleCheckoutCreated(data, apiKey, enterpriseId) {
  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'shopify-checkout-created',
    data: {
      checkout_id: data.id,
      customer_email: data.email,
      total_price: data.total_price,
      currency: data.currency,
      abandoned: data.abandoned,
      created_at: data.created_at,
      line_items: data.line_items
    },
    parentIds: []
  });
}

async function handleOrderCancelled(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.id);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'shopify-order-cancelled',
    data: {
      shopify_order_id: data.id,
      order_number: data.order_number,
      cancel_reason: data.cancel_reason,
      cancelled_at: data.cancelled_at
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

module.exports = {
  handleShopifyWebhook
};
