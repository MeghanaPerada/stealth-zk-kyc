import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // REFACTOR: This route used to fetch from MongoDB.
    // In the new 'User-Pays / On-Chain' model, the Explorer should fetch 
    // directly from the Algorand Indexer in the frontend for 100% decentralization.
    
    // Returning empty array for now to prevent crashes.
    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
