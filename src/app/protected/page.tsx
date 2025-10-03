import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 font-bold text-2xl">Your user details</h2>
        <pre className="max-h-96 overflow-auto rounded border p-3 font-mono text-xs">
          {JSON.stringify(data.claims, null, 2)}
        </pre>
      </div>
    </div>
  );
}
