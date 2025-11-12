import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { swapTokens } from "./adaUsdmSwap.js";
import { SwapRequestBody, SwapResponse } from "./types";

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

app.post("/api/swap", async (req: Request, res: Response<SwapResponse>): Promise<void> => {
  try {
    const {
      mnemonic,
      amount,
      isFromAda,
      fromToken,
      toToken,
      poolId,
    }: SwapRequestBody = req.body;

    if (
      !mnemonic ||
      !amount ||
      typeof isFromAda !== "boolean" ||
      !fromToken ||
      !toToken ||
      !poolId
    ) {
      res.status(400).json({
        success: false,
        error:
          "Missing required parameters: mnemonic, amount, isFromAda, fromToken, toToken, and poolId are required",
      });
      return;
    }

    const result = await swapTokens(
      mnemonic,
      amount,
      isFromAda,
      fromToken,
      toToken,
      poolId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Swap error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error";

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

