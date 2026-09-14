
// Public donation page — works for both logged-in and anonymous visitors,
// since POST /api/donations accepts an optional auth token.

import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";

interface Campaign {
  id: string;
  title: string;
  goal_amount: string;
  current_amount: string;
}

export default function Donate() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadCampaign() {
    apiFetch("/campaigns/active")
      .then((data) => setCampaign(data.campaign))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCampaign();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Attach a token only if the visitor happens to be logged in —
      // donating works either way, this just attributes it when possible.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          campaign_id: campaign?.id,
          amount: parseFloat(amount),
          is_recurring_pledge: isRecurring,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Something went wrong");
      }

      setSuccess(true);
      loadCampaign(); // refresh the progress bar with the new total
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const percent = campaign
    ? Math.min(100, (parseFloat(campaign.current_amount) / parseFloat(campaign.goal_amount)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4">
        <Link to="/" className="font-semibold text-gray-900">
          Riverside Community Hub
        </Link>
      </nav>

      <main className="max-w-md mx-auto px-6 py-12">
        {loading && <p className="text-gray-500">Loading…</p>}

        {campaign && (
          <>
            <h1 className="text-xl font-bold text-gray-900">{campaign.title}</h1>

            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gray-900 h-3 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                R{parseFloat(campaign.current_amount).toLocaleString()} raised of R
                {parseFloat(campaign.goal_amount).toLocaleString()} goal
              </p>
            </div>

            {success ? (
              <p className="mt-8 text-green-700 bg-green-50 border border-green-200 rounded-md p-4 text-sm">
                Thank you for your donation!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (R)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  Adopt a food parcel (monthly pledge)
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? "Processing…" : "Donate"}
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}