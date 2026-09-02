import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { BillAnalysisModel } from "@/app/models/BillAnalysis";
import { getSessionUser } from "@/app/lib/auth";

export const runtime = "nodejs";

/** 目前登入使用者自己的帳單分析紀錄列表 */
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  try {
    await connectMongo();
    const docs = await BillAnalysisModel.find({ userId: session.id })
      .select("title billType inputType amount createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: docs.map((doc) => ({
        id: String(doc._id),
        title: doc.title,
        billType: doc.billType,
        inputType: doc.inputType,
        amount: typeof doc.amount === "number" ? doc.amount : null,
        createdAt: doc.createdAt,
      })),
    });
  } catch (err) {
    console.error("[bills/history]", err);
    return NextResponse.json({ error: "讀取歷史紀錄失敗" }, { status: 500 });
  }
}
