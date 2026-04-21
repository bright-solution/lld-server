import express from "express";
import {
  adminInvestment,
  adminLogin,
  adminRegister,
  allUsers,
  allWithdrwal,
  deleteBanner,
  getAllDepositBonus,
  getAllIncomes,
  getAllMessage,
  getAllPackages,
  // getAllLevelIncome,
  getAllReferalBonus,
  getAllSalaryIncomeHistory,
  getAllUsers,
  getAllWithdrawals,
  getBanners,
  getCarFundingIncomeHistory,
  getDailyRoi,
  getDepositHistory,
  getLevelConfiguration,
  getLevelIncomeHistory,
  getOneTimeTeamRewardsHistory,
  getProfile,
  getRoiHistory,
  getStakeIncomeHistory,
  getTotalInvestedUsers,
  monthlyIncomeHistory,
  ticketApprove,
  ticketReject,
  toggleUserLogin,
  toggleWithdrawalAccess,
  updateGlobalLimit,
  updateLevelConfig,
  updatePackages,
  uploadBanner,
} from "../controllers/admin.controller.js";
import { createPlan } from "../controllers/plan.controller.js";
import { isAdminAuthenticated } from "../middlewares/adminMiddleware.js";
import upload from "../utils/multer.js";
import bannerUpload from "../utils/multer.js";
import { getWithdrawalHistory } from "../controllers/user.controller.js";

const router = express.Router();

router.route("/register").post(adminRegister);
router.route("/login").post(adminLogin);
router.route("/getProfile").get(isAdminAuthenticated, getProfile);
router.route("/getAllUsers").get(isAdminAuthenticated, allUsers);
router.route("/getAllRoi-history").get(isAdminAuthenticated, getDailyRoi);
router.route("/getAllIncomes").get(isAdminAuthenticated, getAllIncomes);
router.route("/create-plan").post(isAdminAuthenticated, createPlan);
router
  .route("/getAllInvestedUsers")
  .get(isAdminAuthenticated, getTotalInvestedUsers);
router
  .route("/getAllReferalBonus-history")
  .get(isAdminAuthenticated, getAllReferalBonus);
router
  .route("/getAllLevelIncome-history")
  .get(isAdminAuthenticated, getLevelIncomeHistory);
router.route("/support-in-process").get(isAdminAuthenticated, getAllMessage);
router.post(
  "/support/status/approve/:ticketId",
  isAdminAuthenticated,
  ticketApprove,
);

router.post(
  "/support/status/reject/:ticketId",
  isAdminAuthenticated,
  ticketReject,
);
router.get("/get-roi-history", isAdminAuthenticated, getRoiHistory);
router.post("/upload-banner", bannerUpload.single("banner"), uploadBanner);
router.get("/get-banners", getBanners);
router.get("/delete-banner/:id", deleteBanner);
router.get("/withdrwal-limit", isAdminAuthenticated, updateGlobalLimit);
router.get("/all-users", isAdminAuthenticated, getAllUsers);
router.get("/withdrawal-reports", isAdminAuthenticated, allWithdrwal);
router
  .route("/admin-monthlyIncome-history")
  .get(isAdminAuthenticated, monthlyIncomeHistory);
router
  .route("/get-adminTeamReward-history")
  .get(isAdminAuthenticated, getOneTimeTeamRewardsHistory);
router.route("/admin-topup").post(isAdminAuthenticated, adminInvestment);
router
  .route("/user-withdrawal-unblock")
  .post(isAdminAuthenticated, toggleWithdrawalAccess);

router.route("/user-block/:userId").post(isAdminAuthenticated, toggleUserLogin);
router
  .route("/get-level-configuration")
  .get(isAdminAuthenticated, getLevelConfiguration);
router.route("/get-all-packages").get(isAdminAuthenticated, getAllPackages);
router.route("/update-packages").post(isAdminAuthenticated, updatePackages);
router.route("/update-level").post(isAdminAuthenticated, updateLevelConfig);
router
  .route("/get-car-funding-history")
  .get(isAdminAuthenticated, getCarFundingIncomeHistory);
router
  .route("/get-monthlyIncome-history")
  .post(isAdminAuthenticated, getAllSalaryIncomeHistory);
router
  .route("/get-deposit-bonus-history")
  .get(isAdminAuthenticated, getAllDepositBonus);
router
  .route("/get-stake-income-history")
  .get(isAdminAuthenticated, getStakeIncomeHistory);
router
  .route("/get-deposit-history")
  .get(isAdminAuthenticated, getDepositHistory);
router
  .route("/get-withdrawal-history")
  .get(isAdminAuthenticated, getAllWithdrawals);

export default router;
