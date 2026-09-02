import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const checklistItemSchema = new Schema(
  {
    title: { type: String, required: true },
    // "before_30" | "before_14" | "before_7" | "before_1" | "move_day" | "after"
    phase: { type: String, required: true },
    completed: { type: Boolean, default: false },
    // true = 使用者自己新增的（才可修改標題）
    custom: { type: Boolean, default: false },
  },
  { _id: true },
);

const movePlanSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    moveDate: { type: Date, required: true },
    housingType: { type: String, required: true },
    movingCompany: { type: String, required: true },
    largeFurniture: { type: [String], default: [] },
    pet: { type: String, required: true },
    internetSetup: { type: String, required: true },
    moveOutStatus: { type: String, required: true },
    purchaseNeeds: { type: [String], default: [] },
    additionalNotes: { type: String, default: "" },
    checklistItems: { type: [checklistItemSchema], default: [] },
  },
  // 這個功能會反覆更新同一筆計畫，需要 updatedAt
  { timestamps: true },
);

export type MovePlanDoc = InferSchemaType<typeof movePlanSchema>;

export const MovePlanModel: Model<MovePlanDoc> =
  (models.MovePlan as Model<MovePlanDoc>) ??
  model<MovePlanDoc>("MovePlan", movePlanSchema);
