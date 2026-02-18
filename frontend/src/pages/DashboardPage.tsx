import { useEffect, useState } from "react";
import { io as socketIO } from "socket.io-client";
import { api, API_BASE_URL } from "../services/apiClient";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../contexts/AuthContext";

ChartJS.register(ArcElement, Tooltip, Legend);

type LogItem = {
  id_logs: number;
  action: string;
  deskripsi: string;
  created_at: string;
  user?: {
    nama_lengkap: string;
  };
};

type DashboardSummary = {
  month: {
    year: number;
    month: number;
  };
  pembayaran: {
    totalTagihan: number;
    sudahBayar: { count: number; totalNominal: number };
    belumBayar: { count: number; totalNominal: number };
  };
  totalPelanggan: number;
  pelangganStatus: {
    aktif: number;
    isolir: number;
    berhenti: number;
  };
  tagihanBelumSelesai?: {
    count: number;
    totalNominal: number;
  };
  recentLogs: LogItem[];
};

function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [detailType, setDetailType] = useState<"paid" | "unpaid" | null>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load awal (bulan berjalan)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<DashboardSummary>("/dashboard/summary");
        setSummary(res.data);
        setSelectedYear(res.data.month.year);
        setSelectedMonth(res.data.month.month);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Socket realtime untuk bulan berjalan
  useEffect(() => {
    const socketUrl = API_BASE_URL.replace(/\/api$/, "");
    const socket = socketIO(socketUrl);

    socket.on("dashboard:update", (data: DashboardSummary) => {
      if (!selectedYear || !selectedMonth) {
        setSummary(data);
        setSelectedYear(data.month.year);
        setSelectedMonth(data.month.month);
        return;
      }

      if (
        data.month.year === selectedYear &&
        data.month.month === selectedMonth
      ) {
        setSummary(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedYear, selectedMonth]);

  const handleChangeMonth = async (value: string) => {
    if (!value) return;
    const [yearStr, monthStr] = value.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return;
    setLoading(true);
    try {
      const res = await api.get<DashboardSummary>("/dashboard/summary", {
        params: { year, month },
      });
      setSummary(res.data);
      setSelectedYear(res.data.month.year);
      setSelectedMonth(res.data.month.month);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (type: "paid" | "unpaid") => {
    if (!summary) return;
    setDetailType(type);
    setDetailLoading(true);
    try {
      const res = await api.get<{ items: any[] }>("/dashboard/tagihan-detail", {
        params: {
          year: summary.month.year,
          month: summary.month.month,
          status: type === "paid" ? "paid" : "unpaid",
        },
      });
      setDetailItems(res.data.items ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const paidCount = summary?.pembayaran.sudahBayar.count ?? 0;
  const unpaidCount = summary?.pembayaran.belumBayar.count ?? 0;
  const totalPaid = summary?.pembayaran.sudahBayar.totalNominal ?? 0;
  const totalUnpaid = summary?.pembayaran.belumBayar.totalNominal ?? 0;

  const pieData = {
    labels: ["Sudah Bayar", "Belum Bayar"],
    datasets: [
      {
        data: [paidCount, unpaidCount],
        backgroundColor: ["#00C853", "#FF3D00"],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        {summary && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-textcharcoal/70">Periode:</span>
            <input
              type="month"
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
              value={
                selectedYear && selectedMonth
                  ? `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`
                  : ""
              }
              onChange={(e) => handleChangeMonth(e.target.value)}
            />
          </div>
        )}
      </div>
      {loading || !summary ? (
        <div>Memuat data...</div>
      ) : (
        <>
          <div className={`grid gap-4 ${user?.role === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <div className="bg-secondary rounded-xl shadow p-4 flex flex-col justify-between">
              <div className="text-sm text-textcharcoal/70">
                Pelanggan bulan ini
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-semibold">
                    {summary.pembayaran.totalTagihan}
                  </div>
                  <div className="text-xs text-textcharcoal/60">
                    Total tagihan bulan ini
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  👥
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openDetail("paid")}
              className="bg-secondary rounded-xl shadow p-4 border-l-4 border-success text-left hover:bg-green-50 transition-colors"
            >
              <div className="text-sm text-textcharcoal/70">Total Masuk</div>
              <div className="mt-3 text-2xl font-semibold text-success">
                Rp {totalPaid.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-textcharcoal/60 mt-1">
                Tagihan yang sudah dibayar
              </div>
            </button>
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => openDetail("unpaid")}
                className="bg-secondary rounded-xl shadow p-4 border-l-4 border-danger text-left hover:bg-red-50 transition-colors"
              >
                <div className="text-sm text-textcharcoal/70">Belum Masuk</div>
                <div className="mt-3 text-2xl font-semibold text-danger">
                  Rp {totalUnpaid.toLocaleString("id-ID")}
                </div>
                <div className="text-xs text-textcharcoal/60 mt-1">
                  Piutang yang belum dibayar
                </div>
              </button>
            )}
          </div>

          <div className={`grid gap-6 ${user?.role === 'admin' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {user?.role === 'admin' && (
              <div className="bg-secondary rounded-xl shadow p-4">
                <h3 className="text-sm font-semibold mb-2">
                  Status Pembayaran Bulan Ini
                </h3>
                <Pie data={pieData} />
              </div>
            )}
            <div className="bg-secondary rounded-xl shadow p-4">
              <h3 className="text-sm font-semibold mb-3">
                Total Pelanggan Saat Ini
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                  👤
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-bold">
                    {summary.totalPelanggan}
                  </div>
                  <div className="text-xs text-textcharcoal/60">
                    Terdaftar di sistem
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-background">
                      <div className="text-xl font-bold text-textcharcoal">
                        {summary.pelangganStatus.aktif}
                      </div>
                      <div className="text-[10px] text-textcharcoal/70">Aktif</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background">
                      <div className="text-xl font-bold text-textcharcoal">
                        {summary.pelangganStatus.isolir}
                      </div>
                      <div className="text-[10px] text-textcharcoal/70">Isolir</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background">
                      <div className="text-xl font-bold text-textcharcoal">
                        {summary.pelangganStatus.berhenti}
                      </div>
                      <div className="text-[10px] text-textcharcoal/70">Berhenti</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="bg-secondary rounded-xl shadow p-4 border-l-4 border-warning">
              <h3 className="text-sm font-semibold mb-2">
                Tagihan yang Belum Diselesaikan
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-textcharcoal">
                  {summary.tagihanBelumSelesai?.count ?? summary.pembayaran.belumBayar.count}
                </div>
                <div className="text-xs text-textcharcoal/60">
                  tagihan belum lunas
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-semibold text-warning">
                    Rp {(summary.tagihanBelumSelesai?.totalNominal ?? summary.pembayaran.belumBayar.totalNominal).toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-textcharcoal/60">Total nominal</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-secondary rounded-xl shadow p-4">
            <h3 className="text-sm font-semibold mb-3">10 Logs Terbaru</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-background">
                    <th className="px-3 py-2 text-left font-semibold">Waktu</th>
                    <th className="px-3 py-2 text-left font-semibold">User</th>
                    <th className="px-3 py-2 text-left font-semibold">Aksi</th>
                    <th className="px-3 py-2 text-left font-semibold">Deskripsi</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentLogs.map((log, idx) => (
                    <tr
                      key={log.id_logs}
                      className={idx % 2 === 0 ? "bg-white" : "bg-background"}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-2">
                        {log.user?.nama_lengkap ?? "-"}
                      </td>
                      <td className="px-3 py-2 capitalize">{log.action}</td>
                      <td className="px-3 py-2">{log.deskripsi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {detailType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-secondary rounded-xl shadow-xl w-full max-w-3xl max-h-[70vh] overflow-y-auto flex flex-col p-5 space-y-4">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-sm font-semibold">
                    {detailType === "paid"
                      ? "Tagihan Sudah Bayar"
                      : "Tagihan Belum Bayar"}{" "}
                    -{" "}
                    {summary &&
                      new Date(
                        summary.month.year,
                        summary.month.month - 1,
                        1
                      ).toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                  </h3>
                  <button
                    onClick={() => {
                      setDetailType(null);
                      setDetailItems([]);
                    }}
                    className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
                  >
                    ✕
                  </button>
                </div>
                {detailLoading ? (
                  <div className="text-xs text-textcharcoal/70">
                    Memuat data tagihan...
                  </div>
                ) : detailItems.length === 0 ? (
                  <div className="text-xs text-textcharcoal/70">
                    Tidak ada data tagihan untuk periode ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-background">
                          <th className="px-3 py-2 text-left font-semibold">
                            Pelanggan
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">
                            Bulan
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">
                            Nominal
                          </th>
                          {detailType === "paid" && (
                            <>
                              <th className="px-3 py-2 text-left font-semibold">
                                Tanggal Bayar
                              </th>
                              <th className="px-3 py-2 text-left font-semibold">
                                Metode
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((item) => (
                          <tr key={item.id_tagihan}>
                            <td className="px-3 py-2">
                              {item.pelanggan?.nama_pelanggan ?? "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.bulan_tahun
                                ? new Date(item.bulan_tahun).toLocaleDateString(
                                    "id-ID",
                                    { month: "long", year: "numeric" }
                                  )
                                : "-"}
                            </td>
                            <td className="px-3 py-2">
                              Rp{" "}
                              {item.nominal_tagihan
                                ? item.nominal_tagihan.toLocaleString("id-ID")
                                : "0"}
                            </td>
                            {detailType === "paid" && (
                              <>
                                <td className="px-3 py-2">
                                  {item.pembayaran?.tanggal_pembayaran
                                    ? new Date(
                                        item.pembayaran.tanggal_pembayaran
                                      ).toLocaleDateString("id-ID")
                                    : "-"}
                                </td>
                                <td className="px-3 py-2">
                                  {item.pembayaran?.metode_pembayaran ?? "-"}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end pt-2 border-t flex-shrink-0">
                  <button
                    onClick={() => {
                      setDetailType(null);
                      setDetailItems([]);
                    }}
                    className="px-4 py-2 text-xs rounded-lg bg-gray-200 text-textcharcoal hover:bg-gray-300"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardPage;

