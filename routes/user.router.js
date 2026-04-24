import express from "express";
import {
  addWalletAddress,
  getAllBonus,
  getAllHelpAndSupportHistory,
  getAllMonthlyRewardsHistory,
  getAllPackagesForClient,
  getAllPlan,
  getAllTeamRewardsHistory,
  getBinaryTree,
  getCarFundingIncomeHistory,
  getDirectActiveTeam,
  getDowunlineUsers,
  getInvestmentHistoryById,
  getLevelIncomeHistory,
  getProfile,
  getreferalHistoryByID,
  getRoiIncomeHistory,
  getStakeIncomeHistory,
  getTeamBusiness,
  getTotalRoi,
  getUsersCountByLevel,
  getUserTeam25Levels,
  getWithdrawalHistory,
  helpAndSupport,
  investment,
  stakeDepositHistory,
  userLogin,
  userLogout,
  userRegister,
  withdrawalHistory,
} from "../controllers/user.controller.js";
import IsAuthenticated from "../middlewares/IsAuthenticated.js";
import { processWithdrawal } from "../controllers/withdrwal.controller.js";
import { getBanners } from "../controllers/admin.controller.js";
import {
  getUserTransactions,
  saveLldBuy,
} from "../controllers/Lldtransaction.controller.js";
import { createStake } from "../controllers/stake.controller.js";

const router = express.Router();
router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/logout").post(IsAuthenticated, userLogout);
router.route("/get-packages").get(getAllPlan);
router.route("/get-Profile").get(IsAuthenticated, getProfile);
router.route("/getRoi-history").get(IsAuthenticated, getRoiIncomeHistory);
router
  .route("/getLevelIncome-history")
  .get(IsAuthenticated, getLevelIncomeHistory);
router
  .route("/investment-history")
  .get(IsAuthenticated, getInvestmentHistoryById);
router.route("/buy-package").post(IsAuthenticated, investment);
router.route("/get-binary").get(IsAuthenticated, getBinaryTree);
router.route("/support/create").post(IsAuthenticated, helpAndSupport);
router.route("/getreferal-history").get(IsAuthenticated, getreferalHistoryByID);
router.route("/getLevelUsers").get(IsAuthenticated, getUsersCountByLevel);
router.route("/withdrawal-request").post(IsAuthenticated, processWithdrawal);
router
  .route("/support/messages")
  .get(IsAuthenticated, getAllHelpAndSupportHistory);
router.get("/get-banners", getBanners);
router.get("/withdrawals-history", IsAuthenticated, withdrawalHistory);
router.get(
  "/monthlyIncome-history",
  IsAuthenticated,
  getAllMonthlyRewardsHistory,
);
router.get("/teamReward-history", IsAuthenticated, getAllTeamRewardsHistory);
router.route("/team-business").get(IsAuthenticated, getTeamBusiness);
router.route("/get-plans").get(IsAuthenticated, getAllPackagesForClient);
router
  .route("/get-car-funding-history")
  .get(IsAuthenticated, getCarFundingIncomeHistory);
router
  .route("/get-active-direct-team")
  .get(IsAuthenticated, getDirectActiveTeam);
router.route("/add-walletaddress").post(IsAuthenticated, addWalletAddress);
router.route("/get-deposit-bonus").get(IsAuthenticated, getAllBonus);
router.route("/get-level-wise-team").get(IsAuthenticated, getUserTeam25Levels);
router.route("/get-buy-lld-history").get(IsAuthenticated, getUserTransactions);
router.route("/stake-lld").post(IsAuthenticated, createStake);
router
  .route("/get-stake-deposit-history")
  .get(IsAuthenticated, stakeDepositHistory);
router
  .route("/get-stake-income-report")
  .get(IsAuthenticated, getStakeIncomeHistory);
router
  .route("/get-withdrawal-history")
  .get(IsAuthenticated, getWithdrawalHistory);
router.post("/buy-lld", IsAuthenticated, saveLldBuy);
export default router;
