import BtsModel from "../models/bts_model.js";
import PelangganModel from "../models/pelanggan_model.js";

export const getViewMapsData = async (req, res) => {
  try {
    const [bts, pelanggans] = await Promise.all([
      BtsModel.findAll(),
      PelangganModel.findAll(),
    ]);

    res.json({
      bts,
      pelanggans,
    });
  } catch (error) {
    console.error("Error fetching view maps data:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message ?? String(error) });
  }
};

