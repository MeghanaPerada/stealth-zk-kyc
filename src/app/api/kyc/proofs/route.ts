import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // REFACTOR: This route used to fetch from MongoDB.
    // In the new 'User-Pays / On-Chain' model, the Explorer fetches 
    // directly from the Algorand Indexer in the frontend for 100% decentralization.
    
    // Returning empty array for now as the transition to on-chain indexer is complete.
    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
