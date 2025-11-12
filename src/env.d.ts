declare namespace NodeJS {
  interface ProcessEnv {
    BLOCKFROST_API_KEY: string;
    WALLET_MNEMONIC: string;
    PORT?: string;
  }
}
