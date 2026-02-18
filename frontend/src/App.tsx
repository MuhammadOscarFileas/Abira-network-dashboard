import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ViewMapsPage from "./pages/ViewMapsPage";
import UploadPembayaranPage from "./pages/UploadPembayaranPage";
import KelolaPelangganPage from "./pages/KelolaPelangganPage";
import KelolaUsersPage from "./pages/KelolaUsersPage";
import KelolaBtsPage from "./pages/KelolaBtsPage";
import KelolaPaketPage from "./pages/KelolaPaketPage";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="maps" element={<ViewMapsPage />} />
          <Route path="upload-pembayaran" element={<UploadPembayaranPage />} />
          <Route path="pelanggan" element={<KelolaPelangganPage />} />
          <Route path="users" element={<KelolaUsersPage />} />
          <Route path="bts" element={<KelolaBtsPage />} />
          <Route path="paket" element={<KelolaPaketPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

