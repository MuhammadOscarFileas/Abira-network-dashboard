import { Op } from "sequelize";
import TagihanModel from "../models/tagihan_model.js";
import PelangganModel from "../models/pelanggan_model.js";
import LogsModel from "../models/logs_model.js";
import UserModel from "../models/users_model.js";
import PembayaranModel from "../models/pembayaran_model.js";

export const computeDashboardSummary = async (yearParam, month0Param) => {
  const now = new Date();
  const year = yearParam ?? now.getFullYear();
  const month0 = month0Param ?? now.getMonth(); // 0-based

  const startOfMonth = new Date(year, month0, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month0 + 1, 0, 23, 59, 59, 999);

  const [
    tagihans,
    totalPelanggan,
    recentLogs,
    aktifCount,
    isolirCount,
    berhentiCount,
  ] = await Promise.all([
    TagihanModel.findAll({
      where: {
        bulan_tahun: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
    }),
    PelangganModel.count(),
    LogsModel.findAll({
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["nama_lengkap"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 10,
    }),
    PelangganModel.count({ where: { status_pelanggan: "aktif" } }),
    PelangganModel.count({ where: { status_pelanggan: "isolir" } }),
    PelangganModel.count({
      where: { status_pelanggan: { [Op.in]: ["nonaktif", "berhenti"] } },
    }),
  ]);

  const totalTagihan = tagihans.length;
  const sudahBayar = tagihans.filter((t) => t.status === "Lunas");
  const belumBayar = tagihans.filter((t) => t.status !== "Lunas");

  // Tagihan belum diselesaikan (semua bulan, status bukan Lunas)
  const tagihanBelumSelesaiList = await TagihanModel.findAll({
    where: { status: { [Op.ne]: "Lunas" } },
  });
  const tagihanBelumSelesai = {
    count: tagihanBelumSelesaiList.length,
    totalNominal: tagihanBelumSelesaiList.reduce(
      (sum, t) => sum + (t.nominal_tagihan || 0),
      0
    ),
  };

  const totalNominalSudah = sudahBayar.reduce(
    (sum, t) => sum + (t.nominal_tagihan || 0),
    0
  );
  const totalNominalBelum = belumBayar.reduce(
    (sum, t) => sum + (t.nominal_tagihan || 0),
    0
  );

  return {
    month: {
      year,
      month: month0 + 1,
    },
    pembayaran: {
      totalTagihan,
      sudahBayar: {
        count: sudahBayar.length,
        totalNominal: totalNominalSudah,
      },
      belumBayar: {
        count: belumBayar.length,
        totalNominal: totalNominalBelum,
      },
    },
    totalPelanggan,
    pelangganStatus: {
      aktif: aktifCount,
      isolir: isolirCount,
      berhenti: berhentiCount,
    },
    tagihanBelumSelesai,
    recentLogs,
  };
};

export const getDashboardSummary = async (req, res) => {
  try {
    const yearRaw =
      req.query.year != null ? Number.parseInt(String(req.query.year), 10) : NaN;
    const monthRaw =
      req.query.month != null ? Number.parseInt(String(req.query.month), 10) : NaN;
    const year = Number.isFinite(yearRaw) ? yearRaw : undefined;
    const month0 = Number.isFinite(monthRaw) ? monthRaw - 1 : undefined;

    const summary = await computeDashboardSummary(year, month0);
    res.json(summary);
  } catch (error) {
    console.error("Error computing dashboard summary:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message ?? String(error) });
  }
};

export const getDashboardTagihanDetail = async (req, res) => {
  try {
    const now = new Date();
    const yearQ =
      req.query.year != null ? Number.parseInt(String(req.query.year), 10) : NaN;
    const monthQ =
      req.query.month != null ? Number.parseInt(String(req.query.month), 10) : NaN;
    const statusFilter = String(req.query.status ?? "all"); // "paid" | "unpaid" | "all"

    const year = Number.isFinite(yearQ) ? yearQ : now.getFullYear();
    const month0 = Number.isFinite(monthQ) ? monthQ - 1 : now.getMonth();

    const startOfMonth = new Date(year, month0, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month0 + 1, 0, 23, 59, 59, 999);

    const where = {
      bulan_tahun: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    };

    if (statusFilter === "paid") {
      where.status = "Lunas";
    } else if (statusFilter === "unpaid") {
      where.status = { [Op.ne]: "Lunas" };
    }

    const items = await TagihanModel.findAll({
      where,
      include: [
        { model: PelangganModel, as: "pelanggan" },
        { model: PembayaranModel, as: "pembayaran" },
      ],
      order: [
        ["bulan_tahun", "ASC"],
        ["id_tagihan", "ASC"],
      ],
    });

    res.json({ items });
  } catch (error) {
    console.error("Error getting dashboard tagihan detail:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message ?? String(error) });
  }
};

