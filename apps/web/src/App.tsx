// apps/web/src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CalendarPage from "./pages/CalendarPage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
