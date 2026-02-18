import express from "express";
import {
  addPelanggan,
  getPelangganById,
  getAllPelanggan,
  updatePelanggan,
  deletePelanggan,
  updatePelangganKoordinat,
} from "../controllers/pelanggan_controller.js";

const router = express.Router();

router.post("/pelanggan", addPelanggan);
router.get("/pelanggan", getAllPelanggan);
router.get("/pelanggan/:id_pelanggan", getPelangganById);
router.put("/pelanggan/:id_pelanggan", updatePelanggan);
router.put(
  "/pelanggan/:id_pelanggan/koordinat",
  updatePelangganKoordinat
);
router.delete("/pelanggan/:id_pelanggan", deletePelanggan);

export default router;

