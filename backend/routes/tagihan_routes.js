import express from "express";
import {
  addTagihan,
  getAllTagihan,
  getTagihanById,
  updateTagihan,
  deleteTagihan,
  generateTagihanForCurrentMonth,
  generateTagihanForPelangganCurrentMonth,
} from "../controllers/tagihan_controller.js";

const router = express.Router();

router.post("/tagihan", addTagihan);
router.get("/tagihan", getAllTagihan);
router.get("/tagihan/:id_tagihan", getTagihanById);
router.put("/tagihan/:id_tagihan", updateTagihan);
router.delete("/tagihan/:id_tagihan", deleteTagihan);
router.post("/tagihan/generate/month", generateTagihanForCurrentMonth);
router.post(
  "/tagihan/generate/for-pelanggan",
  generateTagihanForPelangganCurrentMonth
);

export default router;

