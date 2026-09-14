// src/pages/Catalogue.tsx
// Public resource catalogue — rooms and equipment, pulled from the
// backend's already-proven GET /api/resources route.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";

interface Resource {
  id: string;
  name: string;
  type: "room" | "equipment";
  capacity: number | null;
  description: string;
}

export default function Catalogue() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/resources")
      .then((data) => setResources(data.resources))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4">
        <Link to="/" className="font-semibold text-gray-900">
          Riverside Community Hub
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Facilities & Equipment
        </h1>

        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((r) => (
            <Link key={r.id} to={`/book/${r.id}`} className="block">
              <div className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold text-gray-900">{r.name}</h2>
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    {r.type}
                  </span>
                </div>
                {r.capacity && (
                  <p className="text-sm text-gray-500 mt-1">
                    Capacity: {r.capacity}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">{r.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
