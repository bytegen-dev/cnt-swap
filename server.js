import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { swapTokens } from './adaUsdmSwap.js';

const app = express();
const port = process.env.PORT || 3002

app.use(cors());
app.use(bodyParser.json());

app.post('/api/swap', async (req, res) => {
  try {
    const { mnemonic, amount, isFromAda, fromToken, toToken, poolId } = req.body;

    if (!mnemonic || !amount || typeof isFromAda !== 'boolean' || !fromToken || !toToken || !poolId) {
      return res.status(400).json({
        error: 'Missing required parameters: mnemonic, amount, isFromAda, fromToken, toToken, and poolId are required'
      });
    }

    const result = await swapTokens(mnemonic, amount, isFromAda, fromToken, toToken, poolId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Swap error:', error);
    const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
      
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 