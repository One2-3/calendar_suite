// apps/web/src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CalendarPage from "./pages/CalendarPage";
import SearchPage from "./pages/SearchPage";
import AuthProvider from "./auth/AuthProvider"; 

export default function App() {
  return (
    <AuthProvider>    
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
    </AuthProvider>

  );
}
