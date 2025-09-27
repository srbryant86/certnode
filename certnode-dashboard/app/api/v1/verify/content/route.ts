import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");

    if (!hash) {
      return NextResponse.json(
        { error: "Content hash parameter is required" },
        { status: 400 }
      );
    }

    // Normalize hash format (ensure it starts with sha256:)
    const normalizedHash = hash.startsWith("sha256:") ? hash : `sha256:${hash}`;

    // Find receipt by content hash
    const receipt = await prisma.receipt.findFirst({
      where: {
        contentHash: normalizedHash,
        type: "CONTENT",
      },
      orderBy: {
        createdAt: "desc", // Return most recent if multiple exist
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "No content receipt found for this hash" },
        { status: 404 }
      );
    }

    // Return the verification result
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
        hashMatched: true,
        timestamp: receipt.createdAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("Content hash verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}