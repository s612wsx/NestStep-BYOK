import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "登入" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader emoji="🔑" title="登入">
        <p>用 email 或使用者 ID，加上密碼登入。</p>
      </PageHeader>

      <LoginForm />
    </div>
  );
}
