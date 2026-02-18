import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { api } from "../services/apiClient";

type Bts = {
  id_bts: number;
  nama_bts: string;
  lokasi_bts: string;
  latitude: string;
  longtitude: string;
};

type Pelanggan = {
  id_pelanggan: number;
  nama_pelanggan: string;
  alamat: string;
  latitude: string | null;
  longtitude: string | null;
  isActive?: boolean;
};

type ViewMapsResponse = {
  bts: Bts[];
  pelanggans: Pelanggan[];
};

type SelectedInfo =
  | { type: "bts"; data: Bts }
  | { type: "pelanggan"; data: Pelanggan }
  | null;

function ViewMapsPage() {
  const [btsList, setBtsList] = useState<Bts[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [selected, setSelected] = useState<SelectedInfo>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<ViewMapsResponse>("/view-maps");
        setBtsList(res.data.bts);
        setPelangganList(res.data.pelanggans);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Default fokus ke Klaten
  const center: [number, number] = [-7.705, 110.607];

  const btsIcon = L.divIcon({
    className: "",
    html:
      '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:#FF3D00;color:white;box-shadow:0 0 6px rgba(0,0,0,0.3);"><span class="material-icons" style="font-size:18px;">cell_tower</span></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const pelangganIcon = L.divIcon({
    className: "",
    html:
      '<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:#00C853;color:white;box-shadow:0 0 6px rgba(0,0,0,0.3);"><span class="material-icons" style="font-size:16px;">person</span></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-4">
      <div className="flex-1 rounded-xl overflow-hidden shadow bg-secondary">
        <MapContainer
          center={center}
          zoom={12}
          className="w-full h-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {btsList.map((bts) => {
            const lat = Number(bts.latitude);
            const lng = Number(bts.longtitude);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
            return (
              <Marker
                key={`bts-${bts.id_bts}`}
                position={[lat, lng]}
                icon={btsIcon}
                eventHandlers={{
                  click: () => setSelected({ type: "bts", data: bts }),
                }}
              >
                <Popup>{bts.nama_bts}</Popup>
              </Marker>
            );
          })}

          {pelangganList.map((p) => {
            if (!p.latitude || !p.longtitude) return null;
            const lat = Number(p.latitude);
            const lng = Number(p.longtitude);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
            return (
              <Marker
                key={`pel-${p.id_pelanggan}`}
                position={[lat, lng]}
                icon={pelangganIcon}
                eventHandlers={{
                  click: () => setSelected({ type: "pelanggan", data: p }),
                }}
              >
                <Popup>{p.nama_pelanggan}</Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="w-80 bg-secondary rounded-xl shadow p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-3">Detail</h3>
        {!selected && (
          <p className="text-xs text-textcharcoal/70">
            Klik marker BTS atau Pelanggan di peta untuk melihat detail di
            panel ini.
          </p>
        )}
        {selected?.type === "bts" && (
          <div className="space-y-2 text-sm">
            <div className="text-xs font-semibold text-primary uppercase">
              BTS
            </div>
            <div>
              <span className="font-medium">Nama:</span> {selected.data.nama_bts}
            </div>
            <div>
              <span className="font-medium">Lokasi:</span>{" "}
              {selected.data.lokasi_bts}
            </div>
            <div>
              <span className="font-medium">Koordinat:</span>{" "}
              {selected.data.latitude}, {selected.data.longtitude}
            </div>
          </div>
        )}
        {selected?.type === "pelanggan" && (
          <div className="space-y-2 text-sm">
            <div className="text-xs font-semibold text-primary uppercase">
              Pelanggan
            </div>
            <div>
              <span className="font-medium">Nama:</span>{" "}
              {selected.data.nama_pelanggan}
            </div>
            <div>
              <span className="font-medium">Alamat:</span>{" "}
              {selected.data.alamat}
            </div>
            <div>
              <span className="font-medium">Koordinat:</span>{" "}
              {selected.data.latitude}, {selected.data.longtitude}
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  selected.data.isActive !== false
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {selected.data.isActive !== false ? "Aktif" : "Non Aktif"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewMapsPage;

