import { NextRequest, NextResponse } from "next/server";
import { storeNonce } from "@/lib/nonceCache";

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  // Create a unique challenge message
  const challenge = `Authenticate Stealth ZK-KYC for ${address} at ${Date.now()}`;
  
  // Store in cache with 60s expiry
  storeNonce(challenge, address);
  
  return NextResponse.json({ message: challenge });
}
