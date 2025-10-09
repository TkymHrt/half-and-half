"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

const MIN_PASSWORD_LENGTH = 6;

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validatePasswords = () => {
    if (password !== repeatPassword) {
      setError("パスワードが一致しません");
      return false;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `パスワードは${MIN_PASSWORD_LENGTH}文字以上である必要があります`
      );
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!validatePasswords()) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (signUpError) {
        throw signUpError;
      }
      router.push("/auth/sign-up-success");
    } catch (caughtError: unknown) {
      let errorMessage =
        "アカウント作成に失敗しました。もう一度お試しください。";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message.includes("already registered")
          ? "このメールアドレスは既に登録されています"
          : caughtError.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="font-bold text-2xl">新規登録</CardTitle>
          <CardDescription>
            アカウントを作成して文化祭運営をスタートしましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example.nutfes@gmail.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  autoComplete="new-password"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上"
                  required
                  type="password"
                  value={password}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">パスワード（確認）</Label>
                <Input
                  autoComplete="new-password"
                  id="repeat-password"
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="もう一度入力してください"
                  required
                  type="password"
                  value={repeatPassword}
                />
              </div>

              {error ? (
                <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                  <p className="font-medium">登録エラー</p>
                  <p className="text-xs">{error}</p>
                </div>
              ) : null}

              <Button
                className="w-full"
                disabled={isLoading}
                size="lg"
                type="submit"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>読み込み中</title>
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        fill="currentColor"
                      />
                    </svg>
                    アカウント作成中...
                  </>
                ) : (
                  "アカウントを作成"
                )}
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                すでにアカウントをお持ちの場合は{" "}
              </span>
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                href="/auth/login"
              >
                ログイン
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-muted/50 p-4 text-xs">
        <p className="text-muted-foreground">
          登録後、メールアドレスに確認メールが送信されます。
        </p>
      </div>
    </div>
  );
}
