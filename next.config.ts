import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages use native bindings / WebAssembly and must NOT be bundled by Next.js
  serverExternalPackages: ['snarkjs', 'circomlibjs', 'ffjavascript', 'algosdk', 'tweetnacl'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
