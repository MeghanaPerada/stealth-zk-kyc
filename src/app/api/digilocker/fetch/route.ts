import { NextResponse } from "next/server";

/**
 * POST /api/digilocker/fetch
 *
 * Simulates a DigiLocker OAuth-protected data endpoint.
 * In a real system, the `token` would be validated against DigiLocker's OAuth server.
 * Here we simulate that handshake and return verified government identity data.
 */
export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    // Simulate token validation (in reality this would call DigiLocker OAuth)
    if (!token || !token.startsWith("digilocker_")) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid or missing DigiLocker session token." },
        { status: 401 }
      );
    }

    // Simulated "government-verified" identity data
    // In production this would be fetched from real DigiLocker Aadhaar/Drive API
    const verifiedData = {
      name: "Demo User",
      dob: 20030815, // YYYYMMDD format (matching circuit expectation)
      pan: "ABCDE1234F",
      aadhaar_last4: 1234,
      issuer: "UIDAI",
      documentType: "Aadhaar",
      verified: true,
      issuedAt: Date.now(),
      source: "digilocker_simulation"
    };

    return NextResponse.json(verifiedData);
  } catch (err: any) {
    return NextResponse.json(
      { error: "DigiLocker service error", details: err.message },
      { status: 500 }
    );
  }
}
