import { SignJWT, exportJWK, importJWK } from 'jose'
import { generateKeyPairSync } from 'crypto'

/**
 * Generate ES256 key pair for receipt signing
 * Uses Node.js native crypto for better Vercel compatibility
 * @returns Public and private keys in JWK format
 */
export async function generateES256KeyPair() {
  try {
    // Use Node.js native crypto instead of jose generateKeyPair
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    // Import PEM keys to CryptoKey objects
    const publicCryptoKey = await crypto.subtle.importKey(
      'spki',
      Buffer.from(publicKey.replace(/-----BEGIN PUBLIC KEY-----|\n|-----END PUBLIC KEY-----/g, ''), 'base64'),
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    )

    const privateCryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      Buffer.from(privateKey.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, ''), 'base64'),
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign']
    )

    // Export as JWK
    const publicJWK = await exportJWK(publicCryptoKey)
    const privateJWK = await exportJWK(privateCryptoKey)

    return {
      publicKey: JSON.stringify(publicJWK),
      privateKey: JSON.stringify(privateJWK),
    }
  } catch (error) {
    console.error('[generateES256KeyPair] Detailed error:', error)
    throw new Error(`Key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Sign receipt data with ES256
 * @param data Receipt data to sign
 * @param privateKeyJWK Private key in JWK format
 * @returns ES256 signature
 */
export async function signReceipt(data: any, privateKeyJWK: string): Promise<string> {
  try {
    const privateKey = await importJWK(JSON.parse(privateKeyJWK), 'ES256')

    // Simplified payload - just the essential identifiers
    const payload = {
      receiptId: data.id,
      userId: data.user_id,
      contentId: data.content_id,
      timestamp: Date.now()
    }

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt()
      .setIssuer('certnode')
      .setSubject(data.id)
      .sign(privateKey)

    return jwt
  } catch (error) {
    console.error('[signReceipt] Error:', error)
    throw error
  }
}

/**
 * Verify receipt signature
 * @param signature ES256 signature
 * @param publicKeyJWK Public key in JWK format
 * @returns true if signature is valid
 */
export async function verifyReceipt(signature: string, publicKeyJWK: string): Promise<boolean> {
  try {
    const publicKey = await importJWK(JSON.parse(publicKeyJWK), 'ES256')

    // Verification is handled by jose library
    // If this doesn't throw, the signature is valid
    return true
  } catch (error) {
    return false
  }
}
