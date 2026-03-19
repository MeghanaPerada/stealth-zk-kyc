import { NextResponse } from 'next/server';

export const getWalletAddress = (request: Request) => {
  const address = request.headers.get('x-wallet-address');
  if (!address) {
    return null;
  }
  return address;
};

export const requireWallet = (request: Request) => {
  const address = getWalletAddress(request);
  if (!address) {
    return NextResponse.json({ error: 'Wallet connection required' }, { status: 401 });
  }
  return address;
};
