import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { KeyStatus } from "@prisma/client";
import { verifyPassword } from "@/lib/password";

export interface ApiAuthResult {
  success: boolean;
  enterpriseId?: string;
  apiKeyId?: string;
  user?: any;
  enterprise?: any;
  apiKey?: any;
  error?: string;
}

/**
 * Authenticate and authorize API requests using x-api-key header
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiAuthResult> {
  const apiKeyHeader = request.headers.get('x-api-key');

  if (!apiKeyHeader) {
    return {
      success: false,
      error: "API key required in x-api-key header"
    };
  }

  try {
    // Find all active API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        status: KeyStatus.ACTIVE
      },
      include: {
        enterprise: {
          select: {
            id: true,
            tier: true
          }
        }
      }
    });

    // Check each key to find a match
    for (const apiKey of apiKeys) {
      const isValid = await verifyPassword(apiKeyHeader, apiKey.keyHash);
      if (isValid) {
        return {
          success: true,
          enterpriseId: apiKey.enterpriseId,
          apiKeyId: apiKey.id,
          enterprise: apiKey.enterprise,
          apiKey: apiKey
        };
      }
    }

    return {
      success: false,
      error: "Invalid or revoked API key"
    };

  } catch (error) {
    console.error('API key authentication error:', error);
    return {
      success: false,
      error: "Authentication failed"
    };
  }
}

/**
 * Check if API key has required permissions for the operation
 */
export function hasPermission(permissions: string, requiredPermission: string): boolean {
  try {
    const permList = JSON.parse(permissions || "[]") as string[];
    return permList.includes(requiredPermission) || permList.includes("*");
  } catch {
    // If permissions field is malformed, deny access
    return false;
  }
}