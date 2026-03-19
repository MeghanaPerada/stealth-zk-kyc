import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    "type": "AADHAAR",
    "issuer": "UIDAI",
    "data": {
      "name": "Demo User",
      "dob": "2003-08-15",
      "aadhaar_last4": "1234"
    }
  });
}
