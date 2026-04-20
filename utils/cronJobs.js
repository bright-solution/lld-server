import cron from "node-cron";
import { distributeDailyROI } from "./distributeDailyROI.js";

cron.schedule("0 0 * * *", distributeDailyROI);
