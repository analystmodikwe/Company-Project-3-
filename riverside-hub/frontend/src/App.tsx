// src/App.tsx
import Auth from "./pages/Auth";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (user) {
    return <p>Logged in as {user.email}</p>;
  }

  return <Auth />;
}

export default App;