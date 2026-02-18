import PelangganModel from "../models/pelanggan_model.js";
import BtsModel from "../models/bts_model.js";
import PaketModel from "../models/paket_model.js";
import { URL } from "url";
import axios from "axios";

export async function getLatitudeLongitudeFromLink(link_maps) {
  try {
    if (!link_maps) return null;

    let finalUrl = link_maps;

    // 1. Unshorten URL (maps.app.goo.gl / google redirect)
    if (
      link_maps.includes("goo.gl") ||
      link_maps.includes("maps.app") ||
      link_maps.includes("google.com")
    ) {
      try {
        const response = await axios.get(link_maps, {
          maxRedirects: 10,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          validateStatus: (s) => s >= 200 && s < 400,
        });

        finalUrl =
          response?.request?.res?.responseUrl ||
          response?.request?._redirectable?._currentUrl ||
          link_maps;
      } catch {}
    }

    // 2. Decode supaya regex bisa fleksibel
    let decodedUrl;
    try {
      decodedUrl = decodeURIComponent(finalUrl);
    } catch {
      decodedUrl = finalUrl;
    }

    // 3. Cek query param q=lat,lng
    try {
      const urlObj = new URL(decodedUrl);
      const q = urlObj.searchParams.get("q");

      if (q && q.includes(",")) {
        const [lat, lng] = q.split(",").map((v) => Number(v.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          return { latitude: lat, longitude: lng };
        }
      }
    } catch {}

    // 4. Regex fallback
    const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const regexBang = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const regexSearch =
      /\/search\/(-?\d+\.\d+)[,\s+%20%2C%2B]+(-?\d+\.\d+)/i;
    const regexShort = /\/maps\/.*?(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/;
    const regexGeneral = /(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/;

    const match =
      decodedUrl.match(regexAt) ||
      decodedUrl.match(regexBang) ||
      decodedUrl.match(regexSearch) ||
      decodedUrl.match(regexShort) ||
      decodedUrl.match(regexGeneral);

    if (match) {
      return {
        latitude: Number(match[1]),
        longitude: Number(match[2]),
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Function to add new Pelanggan
export const addPelanggan = async (req, res) => {
  const {
    nama_pelanggan,
    alamat,
    nomor_telepon,
    id_bts,
    id_paket,
    ip_address,
    usn_mikrotik,
    status_pelanggan,
    tgl_nonaktif,
    tgl_aktif_kembali,
    link_maps,
  } = req.body;

  try {
    const coords = await getLatitudeLongitudeFromLink(link_maps);

    const newPelanggan = await PelangganModel.create({
      nama_pelanggan,
      alamat,
      nomor_telepon,
      id_bts,
      id_paket,
      ip_address,
      usn_mikrotik,
      status_pelanggan: status_pelanggan || "aktif",
      tgl_nonaktif,
      tgl_aktif_kembali,
      latitude: coords?.latitude ?? null,
      longtitude: coords?.longitude ?? null,
    });

    res
      .status(201)
      .json({ message: "Pelanggan created successfully", pelanggan: newPelanggan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get single Pelanggan by ID include bts data
export const getPelangganById = async (req, res) => {
  const { id_pelanggan } = req.params;
  try {
    const pelanggan = await PelangganModel.findByPk(id_pelanggan, {
      include: [
        { model: BtsModel, as: "bts" },
        { model: PaketModel, as: "paket" },
      ],
    });
    if (pelanggan) {
      res.json(pelanggan);
    } else {
      res.status(404).json({ message: "Pelanggan not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get all Pelanggan
export const getAllPelanggan = async (req, res) => {
  try {
    const pelanggans = await PelangganModel.findAll({
      include: [
        { model: BtsModel, as: "bts" },
        { model: PaketModel, as: "paket" },
      ],
    });
    res.json(pelanggans);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to update Pelanggan
export const updatePelanggan = async (req, res) => {
  const { id_pelanggan } = req.params;
  const {
    nama_pelanggan,
    alamat,
    nomor_telepon,
    id_bts,
    id_paket,
    ip_address,
    usn_mikrotik,
    status_pelanggan,
    tgl_nonaktif,
    tgl_aktif_kembali,
    link_maps,
  } = req.body;

  try {
    const pelanggan = await PelangganModel.findByPk(id_pelanggan);
    if (!pelanggan) {
      return res.status(404).json({ message: "Pelanggan not found" });
    }

    const coords = await getLatitudeLongitudeFromLink(link_maps);

    await PelangganModel.update(
      {
        nama_pelanggan,
        alamat,
        nomor_telepon,
        id_bts,
        id_paket,
        ip_address,
        usn_mikrotik,
        status_pelanggan: status_pelanggan || pelanggan.status_pelanggan,
        tgl_nonaktif,
        tgl_aktif_kembali,
        latitude: coords?.latitude ?? pelanggan.latitude,
        longtitude: coords?.longitude ?? pelanggan.longtitude,
      },
      { where: { id_pelanggan } }
    );

    res.json({ message: "Pelanggan updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to delete Pelanggan
export const deletePelanggan = async (req, res) => {
  const { id_pelanggan } = req.params;
    try {
    const deletedPelanggan = await PelangganModel.destroy({
      where: { id_pelanggan },
    });
    if (deletedPelanggan) {
        res.json({ message: "Pelanggan deleted successfully" });
    } else {
      res.status(404).json({ message: "Pelanggan not found" });
    }
    } catch (error) {   
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Hanya update koordinat pelanggan dari link_maps
export const updatePelangganKoordinat = async (req, res) => {
  const { id_pelanggan } = req.params;
  const { link_maps } = req.body;

  try {
    const pelanggan = await PelangganModel.findByPk(id_pelanggan);
    if (!pelanggan) {
      return res.status(404).json({ message: "Pelanggan not found" });
    }

    const coords = await getLatitudeLongitudeFromLink(link_maps);
    if (!coords) {
      return res
        .status(400)
        .json({ message: "Tidak bisa membaca koordinat dari link maps" });
    }

    await PelangganModel.update(
      {
        latitude: coords.latitude,
        longtitude: coords.longitude,
      },
      { where: { id_pelanggan } }
    );

    res.json({ message: "Koordinat pelanggan diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};