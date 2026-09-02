import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { RepairEventModel } from "@/app/models/RepairEvent";
import { getSessionUser } from "@/app/lib/auth";

export const runtime = "nodejs";

/** 目前登入使用者自己的維修事件列表（房子病歷）*/
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  try {
    await connectMongo();
    const docs = await RepairEventModel.find({ userId: session.id })
      .select("category status photoUrl createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: docs.map((doc) => ({
        id: String(doc._id),
        category: doc.category ?? "",
        status: doc.status ?? "open",
        hasPhoto: Boolean(doc.photoUrl),
        createdAt: doc.createdAt,
      })),
    });
  } catch (err) {
    console.error("[repairs GET]", err);
    return NextResponse.json(
      { error: "讀取事件紀錄失敗" },
      { status: 500 },
    );
  }
}
