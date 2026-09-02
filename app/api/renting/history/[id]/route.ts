import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectMongo } from "@/app/lib/mongoose";
import { RentingAnalysisModel } from "@/app/models/RentingAnalysis";
import { deleteBlobFile } from "@/app/lib/blob";
import { getSessionUser } from "@/app/lib/auth";

export const runtime = "nodejs";

/** 單筆租屋分析紀錄詳情（只能看自己的） */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  }

  try {
    await connectMongo();
    const doc = await RentingAnalysisModel.findById(id).lean();

    // 不存在、或不是本人的紀錄，一律回 404（不洩漏是否存在）
    if (!doc || String(doc.userId) !== session.id) {
      return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(doc._id),
      title: doc.title,
      inputType: doc.inputType,
      originalText: doc.originalText,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      analysisResult: doc.analysisResult,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("[renting/history/:id]", err);
    return NextResponse.json({ error: "讀取紀錄失敗" }, { status: 500 });
  }
}

/** 刪除單筆紀錄（只能刪自己的；有 Blob 檔案時一併刪除） */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  }

  try {
    await connectMongo();
    const doc = await RentingAnalysisModel.findById(id).lean();

    // 確認屬於目前登入使用者，否則一律 404
    if (!doc || String(doc.userId) !== session.id) {
      return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
    }

    // 先刪 Blob（若有），成功後才刪 DB —— 避免留下孤兒檔或不同步
    if (doc.fileUrl) {
      try {
        await deleteBlobFile(doc.fileUrl);
      } catch (err) {
        console.error(
          "[renting/history/:id DELETE] Blob 刪除失敗，未刪除 DB 紀錄：",
          err,
        );
        return NextResponse.json(
          { error: "檔案刪除失敗，這次沒有刪除紀錄，請稍後再試" },
          { status: 502 },
        );
      }
    }

    await RentingAnalysisModel.deleteOne({ _id: id, userId: session.id });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[renting/history/:id DELETE]", err);
    return NextResponse.json({ error: "刪除失敗，請稍後再試" }, { status: 500 });
  }
}
