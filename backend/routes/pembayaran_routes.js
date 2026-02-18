import express from "express";
import {
  addPembayaran,
  getAllPembayaran,
  getPembayaranById,
  deletePembayaran,
} from "../controllers/pembayaran_controller.js";
import { uploadBukti } from "../config/multer.js";

const router = express.Router();

router.post("/pembayaran", addPembayaran);
router.post(
  "/pembayaran/upload",
  uploadBukti.single("bukti_pembayaran"),
  addPembayaran
);
router.get("/pembayaran", getAllPembayaran);
router.get("/pembayaran/:id_pembayaran", getPembayaranById);
router.delete("/pembayaran/:id_pembayaran", deletePembayaran);

export default router;

