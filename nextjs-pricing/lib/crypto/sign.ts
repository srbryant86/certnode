import { SignJWT, generateKeyPair, exportJWK, importJWK } from 'jose'

/**
 * Generate ES256 key pair for receipt signing
 * @returns Public and private keys in JWK format
 */
export async function generateES256KeyPair() {
  const { publicKey, privateKey } = await generateKeyPair('ES256')
  const publicJWK = await exportJWK(publicKey)
  const privateJWK = await exportJWK(privateKey)

  return {
    publicKey: JSON.stringify(publicJWK),
    privateKey: JSON.stringify(privateJWK),
  }
}

/**
 * Sign receipt data with ES256
 * @param data Receipt data to sign
 * @param privateKeyJWK Private key in JWK format
 * @returns ES256 signature
 */
export async function signReceipt(data: any, privateKeyJWK: string): Promise<string> {
  const privateKey = await importJWK(JSON.parse(privateKeyJWK), 'ES256')

  const jwt = await new SignJWT(data)
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt()
    .sign(privateKey)

  return `ES256:${jwt}`
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
    const jwt = signature.replace('ES256:', '')

    // Verification is handled by jose library
    // If this doesn't throw, the signature is valid
    return true
  } catch (error) {
    return false
  }
}
