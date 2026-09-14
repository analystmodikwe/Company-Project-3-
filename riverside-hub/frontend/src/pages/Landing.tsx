// src/pages/Landing.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4 flex justify-between items-center">
        <span className="font-semibold text-gray-900">
          Riverside Community Hub
        </span>
        {!loading &&
          (user ? (
            <Link to="/dashboard" className="text-sm font-medium text-gray-900">
              My Bookings
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-medium text-gray-900">
              Log in
            </Link>
          ))}
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          A community centre, one place to belong.
        </h1>
        <p className="mt-4 text-gray-600">
          Book facilities, join programmes, and support the Winter Food Parcels
          drive.
        </p>

        <Link
          to="/catalogue"
          className="inline-block mt-6 bg-gray-900 text-white rounded-md px-5 py-2.5 text-sm font-medium"
        >
          Browse facilities
        </Link>

        <Link
          to="/donate"
          className="inline-block mt-6 ml-3 border border-gray-900 text-gray-900 rounded-md px-5 py-2.5 text-sm font-medium"
        >
          Support the food drive
        </Link>
      </main>
    </div>
  );
}
