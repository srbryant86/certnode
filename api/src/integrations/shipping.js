/**
 * Shipping Integration (Shippo, ShipStation, EasyPost)
 *
 * Automatically creates CertNode receipts for shipping events:
 * - label_created → content receipt (shipping label)
 * - tracking_updated → operations receipt
 * - delivered → operations receipt
 * - exception → operations receipt (delivery failure)
 *
 * Setup:
 * Configure webhook in shipping provider dashboard
 * URL: https://certnode.io/api/integrations/shipping
 */

const { createReceipt, findParentReceipt } = require('./index');

/**
 * Handle Shippo webhooks
 */
async function handleShippoWebhook(event, apiKey, enterpriseId) {
  const { event: eventType, data } = event;

  switch (eventType) {
    case 'transaction_created':
      return await handleShippingLabelCreated(data, apiKey, enterpriseId, 'shippo');

    case 'track_updated':
      return await handleTrackingUpdate(data, apiKey, enterpriseId, 'shippo');

    default:
      console.log(`Unhandled Shippo event: ${eventType}`);
      return null;
  }
}

/**
 * Handle ShipStation webhooks
 */
async function handleShipStationWebhook(event, apiKey, enterpriseId) {
  const { resource_type, resource_url } = event;

  switch (resource_type) {
    case 'SHIP_NOTIFY':
      return await handleShipStationShipment(event, apiKey, enterpriseId);

    case 'ITEM_SHIP_NOTIFY':
      return await handleShipStationItemShipped(event, apiKey, enterpriseId);

    default:
      console.log(`Unhandled ShipStation event: ${resource_type}`);
      return null;
  }
}

/**
 * Generic shipping label created
 */
async function handleShippingLabelCreated(data, apiKey, enterpriseId, provider) {
  // Try to find parent order/payment receipt
  const parentReceipt = await findParentReceipt(enterpriseId, data.order_id || data.metadata?.order_id);

  return await createReceipt({
    apiKey,
    domain: 'content',
    type: `${provider}-shipping-label`,
    data: {
      provider,
      tracking_number: data.tracking_number,
      carrier: data.carrier,
      service_level: data.service_level?.name || data.service,
      label_url: data.label_url,
      tracking_url: data.tracking_url_provider,
      to_address: {
        name: data.address_to?.name,
        street: data.address_to?.street1,
        city: data.address_to?.city,
        state: data.address_to?.state,
        zip: data.address_to?.zip,
        country: data.address_to?.country
      },
      from_address: {
        name: data.address_from?.name,
        street: data.address_from?.street1,
        city: data.address_from?.city,
        state: data.address_from?.state,
        zip: data.address_from?.zip,
        country: data.address_from?.country
      },
      package: {
        weight: data.parcel?.weight,
        length: data.parcel?.length,
        width: data.parcel?.width,
        height: data.parcel?.height
      },
      cost: data.rate?.amount,
      currency: data.rate?.currency,
      created_at: data.object_created || new Date().toISOString(),
      external_id: data.tracking_number
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

/**
 * Tracking status updated
 */
async function handleTrackingUpdate(data, apiKey, enterpriseId, provider) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.tracking_number);

  const trackingStatus = data.tracking_status || data.status;

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: `${provider}-tracking-update`,
    data: {
      provider,
      tracking_number: data.tracking_number,
      carrier: data.carrier,
      status: trackingStatus?.status,
      status_details: trackingStatus?.status_details,
      status_date: trackingStatus?.status_date,
      location: trackingStatus?.location
        ? {
            city: trackingStatus.location.city,
            state: trackingStatus.location.state,
            zip: trackingStatus.location.zip,
            country: trackingStatus.location.country
          }
        : null,
      eta: data.eta,
      delivered: trackingStatus?.status === 'DELIVERED',
      delivery_signature: trackingStatus?.status === 'DELIVERED' ? trackingStatus.substatus : null,
      updated_at: new Date().toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

/**
 * ShipStation shipment created
 */
async function handleShipStationShipment(event, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, event.order_number);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'shipstation-shipment',
    data: {
      provider: 'shipstation',
      order_number: event.order_number,
      tracking_number: event.tracking_number,
      carrier: event.carrier,
      service: event.service,
      ship_date: event.ship_date,
      void_requested: event.void_requested,
      voided: event.voided
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

/**
 * ShipStation item shipped
 */
async function handleShipStationItemShipped(event, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, event.order_number);

  return await createReceipt({
    apiKey,
    domain: 'content',
    type: 'shipstation-item-shipped',
    data: {
      provider: 'shipstation',
      order_number: event.order_number,
      line_item_id: event.line_item_id,
      sku: event.sku,
      tracking_number: event.tracking_number,
      quantity: event.quantity,
      shipped_at: new Date().toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

/**
 * Delivery confirmation with photo (from delivery service)
 */
async function handleDeliveryConfirmation(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.tracking_number);

  return await createReceipt({
    apiKey,
    domain: 'content',
    type: 'delivery-photo',
    data: {
      tracking_number: data.tracking_number,
      carrier: data.carrier,
      photo_url: data.photo_url,
      signature: data.signature,
      delivered_to: data.delivered_to_name,
      delivery_location: data.delivery_location,
      delivered_at: data.delivered_at,
      gps_coordinates: data.gps_coordinates
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

module.exports = {
  handleShippoWebhook,
  handleShipStationWebhook,
  handleDeliveryConfirmation
};
