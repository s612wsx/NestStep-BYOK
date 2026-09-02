import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { LifeQueryModel } from "@/app/models/LifeQuery";
import { navigateLifeQuery } from "@/app/lib/life-navigate";
import { apiKeyFromRequest, MissingApiKeyError } from "@/app/lib/openai-client";
import { getSessionUser } from "@/app/lib/auth";
import { QUICK_PROMPTS } from "@/app/lib/life-query-types";
import {
  assertRepairImage,
  uploadOtherImage,
  deleteBlobFile,
  UploadError,
  type UploadedFile,
} from "@/app/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_DESCRIPTION_LENGTH = 5;

async function rollbackBlob(uploaded: UploadedFile | null) {
  if (!uploaded) return;
  try {
    await deleteBlobFile(uploaded.url);
    console.warn("[other/analyze] rollback：已刪除圖片", uploaded.pathname);
  } catch (err) {
    console.error(
      "[other/analyze] rollback 失敗（圖片未刪除）：",
      uploaded.pathname,
      err,
    );
  }
}

export async function POST(request: Request) {
  // 登入牆：導航結果會存進使用者帳號，未登入不給用
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

  const description = (form.get("description") as string | null)?.trim() || "";
  const quickPromptRaw =
    (form.get("quickPrompt") as string | null)?.trim() || "";
  const quickPrompt = (QUICK_PROMPTS as readonly string[]).includes(
    quickPromptRaw,
  )
    ? quickPromptRaw
    : "";
  const imageEntry = form.get("image");
  const image =
    imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: "請多描述一點你遇到的問題" },
      { status: 400 },
    );
  }
  if (image) {
    try {
      assertRepairImage(image);
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

  // 1. 有圖片 → 先存到 Vercel Blob（AI 直接讀這個 URL）
  let uploaded: UploadedFile | null = null;
  if (image) {
    try {
      uploaded = await uploadOtherImage(image);
    } catch (err) {
      console.error("[other/analyze] 圖片上傳失敗：", err);
      const message = err instanceof Error ? err.message : "圖片上傳失敗";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // 2. AI 生活問題導航
  let result;
  try {
    result = await navigateLifeQuery(apiKey, {
      description,
      quickPrompt: quickPrompt || undefined,
      imageUrl: uploaded?.url ?? null,
    });
  } catch (err) {
    await rollbackBlob(uploaded);
    console.error("[other/analyze] AI 導航失敗：", err);
    const message = err instanceof Error ? err.message : "AI 導航失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 3. 建立一筆生活求助紀錄
  let doc;
  try {
    await connectMongo();
    doc = await LifeQueryModel.create({
      userId: session.id,
      description,
      quickPrompt,
      imageUrl: uploaded?.url ?? "",
      imagePathname: uploaded?.pathname ?? "",
      detectedCategory: result.detectedCategory,
      aiGuidance: result.guidance,
    });
  } catch (err) {
    await rollbackBlob(uploaded);
    console.error("[other/analyze] DB 寫入失敗，已 rollback Blob：", err);
    return NextResponse.json(
      { error: "資料庫寫入失敗，已取消這次送出" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: String(doc._id),
      description: doc.description,
      quickPrompt: doc.quickPrompt,
      imageUrl: doc.imageUrl,
      imagePathname: doc.imagePathname,
      detectedCategory: doc.detectedCategory,
      aiGuidance: doc.aiGuidance,
      createdAt: doc.createdAt,
    },
    { status: 201 },
  );
}
