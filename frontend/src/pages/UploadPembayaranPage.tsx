import { useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient";
import SortableTable from "../components/SortableTable";
import type { Column } from "../components/SortableTable";
import { useAuth } from "../contexts/AuthContext";

type Pelanggan = {
  id_pelanggan: number;
  nama_pelanggan: string;
  alamat: string;
};

type Tagihan = {
  id_tagihan: number;
  bulan_tahun: string;
  nominal_tagihan: number;
  status: string;
};

type SortState = {
  key: string | null;
  direction: "asc" | "desc";
};

type InvoicePreview = {
  tagihan: Tagihan;
  tanggal_pembayaran: string;
  metode_pembayaran: "Cash" | "Transfer" | "E-Wallet";
  diskon: number;
  total_pembayaran: number;
};

function UploadPembayaranPage() {
  const { user } = useAuth();
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(
    null
  );
  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: null, direction: "asc" });
  const [generating, setGenerating] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState<InvoicePreview | null>(null);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [submittingBayar, setSubmittingBayar] = useState(false);

  useEffect(() => {
    const fetchPelanggan = async () => {
      try {
        const res = await api.get<Pelanggan[]>("/pelanggan");
        setPelanggan(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPelanggan();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pelanggan.filter(
      (p) =>
        p.nama_pelanggan.toLowerCase().includes(q) ||
        p.alamat.toLowerCase().includes(q)
    );
  }, [pelanggan, search]);

  const columns: Column<Pelanggan>[] = [
    { key: "nama_pelanggan", header: "Nama", sortable: true },
    { key: "alamat", header: "Alamat", sortable: true },
    {
      key: "aksi",
      header: "Aksi",
      render: (row) => (
        <button
          onClick={async () => {
            setSelectedPelanggan(row);
            try {
              const res = await api.get<Tagihan[]>("/tagihan", {
                params: { id_pelanggan: row.id_pelanggan },
              });
              setTagihan(res.data);
            } catch (err) {
              console.error(err);
            }
          }}
          className="px-2 py-1 text-[11px] rounded bg-accent text-white"
        >
          Pilih
        </button>
      ),
    },
  ];

  const handleBuatTagihanBulanIni = async () => {
    setGenerating(true);
    try {
      await api.post("/tagihan/generate/month");
      alert("Tagihan bulan ini berhasil dibuat untuk semua pelanggan aktif.");
    } catch (err) {
      console.error(err);
      alert("Gagal membuat tagihan bulan ini.");
    } finally {
      setGenerating(false);
    }
  };

  const openInvoicePreview = (t: Tagihan) => {
    setBuktiFile(null);
    setInvoicePreview({
      tagihan: t,
      tanggal_pembayaran: new Date().toISOString().slice(0, 10),
      metode_pembayaran: "Cash",
      diskon: 0,
      total_pembayaran: t.nominal_tagihan,
    });
  };

  const handleBayar = async () => {
    if (!invoicePreview || !user) return;
    setSubmittingBayar(true);
    try {
      const formData = new FormData();
      if (buktiFile) {
        formData.append("bukti_pembayaran", buktiFile);
      }
      formData.append("tanggal_pembayaran", invoicePreview.tanggal_pembayaran);
      formData.append("metode_pembayaran", invoicePreview.metode_pembayaran);
      formData.append("diskon", String(invoicePreview.diskon));
      formData.append("total_pembayaran", String(invoicePreview.total_pembayaran));
      formData.append("id_tagihan", String(invoicePreview.tagihan.id_tagihan));
      formData.append("id_user", String(user.id_user));

      await api.post("/pembayaran/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTagihan((prev) =>
        prev.map((t) =>
          t.id_tagihan === invoicePreview.tagihan.id_tagihan
            ? { ...t, status: "Lunas" }
            : t
        )
      );

      // Catat logs upload pembayaran
      try {
        const bulanLabel = new Date(invoicePreview.tagihan.bulan_tahun).toLocaleDateString(
          "id-ID",
          { month: "long", year: "numeric" }
        );
        await api.post("/logs", {
          id_user: user.id_user,
          action: "create",
          deskripsi: `Upload pembayaran pelanggan "${
            selectedPelanggan?.nama_pelanggan ?? "-"
          }" untuk tagihan ${bulanLabel} (id_tagihan: ${
            invoicePreview.tagihan.id_tagihan
          })`,
        });
      } catch (e) {
        console.error("Gagal mencatat logs pembayaran:", e);
      }

      setInvoicePreview(null);
      setBuktiFile(null);
      alert("Pembayaran berhasil. Status tagihan menjadi Lunas.");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan pembayaran.");
    } finally {
      setSubmittingBayar(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Upload Pembayaran</h2>
        <button
          onClick={handleBuatTagihanBulanIni}
          disabled={generating}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {generating ? "Memproses..." : "Buat tagihan bulan ini"}
        </button>
      </div>
      {!selectedPelanggan && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-textcharcoal/70">
              Pilih pelanggan terlebih dahulu
            </span>
            <input
              type="text"
              placeholder="Cari nama / alamat..."
              className="w-60 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-secondary rounded-xl shadow p-4">
            <SortableTable
              columns={columns}
              data={filtered}
              sort={sort}
              setSort={setSort}
            />
          </div>
        </>
      )}

      {selectedPelanggan && (
        <div className="bg-secondary rounded-xl shadow p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                Tagihan - {selectedPelanggan.nama_pelanggan}
              </div>
              <div className="text-xs text-textcharcoal/60">
                {selectedPelanggan.alamat}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedPelanggan(null);
                setTagihan([]);
              }}
              className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
            >
              Ganti Pelanggan
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="min-w-full">
              <thead>
                <tr className="bg-background">
                  <th className="px-3 py-2 text-left font-semibold">
                    Bulan
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Nominal
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Tunggakan
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tagihan.map((t, idx) => (
                  <tr
                    key={t.id_tagihan}
                    className={idx % 2 === 0 ? "bg-white" : "bg-background"}
                  >
                    <td className="px-3 py-2">
                      {new Date(t.bulan_tahun).toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      Rp {t.nominal_tagihan.toLocaleString("id-ID")}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] ${
                          t.status === "Lunas"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {t.status === "Lunas" ? "-" : "Belum lunas"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        disabled={t.status === "Lunas"}
                        onClick={() => openInvoicePreview(t)}
                        className="px-3 py-1.5 text-[11px] rounded bg-primary text-white disabled:opacity-50"
                      >
                        Bayar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoicePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-secondary rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Preview Invoice Pembayaran
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 text-sm">
                {selectedPelanggan && (
                  <>
                    <div>
                      <span className="text-textcharcoal/70">Pelanggan</span>
                      <div className="font-medium">{selectedPelanggan.nama_pelanggan}</div>
                      <div className="text-xs text-textcharcoal/60">{selectedPelanggan.alamat}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-textcharcoal/70">Tagihan (Bulan)</span>
                        <div className="font-medium">
                          {new Date(invoicePreview.tagihan.bulan_tahun).toLocaleDateString("id-ID", {
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-textcharcoal/70">Nominal Tagihan</span>
                        <div className="font-medium">
                          Rp {invoicePreview.tagihan.nominal_tagihan.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-textcharcoal/70 block mb-1">Tanggal Pembayaran</label>
                    <input
                      type="date"
                      value={invoicePreview.tanggal_pembayaran}
                      onChange={(e) =>
                        setInvoicePreview((p) =>
                          p ? { ...p, tanggal_pembayaran: e.target.value } : null
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-textcharcoal/70 block mb-1">Metode Pembayaran</label>
                    <select
                      value={invoicePreview.metode_pembayaran}
                      onChange={(e) =>
                        setInvoicePreview((p) =>
                          p
                            ? {
                                ...p,
                                metode_pembayaran: e.target.value as
                                  | "Cash"
                                  | "Transfer"
                                  | "E-Wallet",
                              }
                            : null
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Transfer</option>
                      <option value="E-Wallet">E-Wallet</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-textcharcoal/70 block mb-1">Diskon (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={invoicePreview.diskon}
                      onChange={(e) =>
                        setInvoicePreview((p) =>
                          p ? { ...p, diskon: Number(e.target.value) || 0 } : null
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-textcharcoal/70 block mb-1">Total Pembayaran (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={invoicePreview.total_pembayaran}
                      onChange={(e) =>
                        setInvoicePreview((p) =>
                          p ? { ...p, total_pembayaran: Number(e.target.value) || 0 } : null
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-textcharcoal/50 pt-1">
                  id_tagihan: {invoicePreview.tagihan.id_tagihan}
                  {user && ` · id_user: ${user.id_user}`}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-textcharcoal/70 block text-sm">Bukti Pembayaran</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setBuktiFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary file:text-white file:text-xs"
                />
                <div className="w-full min-h-[260px] rounded-xl border-2 border-dashed border-gray-300 bg-background flex items-center justify-center overflow-hidden">
                  {buktiFile ? (
                    buktiFile.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(buktiFile)}
                        alt="Preview bukti"
                        className="max-h-[340px] w-auto object-contain"
                      />
                    ) : (
                      <div className="p-4 text-center text-sm text-textcharcoal/70">
                        <p className="font-medium">{buktiFile.name}</p>
                        <p className="text-xs mt-1">File non-gambar (PDF/dll)</p>
                      </div>
                    )
                  ) : (
                    <span className="text-sm text-textcharcoal/50">
                      Pilih file untuk preview
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setInvoicePreview(null);
                  setBuktiFile(null);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-textcharcoal hover:bg-gray-300"
              >
                Tutup
              </button>
              <button
                onClick={handleBayar}
                disabled={submittingBayar}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {submittingBayar ? "Memproses..." : "Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPembayaranPage;

