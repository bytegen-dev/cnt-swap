import { swapTokens } from "./adaUsdmSwap.js";
import * as dotenv from "dotenv";
import { USDM_TOKEN, ADA_USDM_POOL_ID } from "./constants.js";

dotenv.config();

async function main(): Promise<void> {
  try {
    const mnemonic = process.env.WALLET_MNEMONIC;
    if (!mnemonic) {
      throw new Error("WALLET_MNEMONIC is not set in environment variables");
    }

    const result = await swapTokens(
      mnemonic,
      1,
      false,
      USDM_TOKEN,
      USDM_TOKEN,
      ADA_USDM_POOL_ID
    );
    console.log("USDM to ADA swap result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

