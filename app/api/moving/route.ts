import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongoose";
import { MovePlanModel } from "@/app/models/MovePlan";
import { generateMoveChecklist } from "@/app/lib/move-checklist";
import { apiKeyFromRequest, MissingApiKeyError } from "@/app/lib/openai-client";
import { serializePlanDetail } from "@/app/lib/move-plan-serialize";
import { getSessionUser } from "@/app/lib/auth";
import {
  HOUSING_TYPES,
  MOVING_COMPANY_OPTIONS,
  LARGE_FURNITURE_OPTIONS,
  LARGE_FURNITURE_NONE,
  PET_OPTIONS,
  INTERNET_OPTIONS,
  MOVE_OUT_OPTIONS,
  PURCHASE_OPTIONS,
  PURCHASE_NONE,
  type MovePlanInput,
} from "@/app/lib/move-plan-types";

export const runtime = "nodejs";
export const maxDuration = 60;

type ValidateOk = { ok: true; value: MovePlanInput };
type ValidateErr = { ok: false; error: string };

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function validateInput(body: unknown): ValidateOk | ValidateErr {
  const b = (body ?? {}) as Record<string, unknown>;

  const moveDate = asString(b.moveDate);
  if (!moveDate || Number.isNaN(Date.parse(moveDate))) {
    return { ok: false, error: "請選擇有效的搬家日期" };
  }

  const housingType = asString(b.housingType);
  if (!(HOUSING_TYPES as readonly string[]).includes(housingType)) {
    return { ok: false, error: "請選擇目前居住情況" };
  }

  const movingCompany = asString(b.movingCompany);
  if (!(MOVING_COMPANY_OPTIONS as readonly string[]).includes(movingCompany)) {
    return { ok: false, error: "請選擇是否需要搬家公司" };
  }

  const pet = asString(b.pet);
  if (!(PET_OPTIONS as readonly string[]).includes(pet)) {
    return { ok: false, error: "請選擇寵物狀況" };
  }

  const internetSetup = asString(b.internetSetup);
  if (!(INTERNET_OPTIONS as readonly string[]).includes(internetSetup)) {
    return { ok: false, error: "請選擇是否需要申請新家網路" };
  }

  const moveOutStatus = asString(b.moveOutStatus);
  if (!(MOVE_OUT_OPTIONS as readonly string[]).includes(moveOutStatus)) {
    return { ok: false, error: "請選擇是否需要辦理舊家退租" };
  }

  const largeFurniture = Array.isArray(b.largeFurniture)
    ? b.largeFurniture.filter((x): x is string => typeof x === "string")
    : [];
  if (largeFurniture.length === 0) {
    return { ok: false, error: "請選擇大型家具（沒有的話請勾「沒有」）" };
  }
  if (
    largeFurniture.some(
      (x) => !(LARGE_FURNITURE_OPTIONS as readonly string[]).includes(x),
    )
  ) {
    return { ok: false, error: "大型家具選項不正確" };
  }
  if (largeFurniture.includes(LARGE_FURNITURE_NONE) && largeFurniture.length > 1) {
    return { ok: false, error: "「沒有」不能和其他大型家具一起選" };
  }

  const purchaseNeeds = Array.isArray(b.purchaseNeeds)
    ? b.purchaseNeeds.filter((x): x is string => typeof x === "string")
    : [];
  if (purchaseNeeds.length === 0) {
    return { ok: false, error: "請選擇需要添購的物品（沒有的話請勾「不需要」）" };
  }
  if (
    purchaseNeeds.some(
      (x) => !(PURCHASE_OPTIONS as readonly string[]).includes(x),
    )
  ) {
    return { ok: false, error: "添購物品選項不正確" };
  }
  if (purchaseNeeds.includes(PURCHASE_NONE) && purchaseNeeds.length > 1) {
    return { ok: false, error: "「不需要」不能和其他項目一起選" };
  }

  const additionalNotes = asString(b.additionalNotes).slice(0, 1000);

  return {
    ok: true,
    value: {
      moveDate,
      housingType,
      movingCompany,
      largeFurniture,
      pet,
      internetSetup,
      moveOutStatus,
      purchaseNeeds,
      additionalNotes,
    },
  };
}

/** 建立搬家計畫（Create）*/
export async function POST(request: Request) {
  // 登入牆：搬家計畫會存進使用者帳號，未登入不給用
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: "請先登入或註冊，才能使用這項功能" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請以 JSON 格式傳送資料" }, { status: 400 });
  }

  const validated = validateInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const input = validated.value;

  // BYOK：使用者自己的 OpenAI 金鑰（不記錄、不儲存）
  let apiKey: string;
  try {
    apiKey = apiKeyFromRequest(request);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // 1. AI 依情況產生客製化 Checklist
  let generated;
  try {
    generated = await generateMoveChecklist(apiKey, input);
  } catch (err) {
    console.error("[moving POST] AI 產生 Checklist 失敗：", err);
    const message = err instanceof Error ? err.message : "AI 產生失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 2. 建立一筆搬家計畫紀錄
  try {
    await connectMongo();
    const plan = await MovePlanModel.create({
      userId: session.id,
      moveDate: new Date(input.moveDate),
      housingType: input.housingType,
      movingCompany: input.movingCompany,
      largeFurniture: input.largeFurniture,
      pet: input.pet,
      internetSetup: input.internetSetup,
      moveOutStatus: input.moveOutStatus,
      purchaseNeeds: input.purchaseNeeds,
      additionalNotes: input.additionalNotes,
      checklistItems: generated.map((it) => ({
        title: it.title,
        phase: it.phase,
        completed: false,
        custom: false,
      })),
    });

    return NextResponse.json(serializePlanDetail(plan.toObject()), {
      status: 201,
    });
  } catch (err) {
    console.error("[moving POST] DB 寫入失敗：", err);
    return NextResponse.json(
      { error: "資料庫寫入失敗，請稍後再試" },
      { status: 500 },
    );
  }
}

/** 目前登入使用者自己的搬家計畫列表（Read）*/
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  try {
    await connectMongo();
    const plans = await MovePlanModel.find({ userId: session.id })
      .select("moveDate housingType checklistItems createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: plans.map((plan) => {
        const items = plan.checklistItems ?? [];
        return {
          id: String(plan._id),
          moveDate: new Date(plan.moveDate).toISOString().slice(0, 10),
          housingType: plan.housingType,
          totalItems: items.length,
          completedItems: items.filter((it) => it.completed).length,
          createdAt: new Date(plan.createdAt).toISOString(),
        };
      }),
    });
  } catch (err) {
    console.error("[moving GET]", err);
    return NextResponse.json({ error: "讀取搬家計畫失敗" }, { status: 500 });
  }
}
