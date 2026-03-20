import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDB();

    // Fetch the 50 most recent proofs
    const proofs = await db.collection("proofs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Map to the format expected by the Explorer UI
    const mappedProofs = proofs.map(p => ({
      walletAddress: p.wallet,
      proofHash: p.proofHash,
      sourceType: p.type?.toUpperCase() || "MANUAL",
      createdAt: p.createdAt,
      identityHash: p.identityHash,
      status: p.status || "Verified"
    }));

    return NextResponse.json(mappedProofs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
