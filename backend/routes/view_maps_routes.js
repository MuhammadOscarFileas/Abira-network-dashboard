import express from "express";
import { getViewMapsData } from "../controllers/view_maps_controller.js";

const router = express.Router();

router.get("/view-maps", getViewMapsData);

export default router;

