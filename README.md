# ADA Swap - SundaeSwap Integration

A Node.js application for swapping ADA and USDM tokens on the SundaeSwap DEX using the SundaeSwap SDK. This project provides both a programmatic API and a server endpoint for executing token swaps on Cardano.

## Overview

This application enables automated token swaps on the SundaeSwap protocol, specifically for ADA/USDM pairs. It uses the SundaeSwap SDK with Lucid Cardano for transaction building and signing.

## Features

- **Token Swapping**: Swap ADA to USDM and USDM to ADA
- **REST API**: Express server with `/api/swap` endpoint
- **SundaeSwap V3 Integration**: Uses latest V3 contracts
- **Slippage Protection**: Configurable slippage tolerance (default: 3%)
- **Mainnet Support**: Configured for Cardano mainnet

## Prerequisites

- Node.js 18 or higher
- Cardano wallet with mnemonic seed phrase
- Blockfrost API key (mainnet)
- Sufficient ADA balance for transaction fees and swaps

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ada-swap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Blockfrost API key and wallet mnemonic
```

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Blockfrost API Key (required)
BLOCKFROST_API_KEY=your_blockfrost_api_key_here

# Wallet Mnemonic (required - 12 or 24 words)
WALLET_MNEMONIC="your twelve word seed phrase here"

# Server Port (optional, defaults to 3002)
PORT=3002
```

### Getting a Blockfrost API Key

1. Go to [Blockfrost.io](https://blockfrost.io/)
2. Sign up for a free account
3. Create a new project
4. Select **Mainnet** network
5. Copy your API key

**Security Note**: Never commit your `.env` file or share your mnemonic seed phrase.

## Usage

### Running the Server

```bash
npm start
```

The server will start on `http://localhost:3002` (or the port specified in `PORT`).

### API Endpoint

#### POST `/api/swap`

Execute a token swap on SundaeSwap.

**Request Body:**

```json
{
  "mnemonic": "your twelve word seed phrase here",
  "amount": 1,
  "isFromAda": true,
  "fromToken": {
    "policyId": "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",
    "assetName": "5553444d",
    "name": "USDM"
  },
  "toToken": {
    "policyId": "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",
    "assetName": "5553444d",
    "name": "USDM"
  },
  "poolId": "64f35d26b237ad58e099041bc14c687ea7fdc58969d7d5b66e2540ef"
}
```

**Parameters:**

- `mnemonic` (string, required): Wallet mnemonic seed phrase
- `amount` (number, required): Amount to swap (in ADA or token units)
- `isFromAda` (boolean, required): `true` for ADA → Token, `false` for Token → ADA
- `fromToken` (object, required): Source token information
- `toToken` (object, required): Destination token information
- `poolId` (string, required): SundaeSwap pool identifier

**Success Response:**

```json
{
  "success": true,
  "data": {
    "txHash": "abc123...",
    "walletAddress": "addr1..."
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Programmatic Usage

You can also use the swap function directly in your code:

```javascript
import { swapTokens } from './adaUsdmSwap.js';

const result = await swapTokens(
  mnemonic,
  amount,        // Amount to swap
  isFromAda,     // true for ADA → Token, false for Token → ADA
  fromToken,     // Token object
  toToken,       // Token object
  poolId         // Pool identifier
);

console.log('Transaction Hash:', result.txHash);
```

## How It Works

### 1. Querying Pool Information

The application queries SundaeSwap for pool data using the pool identifier:

```javascript
const queryProvider = new QueryProviderSundaeSwap("mainnet");
const poolData = await queryProvider.findPoolData({
  ident: poolId
});
```

### 2. Configuring Swap Arguments

The swap is configured with:

- **Swap Type**: Market order with configurable slippage (default: 3%)
- **Pool Data**: The queried pool information
- **Destination Address**: Your wallet address (no datum required)
- **Supplied Asset**: The amount and asset you're swapping

```javascript
const args = {
  swapType: {
    type: ESwapType.MARKET,
    slippage: 0.03,  // 3% slippage tolerance
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
  suppliedAsset: new AssetAmount(
    BigInt(amount * 1_000_000),
    isFromAda ? poolData.assetA : poolData.assetB
  )
};
```

### 3. Building and Submitting the Transaction

The transaction is built using the SundaeSwap V3 transaction builder:

```javascript
const txBuilder = new TxBuilderLucidV3(
  lucid,
  new DatumBuilderLucidV3("mainnet")
);

const { build } = await txBuilder.swap(args);
const builtTx = await build();
const { submit } = await builtTx.sign();
const txHash = await submit();
```

## Project Structure

```
ada-swap/
├── adaUsdmSwap.js    # Core swap functionality
├── server.js         # Express API server
├── test.js          # Test file
├── package.json     # Dependencies
├── .env            # Environment variables (not committed)
└── README.md       # This file
```

## Dependencies

- `@sundaeswap/core` - SundaeSwap SDK
- `lucid-cardano` - Cardano transaction building
- `@blockfrost/blockfrost-js` - Blockfrost API client
- `express` - Web server framework
- `dotenv` - Environment variable management

## Configuration

### Default Pool

The application is configured for the ADA/USDM pool:

- **Pool ID**: `64f35d26b237ad58e099041bc14c687ea7fdc58969d7d5b66e2540ef`
- **USDM Token**:
  - Policy ID: `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`
  - Asset Name: `5553444d`

### Slippage

Default slippage is set to 3% (0.03). This can be modified in `adaUsdmSwap.js`:

```javascript
swapType: {
  type: ESwapType.MARKET,
  slippage: 0.03,  // Change this value (0.01 = 1%, 0.05 = 5%)
}
```

## Security Considerations

- **Never commit** your `.env` file or mnemonic seed phrase
- **Use environment variables** for sensitive data
- **Test on testnet first** before using mainnet
- **Verify transaction details** before signing
- **Keep your mnemonic secure** - anyone with access can control your wallet

## Troubleshooting

### "Insufficient funds"

- Ensure you have enough ADA for:
  - The swap amount
  - Transaction fees (~0.17 ADA)
  - SundaeSwap scooper fees

### "Pool not found"

- Verify the pool ID is correct
- Check that the pool exists on mainnet
- Ensure you're using the correct network configuration

### "Transaction failed"

- Check your wallet balance
- Verify the pool has sufficient liquidity
- Ensure slippage tolerance is appropriate
- Check Blockfrost API key is valid

### "Invalid mnemonic"

- Verify your mnemonic is 12 or 24 words
- Ensure words are separated by spaces
- Check for typos in the seed phrase

## Network Configuration

Currently configured for **Cardano Mainnet**. To switch to testnet:

1. Update Blockfrost endpoint in `adaUsdmSwap.js`:
   ```javascript
   "https://cardano-preview.blockfrost.io/api/v0"
   ```

2. Change network parameter:
   ```javascript
   "Preview"
   ```

3. Use testnet pool IDs and tokens

## API Rate Limits

Blockfrost free tier limits:
- 100 requests per second
- 10,000 requests per day

Monitor your usage to avoid rate limiting.

## Additional Resources

- [SundaeSwap Documentation](https://docs.sundaeswap.finance/)
- [Lucid Cardano Documentation](https://lucid.spacebudz.io/)
- [Blockfrost API Documentation](https://blockfrost.io/)
- [Cardano Documentation](https://docs.cardano.org/)

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

---

**Warning**: This application interacts with real funds on Cardano mainnet. Always test thoroughly and use at your own risk. Never share your mnemonic seed phrase or commit sensitive credentials to version control.
