import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectMongo } from "@/app/lib/mongoose";
import { BillAnalysisModel } from "@/app/models/BillAnalysis";
import { deleteBlobFile } from "@/app/lib/blob";
import { getSessionUser } from "@/app/lib/auth";

export const runtime = "nodejs";

function ymd(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** 單筆帳單分析紀錄詳情（只能看自己的） */
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
    const doc = await BillAnalysisModel.findById(id).lean();

    if (!doc || String(doc.userId) !== session.id) {
      return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(doc._id),
      title: doc.title,
      billType: doc.billType,
      inputType: doc.inputType,
      originalText: doc.originalText ?? "",
      fileUrl: doc.fileUrl ?? "",
      fileName: doc.fileName ?? "",
      amount: typeof doc.amount === "number" ? doc.amount : null,
      billingStartDate: ymd(doc.billingStartDate),
      billingEndDate: ymd(doc.billingEndDate),
      analysisResult: doc.analysisResult,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("[bills/history/:id GET]", err);
    return NextResponse.json({ error: "讀取紀錄失敗" }, { status: 500 });
  }
}

/** 刪除單筆紀錄（只能刪自己的；有 PDF 時一併刪除 Blob） */
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
    const doc = await BillAnalysisModel.findById(id).lean();

    if (!doc || String(doc.userId) !== session.id) {
      return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
    }

    // 先刪 Blob（若有），成功後才刪 DB —— 避免孤兒檔或不同步
    if (doc.fileUrl) {
      try {
        await deleteBlobFile(doc.fileUrl);
      } catch (err) {
        console.error(
          "[bills/history/:id DELETE] Blob 刪除失敗，未刪除 DB 紀錄：",
          err,
        );
        return NextResponse.json(
          { error: "檔案刪除失敗，這次沒有刪除紀錄，請稍後再試" },
          { status: 502 },
        );
      }
    }

    await BillAnalysisModel.deleteOne({ _id: id, userId: session.id });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[bills/history/:id DELETE]", err);
    return NextResponse.json({ error: "刪除失敗，請稍後再試" }, { status: 500 });
  }
}
