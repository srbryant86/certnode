import type { RequestInit } from "node-fetch";

interface SignResponse {
  protected: string;
  signature: string;
  payload: Record<string, unknown>;
  kid: string;
  payload_jcs_sha256: string;
  receipt_id: string;
  tsr?: string;
}

const DEFAULT_ENDPOINT = process.env.SIGNING_SERVICE_URL ?? "http://localhost:3000/v1/sign";

export async function signPayload(payload: Record<string, unknown>): Promise<SignResponse> {
  const endpoint = DEFAULT_ENDPOINT;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.SIGNING_SERVICE_API_KEY) {
    headers.Authorization = `Bearer ${process.env.SIGNING_SERVICE_API_KEY}`;
  }

  const request: RequestInit = {
    method: "POST",
    headers,
    body: JSON.stringify({ payload }),
  };

  const response = await fetch(endpoint, request as any);
  if (!response.ok) {
    const errorBody = await safeReadJson(response);
    const message = errorBody?.message || `Signing service error (${response.status})`;
    throw new Error(message);
  }

  return (await response.json()) as SignResponse;
}

async function safeReadJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}
