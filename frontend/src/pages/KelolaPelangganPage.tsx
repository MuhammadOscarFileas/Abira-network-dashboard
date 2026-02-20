import { useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient";
import SortableTable from "../components/SortableTable";
import type { Column } from "../components/SortableTable";
import { useAuth } from "../contexts/AuthContext";

type Pelanggan = {
  id_pelanggan: number;
  nama_pelanggan: string;
  alamat: string;
  nomor_telepon: string;
  id_bts: number;
  id_paket: number;
  paket?: { nama_paket: string; harga: number };
  ip_address: string;
  usn_mikrotik: string;
  link_maps?: string;
  latitude?: string;
  longtitude?: string;
  status_pelanggan: "aktif" | "isolir" | "nonaktif" | "berhenti" | "Fasum";
};

type BtsOption = {
  id_bts: number;
  nama_bts: string;
};

type PaketOption = {
  id_paket: number;
  nama_paket: string;
  harga: number;
};

type SortState = {
  key: string | null;
  direction: "asc" | "desc";
};

type PelangganForm = {
  nama_pelanggan: string;
  alamat: string;
  nomor_telepon: string;
  id_bts: string;
  id_paket: string;
  ip_address: string;
  usn_mikrotik: string;
  link_maps: string;
  status_pelanggan: "aktif" | "isolir" | "nonaktif" | "berhenti";
};

function KelolaPelangganPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Pelanggan[]>([]);
  const [btsOptions, setBtsOptions] = useState<BtsOption[]>([]);
  const [paketOptions, setPaketOptions] = useState<PaketOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: null, direction: "asc" });
  const [selected, setSelected] = useState<Pelanggan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pelanggan | null>(null);
  const [confirmTagihan, setConfirmTagihan] = useState<{
    id_pelanggan: number;
    nama_pelanggan: string;
  } | null>(null);
  const [creatingTagihan, setCreatingTagihan] = useState(false);
  const [koordinatTarget, setKoordinatTarget] = useState<Pelanggan | null>(null);
  const [koordinatLink, setKoordinatLink] = useState("");
  const [form, setForm] = useState<PelangganForm>({
    nama_pelanggan: "",
    alamat: "",
    nomor_telepon: "",
    id_bts: "",
    id_paket: "",
    ip_address: "",
    usn_mikrotik: "",
    link_maps: "",
    status_pelanggan: "aktif",
  });

  const fetchData = async () => {
    try {
      const [pelRes, btsRes, paketRes] = await Promise.all([
        api.get<Pelanggan[]>("/pelanggan"),
        api.get<BtsOption[]>("/bts"),
        api.get<PaketOption[]>("/paket"),
      ]);
      setData(pelRes.data);
      setBtsOptions(btsRes.data);
      setPaketOptions(paketRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(
      (p) =>
        p.nama_pelanggan.toLowerCase().includes(q) ||
        p.alamat.toLowerCase().includes(q)
    );
  }, [data, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      nama_pelanggan: "",
      alamat: "",
      nomor_telepon: "",
      id_bts: "",
      id_paket: "",
      ip_address: "",
      usn_mikrotik: "",
      link_maps: "",
      status_pelanggan: "aktif",
    });
    setShowForm(true);
  };

  const openEdit = (p: Pelanggan) => {
    setEditing(p);
    setForm({
      nama_pelanggan: p.nama_pelanggan,
      alamat: p.alamat,
      nomor_telepon: p.nomor_telepon,
      id_bts: String(p.id_bts),
      id_paket: String(p.id_paket),
      ip_address: p.ip_address,
      usn_mikrotik: p.usn_mikrotik,
      link_maps: p.latitude && p.longtitude ? `https://maps.google.com/?q=${p.latitude},${p.longtitude}` : (p.link_maps ?? ""),
      status_pelanggan: p.status_pelanggan,
    });
    setShowForm(true);
  };

  const handleDelete = async (p: Pelanggan) => {
    if (!confirm(`Yakin ingin menghapus pelanggan "${p.nama_pelanggan}"?`))
      return;
    try {
      await api.delete(`/pelanggan/${p.id_pelanggan}`);
      setSelected(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus pelanggan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const basePayload = {
      nama_pelanggan: form.nama_pelanggan,
      alamat: form.alamat,
      nomor_telepon: form.nomor_telepon,
      id_bts: Number(form.id_bts),
      id_paket: Number(form.id_paket),
      ip_address: form.ip_address,
      usn_mikrotik: form.usn_mikrotik,
      status_pelanggan: form.status_pelanggan,
    };
    try {
      if (editing) {
        await api.put(`/pelanggan/${editing.id_pelanggan}`, basePayload);

        // Catat logs edit pelanggan
        if (user) {
          try {
            await api.post("/logs", {
              id_user: user.id_user,
              action: "update",
              deskripsi: `Mengedit pelanggan "${basePayload.nama_pelanggan}" (id_pelanggan: ${editing.id_pelanggan})`,
            });
          } catch (logErr) {
            console.error("Gagal mencatat logs edit pelanggan:", logErr);
          }
        }
      } else {
        const res = await api.post("/pelanggan", {
          ...basePayload,
          link_maps: form.link_maps,
        });
        const createdId: number | undefined = res?.data?.pelanggan?.id_pelanggan;

        // Catat logs tambah pelanggan
        if (user && createdId != null) {
          try {
            await api.post("/logs", {
              id_user: user.id_user,
              action: "create",
              deskripsi: `Menambahkan pelanggan "${basePayload.nama_pelanggan}" (id_pelanggan: ${createdId})`,
            });
          } catch (logErr) {
            console.error("Gagal mencatat logs tambah pelanggan:", logErr);
          }
        }

        // Setelah simpan, tampilkan popup konfirmasi buat tagihan
        if (createdId != null) {
          setConfirmTagihan({
            id_pelanggan: createdId,
            nama_pelanggan: basePayload.nama_pelanggan,
          });
        }
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan pelanggan");
    }
  };

  const columns: Column<Pelanggan>[] = [
    { key: "nama_pelanggan", header: "Nama", sortable: true },
    { key: "alamat", header: "Alamat", sortable: true },
    { key: "nomor_telepon", header: "No. Telp", sortable: true },
    {
      key: "paket",
      header: "Paket",
      sortable: false,
      render: (row) => row.paket?.nama_paket ?? "-",
    },
    {
      key: "harga",
      header: "Harga",
      sortable: false,
      render: (row) =>
        row.paket != null
          ? `Rp ${row.paket.harga.toLocaleString("id-ID")}`
          : "-",
    },
    {
      key: "status_pelanggan",
      header: "Status",
      sortable: true,
      render: (row) => row.status_pelanggan,
    },
    {
      key: "aksi",
      header: "Aksi",
      render: (row) => (
        <button
          onClick={() => setSelected(row)}
          className="px-2 py-1 text-[11px] rounded bg-accent text-white hover:bg-blue-600"
        >
          Detail
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kelola Pelanggan</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari nama / alamat..."
            className="w-60 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={openAdd}
            className="px-3 py-1.5 text-xs rounded bg-primary text-white hover:bg-[#121a5a]"
          >
            + Tambah
          </button>
        </div>
      </div>
      <div className="bg-secondary rounded-xl shadow p-4">
        {loading ? (
          <div className="text-sm">Memuat data...</div>
        ) : (
          <SortableTable
            columns={columns}
            data={filtered}
            sort={sort}
            setSort={setSort}
          />
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-secondary pb-3">
              <h3 className="text-sm font-semibold">
                Detail Pelanggan - {selected.nama_pelanggan}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium">ID Pelanggan:</span>{" "}
                {selected.id_pelanggan}
              </div>
              <div>
                <span className="font-medium">Alamat:</span>{" "}
                {selected.alamat}
              </div>
              <div>
                <span className="font-medium">No. Telp:</span>{" "}
                {selected.nomor_telepon}
              </div>
              <div>
                <span className="font-medium">IP Address:</span>{" "}
                {selected.ip_address || "-"}
              </div>
              <div>
                <span className="font-medium">USN Mikrotik:</span>{" "}
                {selected.usn_mikrotik || "-"}
              </div>
              <div>
                <span className="font-medium">Paket:</span>{" "}
                {selected.paket?.nama_paket ?? "-"}
              </div>
              <div>
                <span className="font-medium">Harga:</span>{" "}
                {selected.paket != null
                  ? `Rp ${selected.paket.harga.toLocaleString("id-ID")}`
                  : "-"}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  selected.status_pelanggan === "aktif" ? "bg-success/10 text-success" :
                  selected.status_pelanggan === "isolir" ? "bg-warning/10 text-warning" :
                  selected.status_pelanggan === "Fasum" ? "bg-blue-100 text-blue-700" :
                  "bg-danger/10 text-danger"
                }`}>
                  {selected.status_pelanggan}
                </span>
              </div>
              {(selected.latitude || selected.longtitude) && (
                <div>
                  <span className="font-medium">Koordinat:</span>{" "}
                  {selected.latitude && selected.longtitude ? (
                    <a
                      href={`https://maps.google.com/?q=${selected.latitude},${selected.longtitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {selected.latitude}, {selected.longtitude}
                    </a>
                  ) : (
                    <span>{selected.latitude || selected.longtitude || "-"}</span>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1.5 text-xs rounded border border-gray-300"
                onClick={() => setSelected(null)}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  openEdit(selected);
                  setSelected(null);
                }}
                className="px-3 py-1.5 text-xs rounded bg-accent text-white"
              >
                Edit Informasi
              </button>
              <button
                onClick={() => {
                  setKoordinatTarget(selected);
                  setKoordinatLink("");
                  setSelected(null);
                }}
                className="px-3 py-1.5 text-xs rounded bg-warning text-white"
              >
                Edit Koordinat
              </button>
              <button
                onClick={() => handleDelete(selected)}
                className="px-3 py-1.5 text-xs rounded bg-danger text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-secondary rounded-xl shadow-lg w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {editing ? "Edit Pelanggan" : "Tambah Pelanggan"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Nama</label>
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5"
                    value={form.nama_pelanggan}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nama_pelanggan: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">No. Telp</label>
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5"
                    value={form.nomor_telepon}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nomor_telepon: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Alamat</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-2 py-1.5 min-h-[60px]"
                  value={form.alamat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, alamat: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">BTS</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1.5"
                    value={form.id_bts}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, id_bts: e.target.value }))
                    }
                    required
                  >
                    <option value="">Pilih BTS</option>
                    {btsOptions.map((b) => (
                      <option key={b.id_bts} value={b.id_bts}>
                        {b.nama_bts}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Paket</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1.5"
                    value={form.id_paket}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, id_paket: e.target.value }))
                    }
                    required
                  >
                    <option value="">Pilih Paket</option>
                    {paketOptions.map((p) => (
                      <option key={p.id_paket} value={p.id_paket}>
                        {p.nama_paket} - Rp{" "}
                        {p.harga.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Status Pelanggan</label>
                <select
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={form.status_pelanggan}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status_pelanggan: e.target
                        .value as PelangganForm["status_pelanggan"],
                    }))
                  }
                >
                  <option value="aktif">Aktif</option>
                  <option value="isolir">Isolir</option>
                  <option value="nonaktif">Nonaktif</option>
                  <option value="berhenti">Berhenti</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">IP Address</label>
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5"
                    value={form.ip_address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ip_address: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">
                    User MikroTik
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5"
                    value={form.usn_mikrotik}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, usn_mikrotik: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Link Maps</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={form.link_maps}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link_maps: e.target.value }))
                  }
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs rounded border border-gray-300"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs rounded bg-primary text-white"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmTagihan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-secondary rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Buat Tagihan Bulan Ini?</h3>
              <button
                onClick={() => setConfirmTagihan(null)}
                className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-textcharcoal/70">
              Buat tagihan bulan ini untuk pelanggan{" "}
              <span className="font-semibold">{confirmTagihan.nama_pelanggan}</span>?
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded border border-gray-300"
                onClick={() => setConfirmTagihan(null)}
                disabled={creatingTagihan}
              >
                Tidak
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded bg-primary text-white disabled:opacity-50"
                disabled={creatingTagihan}
                onClick={async () => {
                  setCreatingTagihan(true);
                  try {
                    await api.post("/tagihan/generate/for-pelanggan", {
                      id_pelanggan: confirmTagihan.id_pelanggan,
                    });
                    alert("Tagihan bulan ini berhasil dibuat.");
                    setConfirmTagihan(null);
                  } catch (e) {
                    console.error(e);
                    alert("Gagal membuat tagihan bulan ini.");
                  } finally {
                    setCreatingTagihan(false);
                  }
                }}
              >
                {creatingTagihan ? "Memproses..." : "Ya"}
              </button>
            </div>
          </div>
        </div>
      )}

      {koordinatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-secondary rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Edit Koordinat Pelanggan</h3>
              <button
                onClick={() => setKoordinatTarget(null)}
                className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-textcharcoal/70">
              Pelanggan:{" "}
              <span className="font-semibold">{koordinatTarget.nama_pelanggan}</span>
            </div>
            <div>
              <label className="block mb-1 font-medium text-xs">Link Maps Baru</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs"
                value={koordinatLink}
                onChange={(e) => setKoordinatLink(e.target.value)}
                placeholder="Tempel link Google Maps…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded border border-gray-300"
                onClick={() => setKoordinatTarget(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded bg-primary text-white disabled:opacity-50"
                disabled={!koordinatLink.trim()}
                onClick={async () => {
                  try {
                    await api.put(
                      `/pelanggan/${koordinatTarget.id_pelanggan}/koordinat`,
                      { link_maps: koordinatLink }
                    );
                    if (user) {
                      try {
                        await api.post("/logs", {
                          id_user: user.id_user,
                          action: "update",
                          deskripsi: `Mengupdate koordinat pelanggan "${koordinatTarget.nama_pelanggan}"`,
                        });
                      } catch (logErr) {
                        console.error("Gagal mencatat logs koordinat pelanggan:", logErr);
                      }
                    }
                    alert("Koordinat pelanggan berhasil diperbarui.");
                    setKoordinatTarget(null);
                    fetchData();
                  } catch (e) {
                    console.error(e);
                    alert("Gagal memperbarui koordinat pelanggan.");
                  }
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KelolaPelangganPage;

