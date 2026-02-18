import PembayaranModel from "../models/pembayaran_model.js";
import TagihanModel from "../models/tagihan_model.js";
import UserModel from "../models/users_model.js";

// Function to add new Pembayaran (with optional file from multer)
export const addPembayaran = async (req, res) => {
  const body = req.body || {};
  let bukti_pembayaran = body.bukti_pembayaran;
  if (req.file && req.file.filename) {
    bukti_pembayaran = req.file.filename;
  }
  const {
    tanggal_pembayaran,
    metode_pembayaran,
    diskon,
    total_pembayaran,
    id_tagihan,
    id_user,
  } = body;

  try {
    // Pastikan tagihan ada
    const tagihan = await TagihanModel.findByPk(id_tagihan);
    if (!tagihan) {
      return res.status(404).json({ message: "Tagihan not found" });
    }

    // Pastikan user ada
    const user = await UserModel.findByPk(id_user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPembayaran = await PembayaranModel.create({
      tanggal_pembayaran,
      metode_pembayaran,
      bukti_pembayaran: bukti_pembayaran || "placeholder",
      diskon: Number(diskon) || 0,
      total_pembayaran: Number(total_pembayaran) || 0,
      id_tagihan: Number(id_tagihan),
      id_user: Number(id_user),
    });

    // Update status tagihan menjadi Lunas
    await TagihanModel.update(
      { status: "Lunas" },
      { where: { id_tagihan } }
    );

    res.status(201).json({
      message: "Pembayaran created successfully",
      pembayaran: newPembayaran,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get all Pembayaran
export const getAllPembayaran = async (req, res) => {
  try {
    const pembayarans = await PembayaranModel.findAll({
      include: [
        {
          model: TagihanModel,
          as: "tagihan",
        },
        {
          model: UserModel,
          as: "user",
        },
      ],
    });

    res.json(pembayarans);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get single Pembayaran by ID
export const getPembayaranById = async (req, res) => {
  const { id_pembayaran } = req.params;

  try {
    const pembayaran = await PembayaranModel.findByPk(id_pembayaran, {
      include: [
        {
          model: TagihanModel,
          as: "tagihan",
        },
        {
          model: UserModel,
          as: "user",
        },
      ],
    });

    if (!pembayaran) {
      return res.status(404).json({ message: "Pembayaran not found" });
    }

    res.json(pembayaran);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to delete Pembayaran
export const deletePembayaran = async (req, res) => {
  const { id_pembayaran } = req.params;

  try {
    const deletedPembayaran = await PembayaranModel.destroy({
      where: { id_pembayaran },
    });

    if (!deletedPembayaran) {
      return res.status(404).json({ message: "Pembayaran not found" });
    }

    res.json({ message: "Pembayaran deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
