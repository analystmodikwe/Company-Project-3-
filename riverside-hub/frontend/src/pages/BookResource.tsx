
// Booking request form for a single resource, reached from the catalogue.
// Handles the 409 conflict response from the backend gracefully — that's
// the exclusion constraint we proved works, surfaced properly in the UI.

import { useState, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";

export default function BookResource() {
  const { resourceId } = useParams();
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          resource_id: resourceId,
          start_time: new Date(`${date}T${startTime}`).toISOString(),
          end_time: new Date(`${date}T${endTime}`).toISOString(),
        }),
      });
      navigate("/dashboard");
    } catch (err: any) {
      // apiFetch throws using the backend's error message directly, so a
      // 409 conflict shows exactly the friendly message the route sends:
      // "This resource is already booked for that time slot"
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4">
        <Link to="/catalogue" className="font-semibold text-gray-900">
          ← Back to catalogue
        </Link>
      </nav>

      <main className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Request a booking</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Request booking"}
          </button>
        </form>
      </main>
    </div>
  );
}