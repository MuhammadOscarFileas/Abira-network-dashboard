import { Op } from "sequelize";
import TagihanModel from "../models/tagihan_model.js";
import PelangganModel from "../models/pelanggan_model.js";
import PembayaranModel from "../models/pembayaran_model.js";
import PaketModel from "../models/paket_model.js";

// Function to add new Tagihan
export const addTagihan = async (req, res) => {
  const { id_pelanggan, bulan_tahun, nominal_tagihan, status } = req.body;

  try {
    const newTagihan = await TagihanModel.create({
      id_pelanggan,
      bulan_tahun,
      nominal_tagihan,
      status,
    });

    res
      .status(201)
      .json({ message: "Tagihan created successfully", tagihan: newTagihan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get all Tagihan (include Pelanggan dan Pembayaran)
export const getAllTagihan = async (req, res) => {
  try {
    const where = {};
    const { id_pelanggan } = req.query;
    if (id_pelanggan) {
      where.id_pelanggan = id_pelanggan;
    }

    const tagihans = await TagihanModel.findAll({
      where,
      include: [
        {
          model: PelangganModel,
          as: "pelanggan",
        },
        {
          model: PembayaranModel,
          as: "pembayaran",
        },
      ],
    });

    res.json(tagihans);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMonthRange = (year, month0) => {
  const start = new Date(year, month0, 1, 0, 0, 0, 0);
  const end = new Date(year, month0 + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

export const generateTagihanForMonth = async (year, month0) => {
  const { start, end } = getMonthRange(year, month0);

  const pelanggans = await PelangganModel.findAll({
    where: { status_pelanggan: "aktif" },
    include: [{ model: PaketModel, as: "paket" }],
  });

  for (const p of pelanggans) {
    const existing = await TagihanModel.findOne({
      where: {
        id_pelanggan: p.id_pelanggan,
        bulan_tahun: { [Op.between]: [start, end] },
      },
    });
    if (existing) continue;

    const paket = p.paket;
    const nominal = paket && typeof paket.harga === "number" ? paket.harga : 0;

    await TagihanModel.create({
      id_pelanggan: p.id_pelanggan,
      bulan_tahun: start,
      nominal_tagihan: nominal,
      status: "Belum Lunas",
    });
  }
};

export const generateTagihanForCurrentMonth = async (req, res) => {
  try {
    const now = new Date();
    await generateTagihanForMonth(now.getFullYear(), now.getMonth());
    res.json({ message: "Tagihan bulan ini digenerate (idempotent)" });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error?.message ?? String(error),
    });
  }
};

export const generateTagihanForPelangganCurrentMonth = async (req, res) => {
  try {
    const { id_pelanggan } = req.body;
    if (!id_pelanggan) {
      return res.status(400).json({ message: "id_pelanggan is required" });
    }

    const now = new Date();
    const { start, end } = getMonthRange(now.getFullYear(), now.getMonth());

    const pelanggan = await PelangganModel.findByPk(id_pelanggan, {
      include: [{ model: PaketModel, as: "paket" }],
    });
    if (!pelanggan) {
      return res.status(404).json({ message: "Pelanggan not found" });
    }

    const existing = await TagihanModel.findOne({
      where: { id_pelanggan, bulan_tahun: { [Op.between]: [start, end] } },
    });
    if (existing) {
      return res.json({ message: "Tagihan bulan ini sudah ada" });
    }

    const paket = pelanggan.paket;
    const nominal =
      paket && typeof paket.harga === "number" ? paket.harga : 0;

    const tagihan = await TagihanModel.create({
      id_pelanggan,
      bulan_tahun: start,
      nominal_tagihan: nominal,
      status: "Belum Lunas",
    });

    res.json({
      message: "Tagihan bulan ini dibuat untuk pelanggan",
      tagihan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error?.message ?? String(error),
    });
  }
};

// Function to get single Tagihan by ID
export const getTagihanById = async (req, res) => {
  const { id_tagihan } = req.params;

  try {
    const tagihan = await TagihanModel.findByPk(id_tagihan, {
      include: [
        {
          model: PelangganModel,
          as: "pelanggan",
        },
        {
          model: PembayaranModel,
          as: "pembayaran",
        },
      ],
    });

    if (!tagihan) {
      return res.status(404).json({ message: "Tagihan not found" });
    }

    res.json(tagihan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to update Tagihan
export const updateTagihan = async (req, res) => {
  const { id_tagihan } = req.params;
  const { id_pelanggan, bulan_tahun, nominal_tagihan, status } = req.body;

  try {
    const tagihan = await TagihanModel.findByPk(id_tagihan);
    if (!tagihan) {
      return res.status(404).json({ message: "Tagihan not found" });
    }

    await TagihanModel.update(
      {
        id_pelanggan,
        bulan_tahun,
        nominal_tagihan,
        status,
      },
      { where: { id_tagihan } }
    );

    res.json({ message: "Tagihan updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to delete Tagihan
export const deleteTagihan = async (req, res) => {
  const { id_tagihan } = req.params;

  try {
    const deletedTagihan = await TagihanModel.destroy({
      where: { id_tagihan },
    });

    if (!deletedTagihan) {
      return res.status(404).json({ message: "Tagihan not found" });
    }

    res.json({ message: "Tagihan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
