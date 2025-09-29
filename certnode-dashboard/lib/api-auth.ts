import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { KeyStatus } from "@prisma/client";
import crypto from "crypto";

export interface ApiAuthResult {
  success: boolean;
  enterpriseId?: string;
  apiKeyId?: string;
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
    // Hash the provided API key to compare with stored hash
    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

    // Find the API key in database
    const apiKey = await prisma.apiKey.findUnique({
      where: {
        keyHash,
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

    if (!apiKey) {
      return {
        success: false,
        error: "Invalid or revoked API key"
      };
    }

    return {
      success: true,
      enterpriseId: apiKey.enterpriseId,
      apiKeyId: apiKey.id
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