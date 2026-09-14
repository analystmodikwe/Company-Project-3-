
// Member's own bookings, using the already-proven GET /api/bookings/me
// and PATCH /api/bookings/:id/cancel routes.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

interface Booking {
  id: string;
  resource_id: string;
  resource_name: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
}

const statusStyles: Record<Booking["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function loadBookings() {
    setLoading(true);
    apiFetch("/bookings/me")
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await apiFetch(`/bookings/${id}/cancel`, { method: "PATCH" });
      loadBookings(); // refresh the list so the new status shows immediately
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4 flex justify-between items-center">
        <Link to="/" className="font-semibold text-gray-900">
          Riverside Community Hub
        </Link>
        <span className="text-sm text-gray-600">{user?.email}</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <Link
            to="/catalogue"
            className="text-sm font-medium bg-gray-900 text-white rounded-md px-4 py-2"
          >
            Book a facility
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {!loading && bookings.length === 0 && (
          <p className="text-gray-500">You don't have any bookings yet.</p>
        )}

        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-900">{b.resource_name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(b.start_time).toLocaleString()} –{" "}
                  {new Date(b.end_time).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[b.status]}`}
                >
                  {b.status}
                </span>
                {(b.status === "pending" || b.status === "approved") && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancellingId === b.id}
                    className="text-sm text-red-600 font-medium disabled:opacity-50"
                  >
                    {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}