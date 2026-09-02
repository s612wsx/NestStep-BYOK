import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";
import { connectMongo } from "@/app/lib/mongoose";
import { MovePlanModel } from "@/app/models/MovePlan";
import {
  serializePlanDetail,
  type RawMovePlan,
} from "@/app/lib/move-plan-serialize";
import { getSessionUser } from "@/app/lib/auth";
import { PHASE_KEYS } from "@/app/lib/move-plan-types";

export const runtime = "nodejs";

const MAX_TITLE = 200;
type OwnedPlan = RawMovePlan & { userId?: string };

async function loadOwned(
  id: string,
  userId: string,
): Promise<OwnedPlan | null> {
  const plan = await MovePlanModel.findById(id).lean<OwnedPlan>();
  if (!plan || String(plan.userId) !== userId) return null;
  return plan;
}

/** 讀取單筆搬家計畫（Read）*/
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
    return NextResponse.json({ error: "找不到這筆搬家計畫" }, { status: 404 });
  }

  try {
    await connectMongo();
    const plan = await loadOwned(id, session.id);
    if (!plan) {
      return NextResponse.json(
        { error: "找不到這筆搬家計畫" },
        { status: 404 },
      );
    }
    return NextResponse.json(serializePlanDetail(plan));
  } catch (err) {
    console.error("[moving/:id GET]", err);
    return NextResponse.json({ error: "讀取失敗" }, { status: 500 });
  }
}

/** 更新 Checklist 項目：勾選 / 新增 / 修改 / 刪除（Update，都改同一筆計畫）*/
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
    return NextResponse.json({ error: "找不到這筆搬家計畫" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請以 JSON 格式傳送資料" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const action = b.action;
  const filter = { _id: id, userId: session.id };
  const notFound = NextResponse.json(
    { error: "找不到這筆搬家計畫" },
    { status: 404 },
  );

  try {
    await connectMongo();

    if (action === "toggle") {
      const itemId = typeof b.itemId === "string" ? b.itemId : "";
      if (!isValidObjectId(itemId)) return notFound;
      const updated = await MovePlanModel.findOneAndUpdate(
        { ...filter, "checklistItems._id": new Types.ObjectId(itemId) },
        { $set: { "checklistItems.$.completed": Boolean(b.completed) } },
        { new: true },
      ).lean<RawMovePlan>();
      if (!updated) return notFound;
      return NextResponse.json(serializePlanDetail(updated));
    }

    if (action === "add") {
      const title = (typeof b.title === "string" ? b.title : "")
        .trim()
        .slice(0, MAX_TITLE);
      const phase = typeof b.phase === "string" ? b.phase : "";
      if (!title) {
        return NextResponse.json({ error: "請輸入項目內容" }, { status: 400 });
      }
      if (!(PHASE_KEYS as string[]).includes(phase)) {
        return NextResponse.json({ error: "階段不正確" }, { status: 400 });
      }
      const updated = await MovePlanModel.findOneAndUpdate(
        filter,
        {
          $push: {
            checklistItems: { title, phase, completed: false, custom: true },
          },
        },
        { new: true },
      ).lean<RawMovePlan>();
      if (!updated) return notFound;
      return NextResponse.json(serializePlanDetail(updated));
    }

    if (action === "edit") {
      const itemId = typeof b.itemId === "string" ? b.itemId : "";
      const title = (typeof b.title === "string" ? b.title : "")
        .trim()
        .slice(0, MAX_TITLE);
      if (!isValidObjectId(itemId)) return notFound;
      if (!title) {
        return NextResponse.json({ error: "請輸入項目內容" }, { status: 400 });
      }
      // 只能改自己新增的（custom: true）
      const updated = await MovePlanModel.findOneAndUpdate(
        {
          ...filter,
          checklistItems: {
            $elemMatch: { _id: new Types.ObjectId(itemId), custom: true },
          },
        },
        { $set: { "checklistItems.$.title": title } },
        { new: true },
      ).lean<RawMovePlan>();
      if (!updated) {
        const plan = await loadOwned(id, session.id);
        if (!plan) return notFound;
        return NextResponse.json(
          { error: "只能修改自己新增的項目" },
          { status: 403 },
        );
      }
      return NextResponse.json(serializePlanDetail(updated));
    }

    if (action === "remove") {
      const itemId = typeof b.itemId === "string" ? b.itemId : "";
      if (!isValidObjectId(itemId)) return notFound;
      const updated = await MovePlanModel.findOneAndUpdate(
        filter,
        { $pull: { checklistItems: { _id: new Types.ObjectId(itemId) } } },
        { new: true },
      ).lean<RawMovePlan>();
      if (!updated) return notFound;
      return NextResponse.json(serializePlanDetail(updated));
    }

    return NextResponse.json({ error: "action 不正確" }, { status: 400 });
  } catch (err) {
    console.error("[moving/:id PATCH]", err);
    return NextResponse.json({ error: "更新失敗，請稍後再試" }, { status: 500 });
  }
}

/** 刪除整個搬家計畫（Delete）*/
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
    return NextResponse.json({ error: "找不到這筆搬家計畫" }, { status: 404 });
  }

  try {
    await connectMongo();
    const plan = await loadOwned(id, session.id);
    if (!plan) {
      return NextResponse.json(
        { error: "找不到這筆搬家計畫" },
        { status: 404 },
      );
    }
    await MovePlanModel.deleteOne({ _id: id, userId: session.id });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[moving/:id DELETE]", err);
    return NextResponse.json({ error: "刪除失敗，請稍後再試" }, { status: 500 });
  }
}
