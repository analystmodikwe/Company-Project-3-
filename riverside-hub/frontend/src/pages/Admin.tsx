// src/pages/Admin.tsx
// Staff/admin dashboard: pending bookings, member directory, report summary.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";

interface PendingBooking {
  id: string;
  resource_name: string;
  member_name: string;
  start_time: string;
  end_time: string;
}

interface Member {
  id: string;
  full_name: string;
  role: string;
  membership_tier: string;
  joined_at: string;
}

interface Summary {
  bookings_this_month: number;
  total_donations: number;
  active_members: number;
}

type Tab = "bookings" | "members" | "reports";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("bookings");
  const [pending, setPending] = useState<PendingBooking[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  function loadPending() {
    setLoading(true);
    apiFetch("/bookings/staff/pending")
      .then((data) => setPending(data.bookings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function loadMembers() {
    setLoading(true);
    apiFetch("/staff/members")
      .then((data) => setMembers(data.members))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function loadSummary() {
    setLoading(true);
    apiFetch("/admin/reports/summary")
      .then((data) => setSummary(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setError(null);
    if (tab === "bookings") loadPending();
    if (tab === "members") loadMembers();
    if (tab === "reports") loadSummary();
  }, [tab]);

  async function handleDecision(id: string, action: "approve" | "reject") {
    setActingOnId(id);
    try {
      await apiFetch(`/bookings/staff/${id}/${action}`, { method: "PATCH" });
      loadPending();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActingOnId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4">
        <Link to="/" className="font-semibold text-gray-900">
          Riverside Community Hub — Admin
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex gap-2 mb-6 border-b">
          {(["bookings", "members", "reports"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 ${
                tab === t
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500"
              }`}
            >
              {t === "bookings" ? "Pending Bookings" : t}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {loading && <p className="text-gray-500">Loading…</p>}

        {!loading && tab === "bookings" && (
          <div className="space-y-3">
            {pending.length === 0 && <p className="text-gray-500">No pending bookings.</p>}
            {pending.map((b) => (
              <div key={b.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">
                    {b.resource_name} — {b.member_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(b.start_time).toLocaleString()} – {new Date(b.end_time).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision(b.id, "approve")}
                    disabled={actingOnId === b.id}
                    className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-1.5 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(b.id, "reject")}
                    disabled={actingOnId === b.id}
                    className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "members" && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Tier</th>
                  <th className="px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2">{m.full_name}</td>
                    <td className="px-4 py-2 capitalize">{m.role}</td>
                    <td className="px-4 py-2 capitalize">{m.membership_tier}</td>
                    <td className="px-4 py-2">{new Date(m.joined_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === "reports" && summary && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-5">
              <p className="text-sm text-gray-500">Bookings this month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.bookings_this_month}</p>
            </div>
            <div className="bg-white border rounded-lg p-5">
              <p className="text-sm text-gray-500">Total donations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">R{summary.total_donations.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-lg p-5">
              <p className="text-sm text-gray-500">Active members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.active_members}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}