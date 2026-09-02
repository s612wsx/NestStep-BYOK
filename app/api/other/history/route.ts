import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { LifeQueryModel } from "@/app/models/LifeQuery";
import { getSessionUser } from "@/app/lib/auth";

export const runtime = "nodejs";

/** 目前登入使用者自己的生活求助紀錄列表 */
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  try {
    await connectMongo();
    const docs = await LifeQueryModel.find({ userId: session.id })
      .select("description detectedCategory imageUrl createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: docs.map((doc) => ({
        id: String(doc._id),
        description:
          doc.description.length > 60
            ? `${doc.description.slice(0, 60)}…`
            : doc.description,
        detectedCategory: doc.detectedCategory ?? "",
        hasImage: Boolean(doc.imageUrl),
        createdAt: doc.createdAt,
      })),
    });
  } catch (err) {
    console.error("[other/history]", err);
    return NextResponse.json({ error: "讀取歷史紀錄失敗" }, { status: 500 });
  }
}
