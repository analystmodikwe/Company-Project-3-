// test-request.ts
// Reusable test script for hitting protected routes without fighting
// PowerShell's curl quoting. Edit the values below and rerun as needed.

import "dotenv/config";

const TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImY5YjkwMDRiLTM0YzktNDU2Ny1iMjBmLWFhNjRkZmQ0ZTcwOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Nsd3B4em1haW9zem93YmNyaWFpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0NTRiY2Q4ZC1mYTcxLTQ4MDktOWU3OC1hNmU1YTk0NjJkN2EiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg5MzM2ODkzLCJpYXQiOjE3ODkzMzMyOTMsImVtYWlsIjoiZ2h0NTVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3ODkzMzMyOTN9XSwic2Vzc2lvbl9pZCI6ImQ5Yjg1YjhjLWMwNDYtNDJiNy04NzllLTY5OTQ4ZDc0ZmE3NyIsImlzX2Fub255bW91cyI6ZmFsc2V9.i5CeyA-lc3Ueypn7DpcxbYqLhJMjcOvrUULmW6r37XiNUcvCKwzC7uX9ioXCtUQjoCmdrsSWFWn2UcOmLz4g0w";

async function main() {
  const res = await fetch("http://localhost:4000/api/bookings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resource_id: "07363cf9-8926-40c1-b52d-200c2b289cc7", // Gym Floor, from your earlier response
      start_time: "2026-09-20T10:30:00Z", // overlaps the previous booking
      end_time: "2026-09-20T11:00:00Z",
    }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Body:", data);
}

main();