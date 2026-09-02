import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { RentingAnalysisModel } from "@/app/models/RentingAnalysis";
import { getSessionUser } from "@/app/lib/auth";

export const runtime = "nodejs";

/** 目前登入使用者自己的租屋分析紀錄列表 */
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  try {
    await connectMongo();
    const docs = await RentingAnalysisModel.find({ userId: session.id })
      .select("title inputType createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: docs.map((doc) => ({
        id: String(doc._id),
        title: doc.title,
        inputType: doc.inputType,
        createdAt: doc.createdAt,
      })),
    });
  } catch (err) {
    console.error("[renting/history]", err);
    return NextResponse.json(
      { error: "讀取歷史紀錄失敗" },
      { status: 500 },
    );
  }
}
