"use strict";
// throwaway scriptt to test in as a test user and print their access token,
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
require("dotenv/config");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function main() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: "ght55@gmail.com",
        password: "3432345",
    });
    if (error) {
        console.error("Login failed:", error.message);
        return;
    }
    console.log("Access token:\n", data.session?.access_token);
}
main();
//# sourceMappingURL=get-token.js.map