import { swapTokens } from './adaUsdmSwap.js';
import dotenv from 'dotenv';

dotenv.config();  

async function main() {
  try {
    const result = await swapTokens(process.env.WALLET_MNEMONIC, 1, false);
    console.log('USDM to ADA swap result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function main2() {
  try {
    const result = await swapTokens(process.env.WALLET_MNEMONIC, 1, true);
    console.log('ADA to USDM swap result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();