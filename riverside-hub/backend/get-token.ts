// throwaway scriptt to test in as a test user and print their access token,

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! 
);

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "your-test-user-email@example.com",
    password: "your-test-user-password",
  });

  if (error) {
    console.error("Login failed:", error.message);
    return;
  }

  console.log("Access token:\n", data.session?.access_token);
}

main();