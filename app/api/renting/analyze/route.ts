import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { RentingAnalysisModel } from "@/app/models/RentingAnalysis";
import { analyzeRentingListing } from "@/app/lib/openai";
import { apiKeyFromRequest, MissingApiKeyError } from "@/app/lib/openai-client";
import { getSessionUser } from "@/app/lib/auth";
import {
  assertUploadable,
  uploadRentingFile,
  deleteBlobFile,
  UploadError,
  type UploadedFile,
} from "@/app/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_CONTENT_LENGTH = 10;

/** rollback：把已上傳的 Blob 刪掉，避免孤兒檔（失敗只記 log，不影響回應） */
async function rollbackBlob(uploaded: UploadedFile | null) {
  if (!uploaded) return;
  try {
    await deleteBlobFile(uploaded.url);
    console.warn("[renting/analyze] rollback：已刪除 Blob", uploaded.pathname);
  } catch (err) {
    console.error(
      "[renting/analyze] rollback 失敗（Blob 未刪除）：",
      uploaded.pathname,
      err,
    );
  }
}

export async function POST(request: Request) {
  // 登入牆：分析結果會存進使用者帳號，未登入不給用
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: "請先登入或註冊，才能使用這項功能" },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "請以 multipart/form-data 傳送資料" },
      { status: 400 },
    );
  }

  const content = (form.get("content") as string | null)?.trim() || "";
  const title = (form.get("title") as string | null)?.trim() || "";
  const sourceUrl = (form.get("sourceUrl") as string | null)?.trim() || "";
  const fileEntry = form.get("file");
  const file =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

  if (!file && content.length < MIN_CONTENT_LENGTH) {
    return NextResponse.json(
      {
        error: `請貼上要分析的文字內容（至少 ${MIN_CONTENT_LENGTH} 個字），或上傳 PDF / 圖片`,
      },
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

  const resolvedTitle =
    title || `未命名物件（${new Date().toLocaleDateString("zh-TW")}）`;
  const inputType = file ? "file" : "text";
  const originalTextParts: string[] = content ? [content] : [];
  if (sourceUrl) originalTextParts.push(`來源網址：${sourceUrl}`);
  const originalText = originalTextParts.join("\n\n");

  // 1. 有檔案 → 先上傳到 Vercel Blob
  let uploaded: UploadedFile | null = null;
  if (file) {
    try {
      uploaded = await uploadRentingFile(file);
    } catch (err) {
      console.error("[renting/analyze] Blob 上傳失敗：", err);
      const message = err instanceof Error ? err.message : "檔案上傳失敗";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // 2. 執行 AI 分析
  let analysisResult;
  try {
    analysisResult = await analyzeRentingListing(apiKey, {
      content: content || undefined,
      title: resolvedTitle,
      sourceUrl: sourceUrl || undefined,
      file: uploaded
        ? {
            url: uploaded.url,
            fileName: uploaded.fileName,
            contentType: uploaded.contentType,
          }
        : null,
    });
  } catch (err) {
    await rollbackBlob(uploaded);
    console.error("[renting/analyze] AI 分析失敗：", err);
    const message = err instanceof Error ? err.message : "AI 分析失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 3. 原始內容 + Blob 檔案資訊 + AI 結果 + 使用者資訊 一起寫進 MongoDB
  let doc;
  try {
    await connectMongo();
    doc = await RentingAnalysisModel.create({
      userId: session.id,
      title: resolvedTitle,
      inputType,
      originalText,
      fileUrl: uploaded?.url ?? "",
      fileName: uploaded?.fileName ?? "",
      analysisResult,
    });
  } catch (err) {
    // DB 寫入失敗，而前面已有 Blob 檔案 → rollback 刪除
    await rollbackBlob(uploaded);
    console.error("[renting/analyze] DB 寫入失敗，已 rollback Blob：", err);
    return NextResponse.json(
      { error: "資料庫寫入失敗，已取消這次送出" },
      { status: 500 },
    );
  }

  // 4. 回傳完整分析結果
  return NextResponse.json(
    {
      id: String(doc._id),
      title: doc.title,
      inputType: doc.inputType,
      file: uploaded,
      analysisResult: doc.analysisResult,
      createdAt: doc.createdAt,
    },
    { status: 201 },
  );
}
