import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectMongo } from "@/app/lib/mongoose";
import { RepairEventModel } from "@/app/models/RepairEvent";
import { deleteBlobFile } from "@/app/lib/blob";
import { getSessionUser } from "@/app/lib/auth";
import type { RepairEventDetail } from "@/app/lib/repairs-types";

export const runtime = "nodejs";

const ALLOWED_STATUS = new Set(["open", "in_progress", "resolved"]);
const ALLOWED_HANDLED_BY = new Set([
  "",
  "self",
  "landlord",
  "management",
  "plumber",
  "appliance",
  "other",
]);

type LeanRepairEvent = {
  _id: unknown;
  category?: string;
  description?: string;
  status?: string;
  aiTriageResult?: unknown;
  photoUrl?: string;
  createdAt?: Date;
  resolution?: string;
  handledBy?: string;
  cost?: number | null;
  resolvedDate?: Date | null;
  note?: string;
};

function serialize(doc: LeanRepairEvent): RepairEventDetail {
  return {
    id: String(doc._id),
    category: doc.category ?? "",
    description: doc.description ?? "",
    status: (ALLOWED_STATUS.has(doc.status ?? "")
      ? doc.status
      : "open") as RepairEventDetail["status"],
    aiTriageResult:
      (doc.aiTriageResult as RepairEventDetail["aiTriageResult"]) ?? null,
    photoUrl: doc.photoUrl ?? "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    resolution: doc.resolution ?? "",
    handledBy: (doc.handledBy ?? "") as RepairEventDetail["handledBy"],
    cost: typeof doc.cost === "number" ? doc.cost : null,
    resolvedDate: doc.resolvedDate
      ? new Date(doc.resolvedDate).toISOString().slice(0, 10)
      : null,
    note: doc.note ?? "",
  };
}

/** 讀取單一事件（只能看自己的）*/
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
    return NextResponse.json({ error: "找不到這筆事件" }, { status: 404 });
  }

  try {
    await connectMongo();
    const doc = await RepairEventModel.findById(id).lean<LeanRepairEvent>();
    if (!doc || String((doc as { userId?: string }).userId) !== session.id) {
      return NextResponse.json({ error: "找不到這筆事件" }, { status: 404 });
    }
    return NextResponse.json(serialize(doc));
  } catch (err) {
    console.error("[repairs/:id GET]", err);
    return NextResponse.json({ error: "讀取事件失敗" }, { status: 500 });
  }
}

/** 更新後續處理資料（只能更新自己的）*/
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "找不到這筆事件" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請以 JSON 格式傳送資料" }, { status: 400 });
  }
  const input = (body ?? {}) as Record<string, unknown>;

  const updates: Record<string, unknown> = {};

  if ("status" in input) {
    if (typeof input.status !== "string" || !ALLOWED_STATUS.has(input.status)) {
      return NextResponse.json({ error: "狀態不正確" }, { status: 400 });
    }
    updates.status = input.status;
  }
  if ("handledBy" in input) {
    const v = typeof input.handledBy === "string" ? input.handledBy : "";
    if (!ALLOWED_HANDLED_BY.has(v)) {
      return NextResponse.json({ error: "處理人選項不正確" }, { status: 400 });
    }
    updates.handledBy = v;
  }
  if ("resolution" in input) {
    updates.resolution =
      typeof input.resolution === "string" ? input.resolution.trim() : "";
  }
  if ("note" in input) {
    updates.note = typeof input.note === "string" ? input.note.trim() : "";
  }
  if ("cost" in input) {
    if (input.cost === null || input.cost === "") {
      updates.cost = null;
    } else {
      const n = Number(input.cost);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json(
          { error: "費用需為 0 或正數，或留空" },
          { status: 400 },
        );
      }
      updates.cost = n;
    }
  }
  if ("resolvedDate" in input) {
    if (input.resolvedDate === null || input.resolvedDate === "") {
      updates.resolvedDate = null;
    } else if (typeof input.resolvedDate === "string") {
      const d = new Date(input.resolvedDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "處理日期不正確" }, { status: 400 });
      }
      updates.resolvedDate = d;
    } else {
      return NextResponse.json({ error: "處理日期不正確" }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  try {
    await connectMongo();
    // filter 帶 userId → 一次完成擁有者確認與更新，並回傳更新後內容
    const doc = await RepairEventModel.findOneAndUpdate(
      { _id: id, userId: session.id },
      { $set: updates },
      { new: true },
    ).lean<LeanRepairEvent>();

    if (!doc) {
      return NextResponse.json({ error: "找不到這筆事件" }, { status: 404 });
    }
    return NextResponse.json(serialize(doc));
  } catch (err) {
    console.error("[repairs/:id PATCH]", err);
    return NextResponse.json({ error: "更新失敗，請稍後再試" }, { status: 500 });
  }
}

/** 刪除事件（只能刪自己的；有照片時一併刪 Blob）*/
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
    return NextResponse.json({ error: "找不到這筆事件" }, { status: 404 });
  }

  try {
    await connectMongo();
    const doc = await RepairEventModel.findById(id).lean<LeanRepairEvent>();
    if (!doc || String((doc as { userId?: string }).userId) !== session.id) {
      return NextResponse.json({ error: "找不到這筆事件" }, { status: 404 });
    }

    // 先刪 Blob（若有），成功後才刪 DB —— 避免孤兒檔或不同步
    if (doc.photoUrl) {
      try {
        await deleteBlobFile(doc.photoUrl);
      } catch (err) {
        console.error(
          "[repairs/:id DELETE] Blob 刪除失敗，未刪除 DB 事件：",
          err,
        );
        return NextResponse.json(
          { error: "照片刪除失敗，這次沒有刪除事件，請稍後再試" },
          { status: 502 },
        );
      }
    }

    await RepairEventModel.deleteOne({ _id: id, userId: session.id });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[repairs/:id DELETE]", err);
    return NextResponse.json({ error: "刪除失敗，請稍後再試" }, { status: 500 });
  }
}
