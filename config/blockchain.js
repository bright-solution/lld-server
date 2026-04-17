import { JsonRpcProvider, Wallet, Contract } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new JsonRpcProvider("https://bsc-dataseed.binance.org/");

export const adminWallet = new Wallet(process.env.PRIVATE_KEY, provider);

export const usdtContract = new Contract(
  "0x55d398326f99059fF775485246999027B3197955",
  [
    "function transfer(address to,uint256 amount) returns(bool)",
    "function balanceOf(address) view returns(uint256)",
    "function decimals() view returns(uint8)",
  ],
  adminWallet,
);

export const feeContractAddress = "0xF543c8F73c798D48F948F96b7d71a0DE359e27D5";
