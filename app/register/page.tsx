import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "註冊" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader emoji="✏️" title="註冊">
        <p>建立 NestStep 帳號，之後每次整理的結果都能留著、對得上是誰。</p>
      </PageHeader>

      <RegisterForm />
    </div>
  );
}
