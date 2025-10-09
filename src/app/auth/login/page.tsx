import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 p-6 md:p-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-1/4 -right-1/4 absolute h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="-bottom-1/4 -left-1/4 absolute h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
