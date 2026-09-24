import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { PasswordInput } from "@/components/PasswordInput";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const target = (formData.get("callbackUrl") as string) || "/documents";

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: target,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(target)}`);
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1420]">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-lg"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">ระบบจัดเก็บเอกสารภายในองค์กร</h1>
          <p className="mt-1 text-sm text-gray-500">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            อีเมลหรือรหัสผ่านไม่ถูกต้อง
          </p>
        )}

        <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/documents"} />

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="user@company.local"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            รหัสผ่าน
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  );
}
