import { Lucid, Blockfrost } from "lucid-cardano";
import { TxBuilderLucidV3, DatumBuilderLucidV3 } from "@sundaeswap/core/lucid";
import { QueryProviderSundaeSwap } from "@sundaeswap/core";
import { AssetAmount } from "@sundaeswap/asset";
import * as dotenv from 'dotenv';
import { ESwapType, EDatumType } from "@sundaeswap/core";
dotenv.config();

const USDM_TOKEN = {
  policyId: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",
  assetName: "5553444d",
  name: "USDM"
};

const ADA_USDM_POOL_ID = "64f35d26b237ad58e099041bc14c687ea7fdc58969d7d5b66e2540ef";

async function initializeLucid() {
  return await Lucid.new(
    new Blockfrost(
      "https://cardano-mainnet.blockfrost.io/api/v0",
      process.env.BLOCKFROST_API_KEY
    ),
    "Mainnet"
  );
}

async function getWalletFromMnemonic(mnemonic) {
  const lucid = await initializeLucid();
  lucid.selectWalletFromSeed(mnemonic);
  return {
    address: await lucid.wallet.address(),
    lucid
  };
}

async function swapTokens(mnemonic, fromAmount, isFromAda, fromToken, toToken, poolId) {
  try {
    console.log('Initializing wallet...');
    const wallet = await getWalletFromMnemonic(mnemonic);
    
    const lovelaceBalance = await wallet.lucid.wallet.getUtxos();
    const adaBalance = lovelaceBalance.reduce((acc, utxo) => acc + utxo.assets.lovelace, 0n) / 1000000n;
    console.log(`Wallet Address: ${wallet.address}`);
    console.log(`Current Balance: ${adaBalance} ADA`);

    console.log('Preparing swap transaction...');
    const queryProvider = new QueryProviderSundaeSwap("mainnet");
    const txBuilder = new TxBuilderLucidV3(
      wallet.lucid,
      new DatumBuilderLucidV3("mainnet")
    );

    const poolData = await queryProvider.findPoolData({
      ident: poolId
    });

    const suppliedAsset = new AssetAmount(
      BigInt(fromAmount * 1_000_000),
      isFromAda ? poolData.assetA : poolData.assetB
    );

    const args = {
      swapType: {
        type: ESwapType.MARKET,
        slippage: 0.03,
      },
      pool: poolData,
      orderAddresses: {
        DestinationAddress: {
          address: wallet.address,
          datum: {
            type: EDatumType.NONE,
          },
        },
      },
      suppliedAsset: suppliedAsset
    };

    const { build } = await txBuilder.swap(args);
    const builtTx = await build();
    const { submit } = await builtTx.sign();

    console.log('Submitting transaction...');
    const txHash = await submit();
    console.log(`Transaction submitted successfully! Hash: ${txHash}`);

    return {
      txHash,
      walletAddress: wallet.address
    };
  } catch (error) {
    console.error('Swap failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('------- ADA to USDM Swap -------');
    const adaToUsdm = await swapTokens(process.env.WALLET_MNEMONIC, 1, true, USDM_TOKEN, USDM_TOKEN, ADA_USDM_POOL_ID);
    
    console.log('\n------- USDM to ADA Swap -------');
    const usdmToAda = await swapTokens(process.env.WALLET_MNEMONIC, 1, false, USDM_TOKEN, USDM_TOKEN, ADA_USDM_POOL_ID);
  } catch (error) {
    console.error('Error in main:', error);
  }
}

export { swapTokens }; 