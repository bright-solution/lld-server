import { usdtContract, feeContractAddress } from "../config/blockchain.js";
import { parseUnits } from "ethers";
import Withdrawal from "../models/withdrwal.model.js";

async function processWithdrawals() {
  const pending = await Withdrawal.find({ status: "pending" }).limit(5);

  for (const withdraw of pending) {
    try {
      const decimals = await usdtContract.decimals();
      const net = parseUnits(withdraw.netAmountSent.toString(), decimals);
      const fee = parseUnits(withdraw.feeAmount.toString(), decimals);
      const tx1 = await usdtContract.transfer(withdraw.userWalletAddress, net);
      await tx1.wait();
      const tx2 = await usdtContract.transfer(feeContractAddress, fee);
      await tx2.wait();
      withdraw.status = "approved";
      withdraw.transactionHash = tx1.hash;
      await withdraw.save();
    } catch (err) {
      withdraw.status = "rejected";
      await withdraw.save();
    }
  }
}

setInterval(processWithdrawals, 5000);
