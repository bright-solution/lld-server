import { Contract, ethers, JsonRpcProvider, Wallet, parseUnits } from "ethers";
import dotenv from "dotenv";

import UserModel from "../models/user.model.js";
import Withdrawal from "../models/withdrwal.model.js";

dotenv.config();

// RPC
const provider = new JsonRpcProvider("https://bsc-dataseed.binance.org/");

// ADMIN WALLET
const adminWallet = new Wallet(process.env.PRIVATE_KEY, provider);

// USDT CONTRACT
const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";

const usdtABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const usdtContract = new Contract(usdtAddress, usdtABI, adminWallet);

export const processWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount } = req.body;

    const user = await UserModel.findById(userId).select("walletAddress");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.currentEarnings < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    const fee = amount * 0.05;
    const net = amount - fee;

    await Withdrawal.create({
      userId: userId,
      userWalletAddress: user.walletAddress,
      amount: amount,
      feeAmount: fee,
      netAmountSent: net,
    });

    res.json({
      success: true,
      message: "Withdrawal request submitted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// export const processWithdrawal = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const user = await UserModel.findById(userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     if (user.canWithdraw) {
//       return res.status(403).json({
//         success: false,
//         message: "Withdraw not allowed",
//       });
//     }

//     // USER WALLET
//     const userWallet = user.walletAddress;

//     if (!userWallet) {
//       return res.status(400).json({
//         success: false,
//         message: "Wallet address missing",
//       });
//     }

//     console.log("User Wallet:", userWallet);

//     const { amount } = req.body;

//     if (!amount || isNaN(amount) || Number(amount) <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid amount",
//       });
//     }

//     if (!ethers.isAddress(userWallet)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid wallet address",
//       });
//     }

//     const grossAmount = Number(amount);

//     if (user.currentEarnings < grossAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient earnings",
//       });
//     }

//     // 5% FEE
//     const feePercent = 5;
//     const feeAmount = (grossAmount * feePercent) / 100;
//     const netAmount = grossAmount - feeAmount;

//     const decimals = await usdtContract.decimals();

//     const netWei = parseUnits(netAmount.toString(), decimals);
//     const feeWei = parseUnits(feeAmount.toString(), decimals);
//     const totalWei = parseUnits(grossAmount.toString(), decimals);

//     const serverBalance = await usdtContract.balanceOf(adminWallet.address);

//     if (serverBalance < totalWei) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Server is busy processing withdrawals. Please try again later.",
//       });
//     }

//     const feeContractAddress = "0xF543c8F73c798D48F948F96b7d71a0DE359e27D5";

//     console.log("Sending to user:", netAmount);
//     console.log("Fee to contract:", feeAmount);

//     const tx1 = await usdtContract.transfer(userWallet, netWei);
//     const receipt1 = await tx1.wait();

//     if (!receipt1.status) {
//       throw new Error("User transfer failed");
//     }

//     const tx2 = await usdtContract.transfer(feeContractAddress, feeWei);
//     const receipt2 = await tx2.wait();

//     if (!receipt2.status) {
//       throw new Error("Fee transfer failed");
//     }

//     // SAVE WITHDRAWAL
//     await Withdrawal.create({
//       userId: user._id,
//       userWalletAddress: userWallet,
//       amount: grossAmount,
//       feeAmount: feeAmount,
//       netAmountSent: netAmount,
//       transactionHash: receipt1.hash,
//       status: "approved",
//     });

//     user.currentEarnings -= grossAmount;
//     user.totalPayouts += grossAmount;

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: "Withdrawal successful",
//       txHash: receipt1.hash,
//     });
//   } catch (error) {
//     console.error("Withdrawal error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// import {
//   JsonRpcProvider,
//   Wallet,
//   Contract,
//   parseUnits,
//   isAddress,
// } from "ethers";
// import dotenv from "dotenv";
// import UserModel from "../models/user.model.js";
// import Settings from "../models/settings.model.js";
// import WithdrawalLimit from "../models/WithdrawalLimit.model.js";
// import { sendWithdrawalApproveEmail, sendWithdrawalConfirmationEmail } from "../utils/sendWithdrawalConfirmationEmail.js";
// import bcrypt from "bcrypt"
// import Withdrawal from "../models/withdrawal.model.js";

// dotenv.config();

// const provider = new JsonRpcProvider("https://bsc-dataseed.binance.org/");

// const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
// // const wallet ="asd"

// const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
// const usdtABI = [
//   "function transfer(address to, uint256 amount) public returns (bool)",
//   "function balanceOf(address) view returns (uint256)",
// ];
// const usdtContract = new Contract(usdtAddress, usdtABI, wallet);

// export const processWithdrawal = async (req, res) => {
//     const userId = req.user._id;

//     try {
//         const user = await UserModel.findById(userId);
//         if (!user) {
//             return res
//                 .status(404)
//                 .json({ success: false, message: "User not found" });
//         }
//         if (user.isWithdrawalblock) {
//             return res
//                 .status(404)
//                 .json({ success: false, message: "User withdrawl is block" });

//         }

//         const { userWalletAddress, amount, otp, loginPassword, options } = req.body;

//         if (!userWalletAddress || !amount || !otp || !loginPassword || !options) {
//             return res
//                 .status(400)
//                 .json({
//                     success: false,
//                     message: "All fields are required. Please check your input.",
//                 });
//         }

//         if (!["mainWallet", "additionalWallet"].includes(options)) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Invalid wallet option" });
//         }

//         if (user.otp !== otp || user.otpExpire < Date.now()) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Invalid or expired OTP" });
//         }

//         if (!isAddress(userWalletAddress)) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Invalid wallet address" });
//         }

//         const passwordMatch = await bcrypt.compare(loginPassword, user.password);
//         if (!passwordMatch) {
//             return res
//                 .status(401)
//                 .json({ success: false, message: "Invalid login password" });
//         }

//         const numericAmount = Number(amount);
//         if (isNaN(numericAmount) || numericAmount <= 0) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Invalid amount" });
//         }

//         if (numericAmount < 10) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Minimum withdrawal amount is $10" });
//         }

//         // ---------- 2. Balance checks ----------
//         if (
//             options === "mainWallet" &&
//             user.mainWallet < numericAmount
//         ) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Insufficient balance in main wallet" });
//         }
//         if (
//             options === "additionalWallet" &&
//             user.additionalWallet < numericAmount
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Insufficient balance in additional wallet",
//             });
//         }

//         // ---------- 3. Rule checks ----------
//         const withdrawalRule = await WithdrawalLimit.findOne({ level: user.level });
//         if (!withdrawalRule) {
//             return res
//                 .status(400)
//                 .json({
//                     success: false,
//                     message: "Withdrawal rules not configured for your level",
//                 });
//         }

//         if (numericAmount > withdrawalRule.singleWithdrawalLimit) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Maximum withdrawal amount for your level is $${withdrawalRule.singleWithdrawalLimit}`,
//             });
//         }

//         const now = new Date();
//         const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//         const lastDayOfMonth = new Date(
//             now.getFullYear(),
//             now.getMonth() + 1,
//             0,
//             23,
//             59,
//             59,
//             999
//         );

//         const monthlyWithdrawals = await Withdrawal.find({
//             userId,
//             createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
//         });

//         if (monthlyWithdrawals.length >= withdrawalRule.perMonthWithdrawalCount) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Monthly withdrawal limit reached" });
//         }

//         // ---------- 4. Fee + on-chain transfer ----------
//         const feePercentage = 10;
//         const feeAmount = (numericAmount * feePercentage) / 100;
//         const netAmount = numericAmount - feeAmount;

//         // const amountWei = parseUnits(netAmount.toString(), 18);
//         const serverBalance = await usdtContract.balanceOf(wallet.address);
//         const amountWei = parseUnits(netAmount.toString(), 18);

//         if (serverBalance < amountWei) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Transaction could not be processed at the moment. Please try again later",
//             });
//         }

//         const tx = await usdtContract.transfer(userWalletAddress, amountWei, {
//             gasLimit: 210000,
//         });
//         const receipt = await tx.wait();
//         const txStatus = receipt.status ? "success" : "failed";

//         // ---------- 5. Record in DB ----------
//         await Withdrawal.create({
//             userId,
//             userWalletAddress,
//             amount: numericAmount,
//             feeAmount,
//             netAmountSent: netAmount,
//             transactionHash: receipt.hash,
//             status: txStatus,
//         });

//         // ---------- 6. Update user balances ----------
//         if (txStatus === "success") {
//             if (options === "mainWallet") {
//                 user.mainWallet -= numericAmount;
//             } else {
//                 user.additionalWallet -= numericAmount;
//             }

//             user.totalPayouts += numericAmount;

//             // invalidate OTP
//             user.otp = null;
//             user.otpExpire = null;

//             await user.save();

//             // ---------- 7. Email notification ----------
//             await sendWithdrawalConfirmationEmail(
//                 user.email,
//                 user.name,
//                 numericAmount,
//                 netAmount,
//                 userWalletAddress,
//                 receipt.hash,
//                 new Date()
//             );
//         }

//         return res.status(200).json({
//             success: txStatus === "success",
//             message: `Withdrawal ${txStatus}. Net Amount: $${amount - feeAmount} (Requested: $${amount}, Fee: $${fee}). TxHash: ${receipt.hash}`,
//         });
//     } catch (error) {
//         return res
//             .status(500)
//             .json({
//                 success: false,
//                 message: error.message || "Failed to process withdrawal",
//             });
//     }
// };

// export const processWithdrawal = async (req, res) => {
//   const userId = req.user._id;

//   try {
//     const today = new Date().getDay();
//     if (today === 0 || today === 6) {
//       return res.status(403).json({
//         success: false,
//         message: "Withdrawals are not allowed on Saturday and Sunday.",
//       });
//     }

//     const user = await UserModel.findById(userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     if (user.canWithdraw === true) {
//       return res.status(403).json({
//         success: false,
//         message: "You can not withdraw at this time.",
//       });
//     }

//     const { userWalletAddress, amount } = req.body;

//     if (!userWalletAddress || !amount) {
//       return res
//         .status(400)
//         .json({ success: false, message: "All fields are required." });
//     }

//     if (!isAddress(userWalletAddress)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid wallet address." });
//     }

//     const numericAmount = Number(amount);
//     if (isNaN(numericAmount) || numericAmount < 10) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Minimum withdrawal is $10." });
//     }

//     if (user.currentEarnings < numericAmount) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Insufficient wallet balance." });
//     }

//     const fee = (numericAmount * 10) / 100;
//     const netAmount = numericAmount - fee;

//     user.currentEarnings -= numericAmount;
//     user.totalPayouts += numericAmount;

//     await user.save();

//     await Withdrawal.create({
//       userId,
//       userWalletAddress,
//       amount: numericAmount,
//       feeAmount: fee,
//       netAmountSent: netAmount,
//       status: "pending",
//       transactionHash: "",
//     });

//     return res.status(200).json({
//       success: true,
//       message: `Withdrawal request submitted successfully. Net amount: $${netAmount.toFixed(
//         2
//       )}. Processing soon.`,
//     });
//   } catch (error) {
//     console.error("Withdrawal Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during withdrawal.",
//     });
//   }
// };

// export const processWithdrawal = async (req, res) => {
//   const userId = req.user._id;

//   try {
//     const user = await UserModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }
//     const today = new Date();
//     const dayOfWeek = today.getDay();

//     if (dayOfWeek === 0 || dayOfWeek === 6) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "Withdrawals are not allowed on Saturday and Sunday. Please try on a weekday.",
//       });
//     }

//     const { userWalletAddress, amount } = req.body;

//     if (!userWalletAddress || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required.",
//       });
//     }

//     if (!isAddress(userWalletAddress)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid wallet address.",
//       });
//     }

//     const numericAmount = Number(amount);

//     if (!Number.isFinite(numericAmount) || numericAmount < 10) {
//       return res.status(400).json({
//         success: false,
//         message: "Minimum withdrawal amount is $10.",
//       });
//     }

//     if (user.currentEarnings < numericAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient wallet balance.",
//       });
//     }

//     const pendingExists = await Withdrawal.findOne({
//       userId,
//       status: "pending",
//     });

//     if (pendingExists) {
//       return res.status(403).json({
//         success: false,
//         message: "You already have a pending withdrawal.",
//       });
//     }

//     // 💸 Fee calculation
//     const fee = Number(((numericAmount * 10) / 100).toFixed(2));
//     const netAmount = Number((numericAmount - fee).toFixed(2));

//     // 🧮 Update user wallet
//     user.currentEarnings -= numericAmount;
//     user.totalPayouts = (user.totalPayouts || 0) + numericAmount;
//     await user.save();

//     await Withdrawal.create({
//       userId,
//       userWalletAddress,
//       amount: numericAmount,
//       feeAmount: fee,
//       netAmountSent: netAmount,
//       status: "pending",
//       transactionHash: "",
//     });

//     return res.status(200).json({
//       success: true,
//       message: `Withdrawal request submitted successfully. Net amount: $${netAmount}`,
//     });
//   } catch (error) {
//     console.error("Withdrawal Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during withdrawal.",
//     });
//   }
// };

export const approveWithdrawal = async (req, res) => {
  const { withdrawalId } = req.body;
  if (!withdrawalId) {
    return res.status(400).json({
      message: "withdrawal ID is required",
      success: false,
    });
  }
  try {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Withdrawal is not pending" });
    }

    withdrawal.status = "approved";
    withdrawal.approvedDate = new Date();
    await withdrawal.save();

    return res
      .status(200)
      .json({ success: true, message: "Withdrawal approved successfully" });
  } catch (error) {
    console.error("Approve Withdrawal Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
export const rejectWithdrawal = async (req, res) => {
  const { withdrawalId } = req.body;

  try {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Withdrawal is not pending" });
    }

    const user = await UserModel.findById(withdrawal.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const amount = withdrawal.amount;

    user.currentEarnings += amount;
    user.totalPayouts -= amount;
    if (user.totalPayouts < 0) user.totalPayouts = 0;

    await user.save();

    withdrawal.status = "rejected";
    withdrawal.transactionHash = "";
    withdrawal.approvedDate = new Date();
    await withdrawal.save();

    return res.status(200).json({
      success: true,
      message: "Withdrawal rejected and balance reverted",
    });
  } catch (error) {
    console.error("Reject Withdrawal Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
