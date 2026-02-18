import express from "express";
import {
  addBts,
  updateBts,
  deleteBts,
  getAllBts,
  updateBtsKoordinat,
} from "../controllers/bts_controller.js";

const router = express.Router();

router.post("/bts", addBts);
router.get("/bts", getAllBts);
router.put("/bts/:id_bts", updateBts);
router.put("/bts/:id_bts/koordinat", updateBtsKoordinat);
router.delete("/bts/:id_bts", deleteBts);

export default router;

