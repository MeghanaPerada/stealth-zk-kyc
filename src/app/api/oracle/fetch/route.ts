import { NextResponse } from "next/server";
import { generateDynamicKYC } from "@/lib/oracleMock";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, otp, wallet, requestedFields, manualData } = body;

    // 1. Verify user consent via OTP
    if (!verifyOtp(userId, otp)) {
      return NextResponse.json({ error: "Consent not verified" }, { status: 401 });
    }

    // 2. Generate dynamic KYC data (simulated DigiLocker)
    const oracleResult = generateDynamicKYC(manualData);

    // 3. Scope-limited fields (privacy preserving)
    const filteredData: any = {};
    if (requestedFields && Array.isArray(requestedFields)) {
      requestedFields.forEach((field: string) => {
        if (oracleResult.data[field]) {
          filteredData[field] = oracleResult.data[field];
        }
      });
    } else {
      // Default to basic public info if no specific fields requested
      filteredData.issuer = oracleResult.issuer;
    }

    return NextResponse.json({
      data: filteredData,
      dataHash: oracleResult.dataHash,
      signature: oracleResult.signature,
      issuer: oracleResult.issuer,
      _internalData: oracleResult._internalData // Only for internal processing/ZK
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
