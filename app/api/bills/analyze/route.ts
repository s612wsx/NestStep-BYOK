import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { BillAnalysisModel } from "@/app/models/BillAnalysis";
import { analyzeBill } from "@/app/lib/bill-analyze";
import { getSessionUser } from "@/app/lib/auth";
import { BILL_TYPES } from "@/app/lib/bill-analysis-types";
import {
  assertUploadable,
  uploadBillFile,
  deleteBlobFile,
  UploadError,
  type UploadedFile,
} from "@/app/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_CONTENT_LENGTH = 10;
// 未登入時仍可分析，只是不會出現在任何人的歷史紀錄
const ANONYMOUS_USER_ID = "anonymous";

async function rollbackBlob(uploaded: UploadedFile | null) {
  if (!uploaded) return;
  try {
    await deleteBlobFile(uploaded.url);
    console.warn("[bills/analyze] rollback：已刪除 Blob", uploaded.pathname);
  } catch (err) {
    console.error(
      "[bills/analyze] rollback 失敗（Blob 未刪除）：",
      uploaded.pathname,
      err,
    );
  }
}

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "請以 multipart/form-data 傳送資料" },
      { status: 400 },
    );
  }

  const billType = (form.get("billType") as string | null)?.trim() || "";
  const userTitle = (form.get("title") as string | null)?.trim() || "";
  const content = (form.get("content") as string | null)?.trim() || "";
  const fileEntry = form.get("file");
  const file =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

  if (!(BILL_TYPES as readonly string[]).includes(billType)) {
    return NextResponse.json({ error: "請先選擇帳單類型" }, { status: 400 });
  }
  if (!file && content.length < MIN_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `請貼上帳單內容（至少 ${MIN_CONTENT_LENGTH} 個字），或上傳 PDF` },
      { status: 400 },
    );
  }
  if (file) {
    try {
      assertUploadable(file);
    } catch (err) {
      if (err instanceof UploadError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  }

  const isImage = Boolean(file && (file.type || "").startsWith("image/"));
  const inputType = file ? (isImage ? "image" : "pdf") : "text";

  // 1. 有 PDF → 先存到 Vercel Blob
  let uploaded: UploadedFile | null = null;
  if (file) {
    try {
      uploaded = await uploadBillFile(file);
    } catch (err) {
      console.error("[bills/analyze] Blob 上傳失敗：", err);
      const message = err instanceof Error ? err.message : "PDF 上傳失敗";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // 2. 交給 OpenAI 分析
  let analysis;
  try {
    analysis = await analyzeBill({
      billType,
      content: content || undefined,
      file: uploaded ? { url: uploaded.url, isImage } : null,
    });
  } catch (err) {
    await rollbackBlob(uploaded);
    console.error("[bills/analyze] AI 分析失敗：", err);
    const message = err instanceof Error ? err.message : "AI 分析失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const title =
    userTitle ||
    analysis.aiTitle ||
    `${billType}帳單（${new Date().toLocaleDateString("zh-TW")}）`;
  const billingStartDate = toDate(analysis.billingStartDate);
  const billingEndDate = toDate(analysis.billingEndDate);

  // 3. 原始內容 + Blob 資訊 + AI 結果 + 使用者資訊 一起寫進 MongoDB
  const session = await getSessionUser();
  let doc;
  try {
    await connectMongo();
    doc = await BillAnalysisModel.create({
      userId: session?.id ?? ANONYMOUS_USER_ID,
      title,
      billType,
      inputType,
      originalText: content,
      fileUrl: uploaded?.url ?? "",
      fileName: uploaded?.fileName ?? "",
      amount: analysis.amount,
      billingStartDate,
      billingEndDate,
      analysisResult: analysis.result,
    });
  } catch (err) {
    await rollbackBlob(uploaded);
    console.error("[bills/analyze] DB 寫入失敗，已 rollback Blob：", err);
    return NextResponse.json(
      { error: "資料庫寫入失敗，已取消這次送出" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: String(doc._id),
      title: doc.title,
      billType: doc.billType,
      inputType: doc.inputType,
      file: uploaded ? { url: uploaded.url, fileName: uploaded.fileName } : null,
      amount: doc.amount ?? null,
      billingStartDate: billingStartDate
        ? billingStartDate.toISOString().slice(0, 10)
        : null,
      billingEndDate: billingEndDate
        ? billingEndDate.toISOString().slice(0, 10)
        : null,
      analysisResult: doc.analysisResult,
      createdAt: doc.createdAt,
    },
    { status: 201 },
  );
}
