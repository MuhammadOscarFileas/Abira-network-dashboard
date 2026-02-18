import { useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient";
import SortableTable from "../components/SortableTable";
import type { Column } from "../components/SortableTable";

type Bts = {
  id_bts: number;
  nama_bts: string;
  lokasi_bts: string;
  ip_address_bts: string;
  latitude?: string;
  longtitude?: string;
};

type SortState = {
  key: string | null;
  direction: "asc" | "desc";
};

type BtsForm = {
  nama_bts: string;
  lokasi_bts: string;
  ip_address_bts: string;
  link_maps: string;
};

function KelolaBtsPage() {
  const [data, setData] = useState<Bts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: null, direction: "asc" });
  const [selected, setSelected] = useState<Bts | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bts | null>(null);
  const [form, setForm] = useState<BtsForm>({
    nama_bts: "",
    lokasi_bts: "",
    ip_address_bts: "",
    link_maps: "",
  });
  const [koordinatTarget, setKoordinatTarget] = useState<Bts | null>(null);
  const [koordinatLink, setKoordinatLink] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get<Bts[]>("/bts");
      setData(res.data);
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
      (b) =>
        b.nama_bts.toLowerCase().includes(q) ||
        b.lokasi_bts.toLowerCase().includes(q)
    );
  }, [data, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      nama_bts: "",
      lokasi_bts: "",
      ip_address_bts: "",
      link_maps: "",
    });
    setShowForm(true);
  };

  const openEdit = (bts: Bts) => {
    setEditing(bts);
    setForm({
      nama_bts: bts.nama_bts,
      lokasi_bts: bts.lokasi_bts,
      ip_address_bts: bts.ip_address_bts,
      link_maps: "",
    });
    setShowForm(true);
  };

  const handleDelete = async (bts: Bts) => {
    if (!confirm(`Yakin ingin menghapus BTS "${bts.nama_bts}"?`)) return;
    try {
      await api.delete(`/bts/${bts.id_bts}`);
      setSelected(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus BTS");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const basePayload = {
      nama_bts: form.nama_bts,
      lokasi_bts: form.lokasi_bts,
      ip_address_bts: form.ip_address_bts,
    };
    try {
      if (editing) {
        await api.put(`/bts/${editing.id_bts}`, basePayload);
      } else {
        await api.post("/bts", {
          ...basePayload,
          link_maps: form.link_maps,
        });
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan BTS");
    }
  };

  const columns: Column<Bts>[] = [
    { key: "nama_bts", header: "Nama", sortable: true },
    { key: "lokasi_bts", header: "Lokasi", sortable: true },
    { key: "ip_address_bts", header: "IP Address", sortable: true },
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
        <h2 className="text-xl font-semibold">Kelola BTS</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari nama / lokasi..."
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-secondary rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Detail BTS - {selected.nama_bts}
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
                <span className="font-medium">Lokasi:</span>{" "}
                {selected.lokasi_bts}
              </div>
              <div>
                <span className="font-medium">IP Address:</span>{" "}
                {selected.ip_address_bts}
              </div>
              {selected.latitude && selected.longtitude && (
                <div>
                  <span className="font-medium">Koordinat:</span>{" "}
                  {selected.latitude}, {selected.longtitude}
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
          <div className="bg-secondary rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {editing ? "Edit BTS" : "Tambah BTS"}
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
              <div>
                <label className="block mb-1 font-medium">Nama BTS</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={form.nama_bts}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nama_bts: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Lokasi</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={form.lokasi_bts}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lokasi_bts: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">IP Address</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={form.ip_address_bts}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ip_address_bts: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Link Maps</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={form.link_maps}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link_maps: e.target.value }))
                  }
                  placeholder="Tempel link Google Maps…"
                  required={!editing}
                />
                {editing?.latitude && editing?.longtitude && (
                  <div className="mt-1 text-[11px] text-textcharcoal/60">
                    Koordinat saat ini: {editing.latitude}, {editing.longtitude}
                  </div>
                )}
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

      {koordinatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-secondary rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Edit Koordinat BTS</h3>
              <button
                onClick={() => setKoordinatTarget(null)}
                className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-textcharcoal/70">
              BTS: <span className="font-semibold">{koordinatTarget.nama_bts}</span>
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
                    await api.put(`/bts/${koordinatTarget.id_bts}/koordinat`, {
                      link_maps: koordinatLink,
                    });
                    alert("Koordinat BTS berhasil diperbarui.");
                    setKoordinatTarget(null);
                    fetchData();
                  } catch (e) {
                    console.error(e);
                    alert("Gagal memperbarui koordinat BTS.");
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

export default KelolaBtsPage;

