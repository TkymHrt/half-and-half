import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function EnvVarWarning() {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20">
        <Image alt="Half & Half" height={16} src="/icon.svg" width={16} />
      </span>
      <AlertTitle className="text-amber-600 dark:text-amber-500">
        Supabaseの環境変数が見つかりません
      </AlertTitle>
      <AlertDescription className="text-amber-600/80 dark:text-amber-500/80">
        `.env.local` に Supabase
        のURLとAnonキーを設定してから再読み込みしてください。
      </AlertDescription>
    </Alert>
  );
}
