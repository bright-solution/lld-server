import { parseUnits } from "ethers";
import UserModel from "../models/user.model.js";
import { usdtContract, wallet } from "./walletSetup.js";
import Withdrawal from "../models/withdrwal.model.js";

export const processWithdrawals = async () => {

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    try {
        const pendingWithdrawals = await Withdrawal.find({
            status: "pending",
            createdAt: { $lte: cutoffTime },
        });

        console.log(`📦 Found ${pendingWithdrawals.length} pending withdrawals`);

        for (let withdrawal of pendingWithdrawals) {
            console.log(`➡️ Processing withdrawal ID: ${withdrawal._id}`);

            const user = await UserModel.findById(withdrawal.userId);
            if (!user) {
                console.log(`❌ User not found for withdrawal ID: ${withdrawal._id}`);
                continue;
            }

            const amountWei = parseUnits(withdrawal.netAmountSent.toString(), 18); // ethers.BigNumber
            const serverBalance = await usdtContract.balanceOf(wallet.address); // bigint

            console.log(`💰 Server balance: ${serverBalance.toString()}`);
            console.log(`💸 Withdrawal amount: ${amountWei.toString()}`);

            if (serverBalance < BigInt(amountWei.toString())) {
                console.log(`⚠️ Insufficient balance for withdrawal ID: ${withdrawal._id}`);

                user.currentEarnings += withdrawal.amount;
                user.totalPayouts -= withdrawal.amount;

                withdrawal.status = "failed";
                withdrawal.transactionHash = null;

                await user.save();
                await withdrawal.save();

                console.log(`↩️ Amount reverted to user, marked withdrawal as failed.`);
                continue;
            }

            const tx = await usdtContract.transfer(withdrawal.userWalletAddress, amountWei, {
                gasLimit: 210000,
            });
            const receipt = await tx.wait();

            withdrawal.status = receipt.status ? "success" : "failed";
            withdrawal.transactionHash = receipt.hash;

            if (!receipt.status) {
                user.currentEarnings += withdrawal.amount;
                user.totalPayouts -= withdrawal.amount;
                console.log(`❌ Transaction failed. Reverting amount to user earnings`);
            } else {
                console.log(`✅ Transaction successful: ${receipt.hash}`);
            }

            await withdrawal.save();
            await user.save();
        }
    } catch (err) {
        console.error("❌ Error in processWithdrawals:", err.message);
    }
};
