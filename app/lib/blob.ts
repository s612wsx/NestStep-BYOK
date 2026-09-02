import { put, del, type PutBlobResult } from "@vercel/blob";

// 注意：部署到 Vercel 後，經由 server 上傳的 request body 上限約 4.5MB。
// 之後要支援更大的檔案，需改成 client upload（@vercel/blob/client）。
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** 使用者輸入有問題時丟出，API 會回 400 */
export class UploadError extends Error {}

/** 上傳成功後回傳給前端的檔案資訊 */
export type UploadedFile = {
  url: string;
  pathname: string;
  fileName: string;
  size: number;
  contentType: string;
};

function getToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("環境變數缺少 BLOB_READ_WRITE_TOKEN");
  }
  return token;
}

function assertSize(file: File, label: string): void {
  if (!file.size) {
    throw new UploadError(`${label}是空的`);
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = Math.round(MAX_FILE_BYTES / 1024 / 1024);
    throw new UploadError(`${label}過大，請上傳 ${mb}MB 以內的檔案`);
  }
}

/** 租屋 / 看房：接受 PDF 或圖片 */
export function assertUploadable(file: File): void {
  assertSize(file, "檔案");
  const type = file.type || "";
  if (type !== "application/pdf" && !type.startsWith("image/")) {
    throw new UploadError("只支援 PDF 或圖片檔");
  }
}

/** 家裡東西壞了：只接受圖片 */
export function assertRepairImage(file: File): void {
  assertSize(file, "圖片");
  if (!(file.type || "").startsWith("image/")) {
    throw new UploadError("只能上傳圖片檔");
  }
}

/** 我看不懂這份文件：只接受 PDF */
export function assertPdfFile(file: File): void {
  assertSize(file, "檔案");
  if ((file.type || "") !== "application/pdf") {
    throw new UploadError("只支援 PDF 檔");
  }
}

/**
 * 把檔案存到 Vercel Blob。依「前綴/日期」分資料夾，檔名加隨機後綴避免衝突。
 */
async function uploadToBlob(prefix: string, file: File): Promise<UploadedFile> {
  const folder = new Date().toISOString().slice(0, 10);
  const safeName = (file.name || "upload").replace(/[^\w.\-]+/g, "_");

  const blob: PutBlobResult = await put(
    `${prefix}/${folder}/${safeName}`,
    file,
    {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
      token: getToken(),
    },
  );

  return {
    url: blob.url,
    pathname: blob.pathname,
    fileName: file.name || blob.pathname,
    size: file.size,
    contentType: blob.contentType || file.type || "application/octet-stream",
  };
}

/** 租屋 / 看房的合約 / 廣告檔案 → `renting/` */
export function uploadRentingFile(file: File): Promise<UploadedFile> {
  return uploadToBlob("renting", file);
}

/** 家裡東西壞了的現場照片 → `repairs/` */
export function uploadRepairPhoto(file: File): Promise<UploadedFile> {
  return uploadToBlob("repairs", file);
}

/** 我看不懂這份文件的 PDF → `documents/` */
export function uploadDocumentFile(file: File): Promise<UploadedFile> {
  return uploadToBlob("documents", file);
}

/** 帳單 / 費用有問題的 PDF → `bills/` */
export function uploadBillFile(file: File): Promise<UploadedFile> {
  return uploadToBlob("bills", file);
}

/** 其他生活問題的圖片 → `other/` */
export function uploadOtherImage(file: File): Promise<UploadedFile> {
  return uploadToBlob("other", file);
}

/** 依 URL 刪除一個 Blob 檔案（rollback / 刪除事件時共用）。del() 對不存在的檔案是安全的。 */
export async function deleteBlobFile(url: string): Promise<void> {
  await del(url, { token: getToken() });
}
