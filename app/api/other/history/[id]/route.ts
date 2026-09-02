import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectMongo } from "@/app/lib/mongoose";
import { LifeQueryModel } from "@/app/models/LifeQuery";
import { deleteBlobFile } from "@/app/lib/blob";
import { getSessionUser } from "@/app/lib/auth";

export const runtime = "nodejs";

/** 單筆生活求助紀錄詳情（只能看自己的） */
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
    const doc = await LifeQueryModel.findById(id).lean();

    if (!doc || String(doc.userId) !== session.id) {
      return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(doc._id),
      description: doc.description,
      quickPrompt: doc.quickPrompt ?? "",
      imageUrl: doc.imageUrl ?? "",
      imagePathname: doc.imagePathname ?? "",
      detectedCategory: doc.detectedCategory ?? "",
      aiGuidance: doc.aiGuidance,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("[other/history/:id GET]", err);
    return NextResponse.json({ error: "讀取紀錄失敗" }, { status: 500 });
  }
}

/** 刪除單筆紀錄（只能刪自己的；有圖片時一併刪除 Blob） */
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
    const doc = await LifeQueryModel.findById(id).lean();

    if (!doc || String(doc.userId) !== session.id) {
      return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
    }

    // 先刪 Blob（若有），成功後才刪 DB —— 避免孤兒檔或不同步
    if (doc.imageUrl) {
      try {
        await deleteBlobFile(doc.imageUrl);
      } catch (err) {
        console.error(
          "[other/history/:id DELETE] Blob 刪除失敗，未刪除 DB 紀錄：",
          err,
        );
        return NextResponse.json(
          { error: "圖片刪除失敗，這次沒有刪除紀錄，請稍後再試" },
          { status: 502 },
        );
      }
    }

    await LifeQueryModel.deleteOne({ _id: id, userId: session.id });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[other/history/:id DELETE]", err);
    return NextResponse.json({ error: "刪除失敗，請稍後再試" }, { status: 500 });
  }
}
