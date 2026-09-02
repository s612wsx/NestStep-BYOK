// 註冊 / 登入的共用驗證規則。此檔不得 import server-only 套件，前後端都會用到。

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export const USERNAME_HINT =
  "3–20 個字元，只能用英文、數字和底線";
