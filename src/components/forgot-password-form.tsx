"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error: resetPasswordError } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
      if (resetPasswordError) {
        throw resetPasswordError;
      }
      setSuccess(true);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error ? caughtError.message : "An error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">メールを確認してください</CardTitle>
            <CardDescription>
              パスワードリセット手順を送信しました
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              メールアドレスとパスワードで登録されている場合、パスワードをリセットするためのメールが届きます。
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">パスワードをリセット</CardTitle>
            <CardDescription>
              メールアドレスを入力すると、パスワードをリセットするためのリンクをお送りします
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example.nutfes@gmail.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button className="w-full" disabled={isLoading} type="submit">
                  {isLoading ? "送信中..." : "リセットメールを送信"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                すでにアカウントをお持ちですか？{" "}
                <Link
                  className="underline underline-offset-4"
                  href="/auth/login"
                >
                  ログイン
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
