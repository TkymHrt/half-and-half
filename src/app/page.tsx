import Image from "next/image";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted/20 px-4">
      {/* Theme Switcher - Floating */}
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full shadow-lg shadow-orange-500/20">
            <Image alt="Half & Half" height={96} src="/icon.svg" width={96} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text font-bold text-4xl text-transparent">
              Half & Half
            </h1>
            <p className="text-center text-muted-foreground text-sm">
              文化祭運営ダッシュボード
            </p>
          </div>
        </div>

        <div className="w-full space-y-4">
          {hasEnvVars ? <AuthButton /> : <EnvVarWarning />}
        </div>

        <p className="text-center text-muted-foreground text-xs">
          実行委員会専用アプリケーション
        </p>
      </div>
    </main>
  );
}
