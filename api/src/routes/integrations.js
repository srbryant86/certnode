/**
 * CertNode Integration Endpoints
 *
 * Turnkey webhook receivers for popular platforms.
 * Customers configure their platform to send webhooks here,
 * and CertNode automatically creates receipts.
 */

const express = require('express');
const router = express.Router();

const { verifyWebhookSignature } = require('../integrations');
const { handleKajabiWebhook } = require('../integrations/kajabi');
const { handleShopifyWebhook } = require('../integrations/shopify');
const { handleStripeWebhook } = require('../integrations/stripe');
const { handleShippoWebhook, handleShipStationWebhook } = require('../integrations/shipping');

/**
 * Extract enterprise info from custom header or API key
 * In production, this would query the database
 */
function getEnterpriseFromRequest(req) {
  const apiKey = req.headers['x-certnode-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  // Mock enterprise data
  return {
    id: 'ent_123',
    apiKey: apiKey,
    webhookSecret: process.env.WEBHOOK_SECRET || 'test_secret'
  };
}

/**
 * Kajabi Integration
 * POST /api/integrations/kajabi
 */
router.post('/kajabi', async (req, res) => {
  try {
    const enterprise = getEnterpriseFromRequest(req);
    const event = req.body;

    console.log(`[Kajabi] Received event: ${event.type}`);

    const receipt = await handleKajabiWebhook(event, enterprise.apiKey, enterprise.id);

    if (receipt) {
      res.json({
        success: true,
        receipt_id: receipt.id,
        message: `Receipt created for ${event.type}`
      });
    } else {
      res.json({
        success: true,
        message: `Event ${event.type} acknowledged but not processed`
      });
    }
  } catch (error) {
    console.error('[Kajabi] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Shopify Integration
 * POST /api/integrations/shopify
 */
router.post('/shopify', async (req, res) => {
  try {
    const enterprise = getEnterpriseFromRequest(req);
    const topic = req.headers['x-shopify-topic'];
    const hmac = req.headers['x-shopify-hmac-sha256'];

    // Verify Shopify signature
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyWebhookSignature('shopify', rawBody, hmac, enterprise.webhookSecret);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    console.log(`[Shopify] Received event: ${topic}`);

    const receipt = await handleShopifyWebhook(topic, req.body, enterprise.apiKey, enterprise.id);

    if (receipt) {
      res.json({
        success: true,
        receipt_id: receipt.id,
        message: `Receipt created for ${topic}`
      });
    } else {
      res.json({
        success: true,
        message: `Event ${topic} acknowledged but not processed`
      });
    }
  } catch (error) {
    console.error('[Shopify] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Stripe Integration
 * POST /api/integrations/stripe
 */
router.post('/stripe', async (req, res) => {
  try {
    const enterprise = getEnterpriseFromRequest(req);
    const signature = req.headers['stripe-signature'];
    const event = req.body;

    // In production, use Stripe's webhook verification:
    // const stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    console.log(`[Stripe] Received event: ${event.type}`);

    const receipt = await handleStripeWebhook(event, enterprise.apiKey, enterprise.id);

    if (receipt) {
      res.json({
        success: true,
        receipt_id: receipt.id,
        message: `Receipt created for ${event.type}`
      });
    } else {
      res.json({
        success: true,
        message: `Event ${event.type} acknowledged but not processed`
      });
    }
  } catch (error) {
    console.error('[Stripe] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Shippo Integration
 * POST /api/integrations/shippo
 */
router.post('/shippo', async (req, res) => {
  try {
    const enterprise = getEnterpriseFromRequest(req);
    const event = req.body;

    console.log(`[Shippo] Received event: ${event.event}`);

    const receipt = await handleShippoWebhook(event, enterprise.apiKey, enterprise.id);

    if (receipt) {
      res.json({
        success: true,
        receipt_id: receipt.id,
        message: `Receipt created for ${event.event}`
      });
    } else {
      res.json({
        success: true,
        message: `Event ${event.event} acknowledged but not processed`
      });
    }
  } catch (error) {
    console.error('[Shippo] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ShipStation Integration
 * POST /api/integrations/shipstation
 */
router.post('/shipstation', async (req, res) => {
  try {
    const enterprise = getEnterpriseFromRequest(req);
    const event = req.body;

    console.log(`[ShipStation] Received event: ${event.resource_type}`);

    const receipt = await handleShipStationWebhook(event, enterprise.apiKey, enterprise.id);

    if (receipt) {
      res.json({
        success: true,
        receipt_id: receipt.id,
        message: `Receipt created for ${event.resource_type}`
      });
    } else {
      res.json({
        success: true,
        message: `Event ${event.resource_type} acknowledged but not processed`
      });
    }
  } catch (error) {
    console.error('[ShipStation] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Teachable Integration (similar to Kajabi)
 * POST /api/integrations/teachable
 */
router.post('/teachable', async (req, res) => {
  try {
    const enterprise = getEnterpriseFromRequest(req);
    const event = req.body;

    console.log(`[Teachable] Received event: ${event.event_type}`);

    // Teachable events are similar to Kajabi, can reuse handler
    const kajabi Style event = {
      type: event.event_type,
      data: event.data
    };

    const receipt = await handleKajabiWebhook(kajabiStyleEvent, enterprise.apiKey, enterprise.id);

    if (receipt) {
      res.json({
        success: true,
        receipt_id: receipt.id,
        message: `Receipt created for ${event.event_type}`
      });
    } else {
      res.json({
        success: true,
        message: `Event ${event.event_type} acknowledged but not processed`
      });
    }
  } catch (error) {
    console.error('[Teachable] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * WooCommerce Integration
 * POST /api/integrations/woocommerce
 */
router.post('/woocommerce', async (req, res) => {
  try {
    const enterprise = getEnterpriseFromRequest(req);
    const topic = req.headers['x-wc-webhook-topic'];
    const signature = req.headers['x-wc-webhook-signature'];
    const event = req.body;

    console.log(`[WooCommerce] Received event: ${topic}`);

    // WooCommerce events map to Shopify-style handling
    const receipt = await handleShopifyWebhook(topic, event, enterprise.apiKey, enterprise.id);

    if (receipt) {
      res.json({
        success: true,
        receipt_id: receipt.id,
        message: `Receipt created for ${topic}`
      });
    } else {
      res.json({
        success: true,
        message: `Event ${topic} acknowledged but not processed`
      });
    }
  } catch (error) {
    console.error('[WooCommerce] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Integration status endpoint
 * GET /api/integrations/status
 */
router.get('/status', (req, res) => {
  res.json({
    integrations: {
      kajabi: { status: 'active', endpoint: '/api/integrations/kajabi' },
      shopify: { status: 'active', endpoint: '/api/integrations/shopify' },
      stripe: { status: 'active', endpoint: '/api/integrations/stripe' },
      shippo: { status: 'active', endpoint: '/api/integrations/shippo' },
      shipstation: { status: 'active', endpoint: '/api/integrations/shipstation' },
      teachable: { status: 'active', endpoint: '/api/integrations/teachable' },
      woocommerce: { status: 'active', endpoint: '/api/integrations/woocommerce' }
    },
    documentation: 'https://certnode.io/docs/integrations'
  });
});

module.exports = router;
