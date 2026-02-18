import BtsModel from "../models/bts_model.js";
import { getLatitudeLongitudeFromLink } from "./pelanggan_controller.js";

// Function to add new BTS
export const addBts = async (req, res) => {
  const { nama_bts, ip_address_bts, lokasi_bts, latitude, longtitude, link_maps } =
    req.body;
  try {
    const coords = await getLatitudeLongitudeFromLink(link_maps);
    const lat = coords?.latitude ?? latitude;
    const lng = coords?.longitude ?? longtitude;

    if (lat == null || lng == null) {
      return res.status(400).json({
        message:
          "Koordinat tidak ditemukan. Harap isi link_maps yang valid atau latitude/longtitude.",
      });
    }

    const newBts = await BtsModel.create({
      nama_bts,
      ip_address_bts,
      lokasi_bts,
      latitude: String(lat),
      longtitude: String(lng),
    });
    res.status(201).json({ message: "BTS created successfully", bts: newBts });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function update BTS
export const updateBts = async (req, res) => {
  const { id_bts } = req.params;
  const { nama_bts, ip_address_bts, lokasi_bts, latitude, longtitude, link_maps } =
    req.body;
  try {
    const bts = await BtsModel.findByPk(id_bts);
    if (!bts) {
      return res.status(404).json({ message: "BTS not found" });
    }

    const coords = await getLatitudeLongitudeFromLink(link_maps);
    const lat = coords?.latitude ?? latitude ?? bts.latitude;
    const lng = coords?.longitude ?? longtitude ?? bts.longtitude;

    await BtsModel.update(
      {
        nama_bts,
        ip_address_bts,
        lokasi_bts,
        latitude: String(lat),
        longtitude: String(lng),
      },
      { where: { id_bts } }
    );
    res.json({ message: "BTS updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function delete BTS
export const deleteBts = async (req, res) => {
  const { id_bts } = req.params;
    try {
    const deletedBts = await BtsModel.destroy({
      where: { id_bts },
    });
    if (deletedBts) {
        res.json({ message: "BTS deleted successfully" });
    } else {
      res.status(404).json({ message: "BTS not found" });
    }
    } catch (error) {   
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get all BTS
export const getAllBts = async (req, res) => {
  try { 
    const btsList = await BtsModel.findAll();
    res.json(btsList);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Hanya update koordinat BTS dari link_maps
export const updateBtsKoordinat = async (req, res) => {
  const { id_bts } = req.params;
  const { link_maps } = req.body;

  try {
    const bts = await BtsModel.findByPk(id_bts);
    if (!bts) {
      return res.status(404).json({ message: "BTS not found" });
    }

    const coords = await getLatitudeLongitudeFromLink(link_maps);
    if (!coords) {
      return res
        .status(400)
        .json({ message: "Tidak bisa membaca koordinat dari link maps" });
    }

    await BtsModel.update(
      {
        latitude: String(coords.latitude),
        longtitude: String(coords.longitude),
      },
      { where: { id_bts } }
    );

    res.json({ message: "Koordinat BTS diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

