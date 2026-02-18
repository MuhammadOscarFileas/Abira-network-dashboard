import { useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient";
import SortableTable from "../components/SortableTable";
import type { Column } from "../components/SortableTable";

type UserRow = {
  id_user: number;
  username: string;
  nama_lengkap: string;
  role: "admin" | "pegawai";
  isActive: boolean;
};

type SortState = {
  key: string | null;
  direction: "asc" | "desc";
};

type UserForm = {
  nama_lengkap: string;
  role: "admin" | "pegawai";
  isActive: boolean;
};

type NewUserForm = {
  username: string;
  nama_lengkap: string;
  role: "admin" | "pegawai";
  password: string;
};

function generateRandomPassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function KelolaUsersPage() {
  const [data, setData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: null, direction: "asc" });
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  );
  const [editForm, setEditForm] = useState<UserForm | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    username: "",
    nama_lengkap: "",
    role: "pegawai",
    password: "",
  });

  const fetchData = async () => {
    try {
      const res = await api.get<UserRow[]>("/users");
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
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.nama_lengkap.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleGeneratePassword = async (user: UserRow) => {
    const newPass = generateRandomPassword();
    setGeneratedPassword(newPass);
    try {
      await api.put(`/users/${user.id_user}`, {
        username: user.username,
        password: newPass,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
      });
      await fetchData();
      alert(
        `Password baru untuk ${user.username}: ${newPass}\nSegera salin dan beritahu user.`
      );
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah password");
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`Yakin ingin menghapus user "${user.username}"?`)) return;
    try {
      await api.delete(`/users/${user.id_user}`);
      if (selected?.id_user === user.id_user) {
        setSelected(null);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus user");
    }
  };

  const openDetail = (user: UserRow) => {
    setSelected(user);
    setEditForm({
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!selected || !editForm) return;
    try {
      await api.put(`/users/${selected.id_user}`, {
        username: selected.username,
        nama_lengkap: editForm.nama_lengkap,
        role: editForm.role,
        // password tidak diubah di sini
      });
      await fetchData();
      alert("User berhasil diperbarui");
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui user");
    }
  };

  const columns: Column<UserRow>[] = [
    { key: "username", header: "Username", sortable: true },
    { key: "nama_lengkap", header: "Nama Lengkap", sortable: true },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => row.role.toUpperCase(),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] ${
            row.isActive
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          }`}
        >
          {row.isActive ? "Aktif" : "Non Aktif"}
        </span>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openDetail(row)}
            className="px-2 py-1 text-[11px] rounded bg-accent text-white"
          >
            Detail
          </button>
          <button
            onClick={() => handleGeneratePassword(row)}
            className="px-2 py-1 text-[11px] rounded bg-primary text-white"
          >
            Ubah Password
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="px-2 py-1 text-[11px] rounded bg-danger text-white"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kelola User</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari username / nama..."
            className="w-60 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => {
              setShowAddForm(true);
              setNewUserForm({
                username: "",
                nama_lengkap: "",
                role: "admin",
                password: "",
              });
            }}
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

      {selected && editForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-secondary rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Detail User - {selected.username}
              </h3>
              <button
                onClick={() => {
                  setSelected(null);
                  setEditForm(null);
                }}
                className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium">Nama Lengkap:</span>{" "}
                <input
                  className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5"
                  value={editForm.nama_lengkap}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, nama_lengkap: e.target.value } : f
                    )
                  }
                />
              </div>
              <div>
                <span className="font-medium">Role:</span>{" "}
                <select
                  className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f
                        ? {
                            ...f,
                            role: e.target.value as "admin" | "pegawai",
                          }
                        : f
                    )
                  }
                >
                  <option value="admin">ADMIN</option>
                  <option value="pegawai">PEGAWAI</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status Aktif:</span>
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, isActive: e.target.checked } : f
                    )
                  }
                />
              </div>
              {generatedPassword && (
                <div className="mt-2 p-2 bg-background rounded border border-dashed border-gray-300">
                  <div className="font-medium mb-1">Password Terakhir:</div>
                  <div className="font-mono text-sm">{generatedPassword}</div>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1.5 text-xs rounded border border-gray-300"
                onClick={() => {
                  setSelected(null);
                  setEditForm(null);
                }}
              >
                Tutup
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-xs rounded bg-primary text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-secondary rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Tambah User</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-xs text-textcharcoal/60 hover:text-textcharcoal"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.post("/users", newUserForm);
                  await fetchData();
                  alert(
                    `User ${newUserForm.username} berhasil dibuat.\nPassword: ${newUserForm.password}`
                  );
                  setShowAddForm(false);
                } catch (err) {
                  console.error(err);
                  alert("Gagal menambah user");
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block mb-1 font-medium">Username</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={newUserForm.username}
                  onChange={(e) =>
                    setNewUserForm((f) => ({ ...f, username: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Nama Lengkap</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={newUserForm.nama_lengkap}
                  onChange={(e) =>
                    setNewUserForm((f) => ({
                      ...f,
                      nama_lengkap: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Role</label>
                <select
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  value={newUserForm.role}
                  onChange={(e) =>
                    setNewUserForm((f) => ({
                      ...f,
                      role: e.target.value as "admin" | "pegawai",
                    }))
                  }
                >
                  <option value="admin">ADMIN</option>
                  <option value="pegawai">PEGAWAI</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Password</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5"
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm((f) => ({
                        ...f,
                        password: e.target.value,
                      }))
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewUserForm((f) => ({
                        ...f,
                        password: generateRandomPassword(),
                      }))
                    }
                    className="px-2 py-1.5 text-[11px] rounded border border-gray-300"
                  >
                    Auto
                  </button>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs rounded border border-gray-300"
                  onClick={() => setShowAddForm(false)}
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

export default KelolaUsersPage;

