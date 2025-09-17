#!/usr/bin/env node

/**
 * E-commerce Order Receipt Example
 *
 * Demonstrates how to generate tamper-evident order confirmations using the CertNode standard.
 * This example shows infrastructure-first implementation - using the standard directly
 * rather than relying on a managed service.
 *
 * Features:
 * - Order data canonicalization (RFC 8785 JCS)
 * - ECDSA P-256 signature generation (RFC 7515 JWS)
 * - Receipt verification and validation
 * - Error handling and edge cases
 * - Performance optimization for high-volume scenarios
 */

const crypto = require('crypto');
const fs = require('fs').promises;

// Import CertNode SDK (npm install @certnode/sdk)
// For this example, we'll implement the core functionality directly
// to show the cryptographic operations clearly

class EcommerceReceiptGenerator {
    constructor() {
        // Generate ECDSA P-256 key pair for this example
        // In production, use proper key management and rotation
        this.keyPair = crypto.generateKeyPairSync('ec', {
            namedCurve: 'prime256v1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        // Extract key ID (JWK thumbprint) for JWKS compatibility
        this.keyId = this.generateKeyId(this.keyPair.publicKey);
    }

    /**
     * Generate CertNode-compliant receipt for an order
     */
    async generateOrderReceipt(orderData) {
        try {
            console.log('🛍️  Generating order receipt...');

            // 1. Validate order data
            this.validateOrderData(orderData);

            // 2. Add receipt metadata
            const enrichedOrder = {
                ...orderData,
                receipt_generated_at: new Date().toISOString(),
                receipt_version: '1.1.0',
                receipt_standard: 'CertNode'
            };

            // 3. Canonicalize JSON (RFC 8785 JCS)
            const canonicalPayload = this.canonicalizeJson(enrichedOrder);

            // 4. Create JWS protected header
            const protectedHeader = {
                alg: 'ES256',
                kid: this.keyId,
                typ: 'JWS'
            };

            const encodedHeader = this.base64UrlEncode(JSON.stringify(protectedHeader));
            const encodedPayload = this.base64UrlEncode(canonicalPayload);

            // 5. Create signature
            const signingInput = `${encodedHeader}.${encodedPayload}`;
            const signature = crypto.sign('sha256', Buffer.from(signingInput), this.keyPair.privateKey);
            const encodedSignature = this.base64UrlEncode(signature);

            // 6. Generate receipt ID (SHA-256 of complete JWS)
            const completeJws = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
            const receiptId = crypto.createHash('sha256').update(completeJws).digest('base64url');

            // 7. Create CertNode receipt
            const receipt = {
                protected: encodedHeader,
                payload: enrichedOrder,
                signature: encodedSignature,
                kid: this.keyId,
                payload_jcs_sha256: crypto.createHash('sha256').update(canonicalPayload).digest('base64url'),
                receipt_id: receiptId
            };

            console.log('✅ Order receipt generated successfully');
            console.log(`📋 Receipt ID: ${receiptId}`);
            console.log(`🔑 Key ID: ${this.keyId}`);

            return receipt;

        } catch (error) {
            console.error('❌ Failed to generate order receipt:', error.message);
            throw error;
        }
    }

    /**
     * Verify an order receipt using CertNode standard
     */
    async verifyOrderReceipt(receipt, publicKey = null) {
        try {
            console.log('🔍 Verifying order receipt...');

            // Use provided public key or fallback to our key pair for this example
            const verifyKey = publicKey || this.keyPair.publicKey;

            // 1. Reconstruct signing input
            const signingInput = `${receipt.protected}.${this.base64UrlEncode(JSON.stringify(receipt.payload))}`;

            // 2. Decode signature
            const signature = Buffer.from(receipt.signature, 'base64url');

            // 3. Verify signature
            const isValid = crypto.verify('sha256', Buffer.from(signingInput), verifyKey, signature);

            if (!isValid) {
                throw new Error('Invalid signature - receipt has been tampered with');
            }

            // 4. Verify receipt ID
            const completeJws = `${receipt.protected}.${this.base64UrlEncode(JSON.stringify(receipt.payload))}.${receipt.signature}`;
            const calculatedReceiptId = crypto.createHash('sha256').update(completeJws).digest('base64url');

            if (calculatedReceiptId !== receipt.receipt_id) {
                throw new Error('Receipt ID mismatch - data integrity compromised');
            }

            console.log('✅ Receipt verification successful');
            console.log('🔒 Signature valid - no tampering detected');
            console.log(`📋 Receipt ID confirmed: ${receipt.receipt_id}`);

            return {
                valid: true,
                receipt_id: receipt.receipt_id,
                order_id: receipt.payload.order_id,
                verified_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Receipt verification failed:', error.message);
            return {
                valid: false,
                error: error.message,
                verified_at: new Date().toISOString()
            };
        }
    }

    /**
     * Validate order data structure
     */
    validateOrderData(orderData) {
        const required = ['order_id', 'customer_id', 'items', 'total_amount', 'currency'];

        for (const field of required) {
            if (!orderData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        if (typeof orderData.total_amount !== 'number' || orderData.total_amount <= 0) {
            throw new Error('Total amount must be a positive number');
        }
    }

    /**
     * Canonicalize JSON according to RFC 8785 JCS
     */
    canonicalizeJson(data) {
        // Simplified JCS implementation - for production use a proper RFC 8785 library
        return JSON.stringify(data, Object.keys(data).sort());
    }

    /**
     * Base64URL encode without padding
     */
    base64UrlEncode(data) {
        if (typeof data === 'string') {
            data = Buffer.from(data, 'utf8');
        }
        return data.toString('base64url');
    }

    /**
     * Generate JWK thumbprint for key ID
     */
    generateKeyId(publicKey) {
        // Simplified key ID generation - in production use proper JWK thumbprint (RFC 7638)
        return crypto.createHash('sha256').update(publicKey).digest('base64url').substring(0, 12);
    }

    /**
     * Get JWKS for public key distribution
     */
    getJwks() {
        return {
            keys: [{
                kty: 'EC',
                crv: 'P-256',
                kid: this.keyId,
                use: 'sig',
                alg: 'ES256',
                // In production, include actual JWK coordinates
                x: 'example_x_coordinate',
                y: 'example_y_coordinate'
            }]
        };
    }
}

// Example usage and demonstration
async function demonstrateEcommerceReceipts() {
    console.log('🚀 CertNode E-commerce Receipt Example');
    console.log('=====================================\\n');

    // Initialize receipt generator
    const generator = new EcommerceReceiptGenerator();

    // Example order data
    const sampleOrder = {
        order_id: 'ORD-2025-001',
        customer_id: 'CUST-12345',
        customer_email: 'customer@example.com',
        items: [
            {
                product_id: 'PROD-001',
                name: 'Premium Widget',
                quantity: 2,
                unit_price: 29.99,
                total: 59.98
            },
            {
                product_id: 'PROD-002',
                name: 'Deluxe Gadget',
                quantity: 1,
                unit_price: 149.99,
                total: 149.99
            }
        ],
        subtotal: 209.97,
        tax: 21.00,
        shipping: 9.99,
        total_amount: 240.96,
        currency: 'USD',
        order_date: '2025-01-15T10:30:00Z',
        shipping_address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zip: '12345',
            country: 'US'
        }
    };

    try {
        // Generate receipt
        console.log('📦 Sample Order:');
        console.log(`   Order ID: ${sampleOrder.order_id}`);
        console.log(`   Customer: ${sampleOrder.customer_email}`);
        console.log(`   Total: $${sampleOrder.total_amount}`);
        console.log('');

        const receipt = await generator.generateOrderReceipt(sampleOrder);

        // Save receipt to file
        await fs.writeFile(
            'order-receipt.json',
            JSON.stringify(receipt, null, 2)
        );
        console.log('💾 Receipt saved to order-receipt.json\\n');

        // Verify the receipt
        const verification = await generator.verifyOrderReceipt(receipt);

        if (verification.valid) {
            console.log('🎉 Order receipt is cryptographically valid!');
            console.log('   ✓ No tampering detected');
            console.log('   ✓ Signature verification passed');
            console.log('   ✓ Receipt integrity confirmed');
        }

        // Demonstrate tamper detection
        console.log('\\n🧪 Testing tamper detection...');
        const tamperedReceipt = { ...receipt };
        tamperedReceipt.payload.total_amount = 1.00; // Tamper with amount

        const tamperedVerification = await generator.verifyOrderReceipt(tamperedReceipt);

        if (!tamperedVerification.valid) {
            console.log('🛡️  Tampering successfully detected!');
            console.log(`   ❌ ${tamperedVerification.error}`);
        }

        // Show JWKS for key distribution
        console.log('\\n🔑 JWKS for public key distribution:');
        console.log(JSON.stringify(generator.getJwks(), null, 2));

    } catch (error) {
        console.error('💥 Example failed:', error.message);
        process.exit(1);
    }
}

// Performance testing for high-volume scenarios
async function performanceTest() {
    console.log('\\n⚡ Performance Test (1000 receipts)');
    console.log('====================================');

    const generator = new EcommerceReceiptGenerator();
    const startTime = Date.now();

    for (let i = 0; i < 1000; i++) {
        const testOrder = {
            order_id: `PERF-${i.toString().padStart(4, '0')}`,
            customer_id: `CUST-${Math.floor(Math.random() * 10000)}`,
            items: [{ product_id: 'PROD-001', name: 'Test Item', quantity: 1, unit_price: 10.00, total: 10.00 }],
            total_amount: 10.00,
            currency: 'USD'
        };

        await generator.generateOrderReceipt(testOrder);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Generated 1000 receipts in ${duration}ms`);
    console.log(`📊 Average: ${(duration / 1000).toFixed(2)}ms per receipt`);
    console.log(`🚀 Throughput: ${Math.round(1000 * 1000 / duration)} receipts/second`);
}

// Run the example
if (require.main === module) {
    demonstrateEcommerceReceipts()
        .then(() => performanceTest())
        .then(() => {
            console.log('\\n🎯 Example complete! Ready for production integration.');
            console.log('📚 Next steps:');
            console.log('   • Implement proper key management');
            console.log('   • Add JWKS endpoint for public keys');
            console.log('   • Integrate with your order processing system');
            console.log('   • Set up receipt storage and retrieval');
        })
        .catch(error => {
            console.error('Example failed:', error);
            process.exit(1);
        });
}

module.exports = { EcommerceReceiptGenerator };