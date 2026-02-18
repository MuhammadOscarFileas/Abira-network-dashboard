import { useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient";
import SortableTable from "../components/SortableTable";
import type { Column } from "../components/SortableTable";

type Paket = {
  id_paket: number;
  nama_paket: string;
  harga: number;
};

type SortState = {
  key: string | null;
  direction: "asc" | "desc";
};

type PaketForm = {
  nama_paket: string;
  harga: string;
};

function KelolaPaketPage() {
  const [data, setData] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: null, direction: "asc" });
  const [selected, setSelected] = useState<Paket | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Paket | null>(null);
  const [form, setForm] = useState<PaketForm>({
    nama_paket: "",
    harga: "",
  });

  const fetchData = async () => {
    try {
      const res = await api.get<Paket[]>("/paket");
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
      (p) =>
        p.nama_paket.toLowerCase().includes(q) ||
        String(p.harga).toLowerCase().includes(q)
    );
  }, [data, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ nama_paket: "", harga: "" });
    setShowForm(true);
  };

  const openEdit = (paket: Paket) => {
    setEditing(paket);
    setForm({ nama_paket: paket.nama_paket, harga: String(paket.harga) });
    setShowForm(true);
  };

  const handleDelete = async (paket: Paket) => {
    if (!confirm(`Yakin ingin menghapus paket "${paket.nama_paket}"?`)) return;
    try {
      await api.delete(`/paket/${paket.id_paket}`);
      setSelected(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus paket");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nama_paket: form.nama_paket,
      harga: Number(form.harga),
    };
    try {
      if (editing) {
        await api.put(`/paket/${editing.id_paket}`, payload);
      } else {
        await api.post("/paket", payload);
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan paket");
    }
  };

  const columns: Column<Paket>[] = [
    { key: "nama_paket", header: "Nama Paket", sortable: true },
    {
      key: "harga",
      header: "Harga",
      sortable: true,
      render: (row) => `Rp ${row.harga.toLocaleString("id-ID")}`,
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
        <h2 className="text-xl font-semibold">Kelola Paket</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari nama / harga..."
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
                Detail Paket - {selected.nama_paket}
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
                <span className="font-medium">Nama Paket:</span>{" "}
                {selected.nama_paket}
              </div>
              <div>
                <span className="font-medium">Harga:</span> Rp{" "}
                {selected.harga.toLocaleString("id-ID")}
              </div>
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
                Edit
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
                {editing ? "Edit Paket" : "Tambah Paket"}
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
                <label className="block mb-1 font-medium">Nama Paket</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={form.nama_paket}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nama_paket: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Harga</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={form.harga}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, harga: e.target.value }))
                  }
                  required
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
    </div>
  );
}

export default KelolaPaketPage;
