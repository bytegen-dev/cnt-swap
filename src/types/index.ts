export interface Token {
  policyId: string;
  assetName: string;
  name: string;
}

export interface SwapResult {
  txHash: string;
  walletAddress: string;
}

export interface WalletInfo {
  address: string;
  lucid: any; // Lucid type from lucid-cardano
}

export interface SwapParams {
  mnemonic: string;
  amount: number;
  isFromAda: boolean;
  fromToken: Token;
  toToken: Token;
  poolId: string;
}

export interface SwapRequestBody {
  mnemonic: string;
  amount: number;
  isFromAda: boolean;
  fromToken: Token;
  toToken: Token;
  poolId: string;
}

export interface SwapResponse {
  success: boolean;
  data?: SwapResult;
  error?: string;
}

