import express from "express";
import {
  addPaket,
  getAllPaket,
  getPaketById,
  updatePaket,
  deletePaket,
} from "../controllers/paket_controller.js";

const router = express.Router();

router.post("/paket", addPaket);
router.get("/paket", getAllPaket);
router.get("/paket/:id_paket", getPaketById);
router.put("/paket/:id_paket", updatePaket);
router.delete("/paket/:id_paket", deletePaket);

export default router;
