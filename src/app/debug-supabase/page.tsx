"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugSupabasePage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testSupabase = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createClient();
      
      // 1. 接続テスト
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY?.substring(0, 20) + "...");

      // 2. 認証状態確認
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("Auth User:", user);
      console.log("Auth Error:", authError);

      // 3. セッション確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Session:", session);
      console.log("Session Error:", sessionError);

      // 4. データベースアクセステスト
      const { data, error: dbError } = await supabase
        .from("tasks")
        .select("*")
        .limit(1);

      console.log("DB Data:", data);
      console.log("DB Error:", dbError);

      setResult({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY?.substring(0, 20) + "...",
        user,
        authError,
        session,
        sessionError,
        data,
        dbError
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Test Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testSupabase();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug</h1>
      
      <button 
        onClick={testSupabase}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Supabase Connection"}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Results:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}