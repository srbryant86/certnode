import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Receipt ID is required" },
        { status: 400 }
      );
    }

    // Find receipt by ID, filtering for content type
    const receipt = await prisma.receipt.findFirst({
      where: {
        id,
        type: "CONTENT",
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Content receipt not found" },
        { status: 404 }
      );
    }

    // Return the full receipt with verification information
    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        type: receipt.type,
        contentHash: receipt.contentHash,
        contentType: receipt.contentType,
        contentMetadata: receipt.contentMetadata,
        contentProvenance: receipt.contentProvenance,
        contentAiScores: receipt.contentAiScores,
        transactionData: receipt.transactionData,
        cryptographicProof: receipt.cryptographicProof,
        verificationStatus: receipt.verificationStatus,
        createdAt: receipt.createdAt.toISOString(),
      },
      verification: {
        signatureValid: true, // TODO: Add actual signature verification
        contentIntegrity: true, // TODO: Add hash verification if content provided
        timestamp: receipt.createdAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("Content verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}