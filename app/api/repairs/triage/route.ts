import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { RepairEventModel } from "@/app/models/RepairEvent";
import { triageRepair } from "@/app/lib/repairs-triage";
import { apiKeyFromRequest, MissingApiKeyError } from "@/app/lib/openai-client";
import { getSessionUser } from "@/app/lib/auth";
import {
  assertRepairImage,
  uploadRepairPhoto,
  deleteBlobFile,
  UploadError,
  type UploadedFile,
} from "@/app/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

/** rollback：把剛上傳的照片刪掉，避免孤兒檔（失敗只記 log）*/
async function rollbackPhoto(uploaded: UploadedFile | null) {
  if (!uploaded) return;
  try {
    await deleteBlobFile(uploaded.url);
    console.warn("[repairs/triage] rollback：已刪除照片", uploaded.pathname);
  } catch (err) {
    console.error(
      "[repairs/triage] rollback 失敗（照片未刪除）：",
      uploaded.pathname,
      err,
    );
  }
}

export async function POST(request: Request) {
  // 登入牆：分診結果會存進使用者帳號，未登入不給用
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

  const category = (form.get("category") as string | null)?.trim() || "";
  const description = (form.get("description") as string | null)?.trim() || "";
  const imageEntry = form.get("image");
  const image =
    imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

  if (!category) {
    return NextResponse.json({ error: "請先選擇問題類型" }, { status: 400 });
  }
  if (!description && !image) {
    return NextResponse.json(
      { error: "請簡單描述狀況，或上傳一張照片" },
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

  // 1. 有照片 → 先存到 Vercel Blob（AI 直接讀這個 URL）
  let uploaded: UploadedFile | null = null;
  if (image) {
    try {
      uploaded = await uploadRepairPhoto(image);
    } catch (err) {
      console.error("[repairs/triage] 照片上傳失敗：", err);
      const message = err instanceof Error ? err.message : "照片上傳失敗";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // 2. AI 初步分診
  let triage;
  try {
    triage = await triageRepair(apiKey, {
      category,
      description: description || undefined,
      imageUrl: uploaded?.url ?? null,
    });
  } catch (err) {
    await rollbackPhoto(uploaded);
    console.error("[repairs/triage] AI 分診失敗：", err);
    const message = err instanceof Error ? err.message : "AI 分診失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 3. 分診成功 → 自動建立一筆事件紀錄（不需要使用者按儲存）
  const photoUrl = uploaded?.url ?? "";
  let saved = false;
  let id: string | null = null;
  let createdAt: string | null = null;
  try {
    await connectMongo();
    const doc = await RepairEventModel.create({
      userId: session.id,
      category,
      description,
      aiTriageResult: triage,
      photoUrl,
      status: "open",
    });
    saved = true;
    id = String(doc._id);
    createdAt = doc.createdAt ? new Date(doc.createdAt).toISOString() : null;
  } catch (err) {
    // 事件沒存成功 → rollback 照片，但分診結果仍回傳給使用者
    await rollbackPhoto(uploaded);
    console.error("[repairs/triage] 事件寫入失敗（分診結果仍回傳）：", err);
  }

  return NextResponse.json(
    {
      id,
      saved,
      category,
      status: "open",
      triage,
      photoUrl: saved ? photoUrl : "",
      createdAt,
    },
    { status: saved ? 201 : 200 },
  );
}
