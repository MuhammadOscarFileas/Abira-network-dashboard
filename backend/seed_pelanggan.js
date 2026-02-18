import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import axios from "axios";
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import db from "./config/database.js";
import PelangganModel from "./models/pelanggan_model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//
// ===========================
// PARSE GOOGLE MAPS COORDINATE
// ===========================
//
async function getLatitudeLongitudeFromLink(link_maps) {
  try {
    if (!link_maps) return { latitude: "", longitude: "" };

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
      } catch {
        // jika gagal redirect, tetap pakai original URL
      }
    }

    // 2. Decode URL
    let decodedUrl;
    try {
      decodedUrl = decodeURIComponent(finalUrl);
    } catch {
      decodedUrl = finalUrl;
    }

    // 3. Try query parameter q=lat,lng
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
    const regexSearch = /\/search\/(-?\d+\.\d+)[,\s+%20%2C%2B]+(-?\d+\.\d+)/i;
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

    return { latitude: "", longitude: "" };
  } catch {
    return { latitude: "", longitude: "" };
  }
}

//
// ===========================
// KONVERSI EXCEL → DATA SEEDER
// ===========================
//
async function buildSeederData() {
  const excelPath = path.join(__dirname, "data.xlsx"); // <-- Pastikan file XLSX bernama data.xlsx
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // mapping harga → id_paket
  const paketMap = {
      115000: 1,
      150000: 2,
      166500: 3,
      167000: 4,
      222000: 5,
      235000: 6,
      395000: 7,
      0: 8,
  };

  const result = [];

  for (const r of rows) {
    const alamatParts = [];
    if (r["ALAMAT SESUAI KTP"]) alamatParts.push(r["ALAMAT SESUAI KTP"]);
    if (r["ALAMAT DOMISILI"]) alamatParts.push(r["ALAMAT DOMISILI"]);

    const alamatFinal = alamatParts.join(" / ");

    // Extract latitude & longitude from link
    const coords = await getLatitudeLongitudeFromLink(r["LOKASI PELANGGAN"]);

    const idPaket = paketMap[Number(r["ABONEMEN"])] || 8;

    // Skip paket 8
    if (idPaket === 8) continue;

    result.push({
      nama_pelanggan: r["NAMA LENGKAP"] || "",
      alamat: alamatFinal || "",
      nomor_telepon: String(r["NOMOR WHATSAPP CUSTOMER"] || ""),
      tgl_nonaktif: null,
      tgl_aktif_kembali: null,
      longtitude: String(coords.longitude || ""),
      latitude: String(coords.latitude || ""),
      status_pelanggan: "aktif",
      id_paket: idPaket,
      usn_mikrotik: r["ID"] || "",
      ip_address: "",
      id_bts: 1,
      created_at: new Date(),
    });
  }

  return result;
}

//
// ===========================
// RUN SEEDER
// ===========================
//
async function seed() {
  try {
    await db.authenticate();
    console.log("Database connected...");

    // Pastikan tabel pelanggan sudah ada
    await PelangganModel.sync();

    const data = await buildSeederData();
    
    for (const pelanggan of data) {
      const existing = await PelangganModel.findOne({
        where: { usn_mikrotik: pelanggan.usn_mikrotik },
      });

      if (existing) {
        console.log(`Pelanggan ${pelanggan.usn_mikrotik} sudah ada, skip.`);
        continue;
      }

      await PelangganModel.create(pelanggan);
      console.log(`Pelanggan ${pelanggan.nama_pelanggan} berhasil ditambahkan.`);
    }

    console.log("Seeding pelanggan selesai.");
    process.exit(0);
  } catch (error) {
    console.error("Gagal seed pelanggan:", error);
    process.exit(1);
  }
}

seed();
