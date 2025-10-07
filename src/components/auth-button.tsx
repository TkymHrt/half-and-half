import { UserCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { Button } from "./ui/button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-4">
        <UserCircle className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 truncate text-sm">{user.email}</span>
      </div>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex w-full flex-col gap-3">
      <Button
        asChild
        className="h-14 w-full font-semibold text-base shadow-lg shadow-orange-500/20"
        size="lg"
      >
        <Link href="/auth/login">ログイン</Link>
      </Button>
      <Button
        asChild
        className="h-14 w-full text-base"
        size="lg"
        variant="outline"
      >
        <Link href="/auth/sign-up">サインアップ</Link>
      </Button>
    </div>
  );
}
