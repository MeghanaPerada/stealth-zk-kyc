import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  // Create a unique challenge message
  const challenge = `Authenticate Stealth ZK-KYC for ${address} at ${Date.now()}`;
  
  return NextResponse.json({ message: challenge });
}
