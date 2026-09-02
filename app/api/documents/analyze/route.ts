import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { DocumentAnalysisModel } from "@/app/models/DocumentAnalysis";
import { analyzeDocument } from "@/app/lib/document-analyze";
import { apiKeyFromRequest, MissingApiKeyError } from "@/app/lib/openai-client";
import { getSessionUser } from "@/app/lib/auth";
import {
  assertPdfFile,
  uploadDocumentFile,
  deleteBlobFile,
  UploadError,
  type UploadedFile,
} from "@/app/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_CONTENT_LENGTH = 10;
// 未登入時仍可分析，只是不會出現在任何人的歷史紀錄
const ANONYMOUS_USER_ID = "anonymous";

/** rollback：把已上傳的 PDF 刪掉，避免孤兒檔（失敗只記 log）*/
async function rollbackBlob(uploaded: UploadedFile | null) {
  if (!uploaded) return;
  try {
    await deleteBlobFile(uploaded.url);
    console.warn("[documents/analyze] rollback：已刪除 Blob", uploaded.pathname);
  } catch (err) {
    console.error(
      "[documents/analyze] rollback 失敗（Blob 未刪除）：",
      uploaded.pathname,
      err,
    );
  }
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

  const userTitle = (form.get("title") as string | null)?.trim() || "";
  const content = (form.get("content") as string | null)?.trim() || "";
  const fileEntry = form.get("file");
  const file =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

  if (!file && content.length < MIN_CONTENT_LENGTH) {
    return NextResponse.json(
      {
        error: `請貼上文件內容（至少 ${MIN_CONTENT_LENGTH} 個字），或上傳 PDF`,
      },
      { status: 400 },
    );
  }

  if (file) {
    try {
      assertPdfFile(file);
    } catch (err) {
      if (err instanceof UploadError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  }

  const inputType = file ? "pdf" : "text";

  // BYOK：使用者自己的 OpenAI 金鑰（不記錄、不儲存）。在上傳 Blob 前先擋，避免孤兒檔。
  let apiKey: string;
  try {
    apiKey = apiKeyFromRequest(request);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // 1. 有 PDF → 先存到 Vercel Blob
  let uploaded: UploadedFile | null = null;
  if (file) {
    try {
      uploaded = await uploadDocumentFile(file);
    } catch (err) {
      console.error("[documents/analyze] Blob 上傳失敗：", err);
      const message = err instanceof Error ? err.message : "PDF 上傳失敗";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // 2. 交給 OpenAI 分析
  let analysis;
  try {
    analysis = await analyzeDocument(apiKey, {
      content: content || undefined,
      fileUrl: uploaded?.url ?? null,
    });
  } catch (err) {
    await rollbackBlob(uploaded);
    console.error("[documents/analyze] AI 分析失敗：", err);
    const message = err instanceof Error ? err.message : "AI 分析失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const title =
    userTitle ||
    analysis.aiTitle ||
    `未命名文件（${new Date().toLocaleDateString("zh-TW")}）`;

  // 3. 原始內容 + Blob 資訊 + AI 結果 + 使用者資訊 一起寫進 MongoDB
  const session = await getSessionUser();
  let doc;
  try {
    await connectMongo();
    doc = await DocumentAnalysisModel.create({
      userId: session?.id ?? ANONYMOUS_USER_ID,
      title,
      documentType: analysis.documentType,
      inputType,
      originalText: content,
      fileUrl: uploaded?.url ?? "",
      fileName: uploaded?.fileName ?? "",
      analysisResult: analysis.result,
    });
  } catch (err) {
    // DB 寫入失敗，而前面已有 Blob → rollback 刪除
    await rollbackBlob(uploaded);
    console.error("[documents/analyze] DB 寫入失敗，已 rollback Blob：", err);
    return NextResponse.json(
      { error: "資料庫寫入失敗，已取消這次送出" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: String(doc._id),
      title: doc.title,
      documentType: doc.documentType,
      inputType: doc.inputType,
      file: uploaded ? { url: uploaded.url, fileName: uploaded.fileName } : null,
      analysisResult: doc.analysisResult,
      createdAt: doc.createdAt,
    },
    { status: 201 },
  );
}
