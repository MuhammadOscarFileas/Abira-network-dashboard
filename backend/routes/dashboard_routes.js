import express from "express";
import {
  getDashboardSummary,
  getDashboardTagihanDetail,
} from "../controllers/dashboard_controller.js";

const router = express.Router();

router.get("/dashboard/summary", getDashboardSummary);
router.get("/dashboard/tagihan-detail", getDashboardTagihanDetail);

export default router;

