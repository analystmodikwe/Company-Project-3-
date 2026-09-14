// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Catalogue from "./pages/Catalogue";
import Dashboard from "./pages/Dashboard";
import BookResource from "./pages/BookResource";
import Donate from "./pages/Donate";



function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Auth />} />

        {/* We'll add  /admin, /donate as we build them */}

        <Route path="/catalogue" element={<Catalogue />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/book/:resourceId"
          element={
            <ProtectedRoute>
              <BookResource />
            </ProtectedRoute>
          }
        />

        <Route path="/donate" element={<Donate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
