import { Lucid, Blockfrost } from "lucid-cardano";
import { TxBuilderLucidV3 } from "@sundaeswap/core/lucid";
import { QueryProviderSundaeSwap } from "@sundaeswap/core";
import { AssetAmount } from "@sundaeswap/asset";
import * as dotenv from "dotenv";
import { ESwapType, EDatumType } from "@sundaeswap/core";
import { Token, SwapResult, WalletInfo } from "./types";
import { USDM_TOKEN, ADA_USDM_POOL_ID } from "./constants.js";

dotenv.config();

async function initializeLucid(): Promise<Lucid> {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  if (!apiKey) {
    throw new Error("BLOCKFROST_API_KEY is not set in environment variables");
  }

  return await Lucid.new(
    new Blockfrost("https://cardano-mainnet.blockfrost.io/api/v0", apiKey),
    "Mainnet"
  );
}

async function getWalletFromMnemonic(mnemonic: string): Promise<WalletInfo> {
  const lucid = await initializeLucid();
  lucid.selectWalletFromSeed(mnemonic);
  return {
    address: await lucid.wallet.address(),
    lucid,
  };
}

export async function swapTokens(
  mnemonic: string,
  fromAmount: number,
  isFromAda: boolean,
  _fromToken: Token,
  _toToken: Token,
  poolId: string
): Promise<SwapResult> {
  try {
    console.log("Initializing wallet...");
    const wallet = await getWalletFromMnemonic(mnemonic);

    const lovelaceBalance = await wallet.lucid.wallet.getUtxos();
    const adaBalance =
      lovelaceBalance.reduce(
        (acc: bigint, utxo: any) => acc + utxo.assets.lovelace,
        0n
      ) / 1000000n;
    console.log(`Wallet Address: ${wallet.address}`);
    console.log(`Current Balance: ${adaBalance} ADA`);

    console.log("Preparing swap transaction...");
    const queryProvider = new QueryProviderSundaeSwap("mainnet");
    const txBuilder = new TxBuilderLucidV3(wallet.lucid, "mainnet");

    const poolData = await queryProvider.findPoolData({
      ident: poolId,
    });

    const suppliedAsset = new AssetAmount(
      BigInt(fromAmount * 1_000_000),
      isFromAda ? poolData.assetA : poolData.assetB
    );

    const args = {
      swapType: {
        type: ESwapType.MARKET as const,
        slippage: 0.03,
      },
      pool: poolData,
      orderAddresses: {
        DestinationAddress: {
          address: wallet.address,
          datum: {
            type: EDatumType.NONE as const,
          },
        },
      },
      suppliedAsset: suppliedAsset,
    };

    const { build } = await txBuilder.swap(args);
    const builtTx = await build();
    const { submit } = await builtTx.sign();

    console.log("Submitting transaction...");
    const txHash = await submit();
    console.log(`Transaction submitted successfully! Hash: ${txHash}`);

    return {
      txHash,
      walletAddress: wallet.address,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Swap failed:", errorMessage);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    const mnemonic = process.env.WALLET_MNEMONIC;
    if (!mnemonic) {
      throw new Error("WALLET_MNEMONIC is not set in environment variables");
    }

    console.log("------- ADA to USDM Swap -------");
    await swapTokens(
      mnemonic,
      1,
      true,
      USDM_TOKEN,
      USDM_TOKEN,
      ADA_USDM_POOL_ID
    );

    console.log("\n------- USDM to ADA Swap -------");
    await swapTokens(
      mnemonic,
      1,
      false,
      USDM_TOKEN,
      USDM_TOKEN,
      ADA_USDM_POOL_ID
    );
  } catch (error) {
    console.error("Error in main:", error);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
