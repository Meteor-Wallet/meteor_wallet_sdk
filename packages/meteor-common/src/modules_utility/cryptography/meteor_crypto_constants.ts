export const CRYPTO_SALT_PASSWORD_MATCH = "_password_match";
export const CRYPTO_SALT_PASSWORD_CIPHER_KEY = "_password_decrypt_key";
export const CRYPTO_SALT_WALLET_ID = "_wallet_id";

// An SHA256 hash of the word "meteor"
export const METEOR_GLOBAL_PASSWORD_PADDING_HASH =
  "647d177cca8601046a3cb39e12f55bec5790bfcbc42199dd5fcf063200fac1d0";

// The start and end padding for passwords, is exactly each half of that hash (first 32 chars, last 32 chars)
export const METEOR_GLOBAL_PASSWORD_PADDING_HASH_STA = "647d177cca8601046a3cb39e12f55bec";
export const METEOR_GLOBAL_PASSWORD_PADDING_HASH_END = "5790bfcbc42199dd5fcf063200fac1d0";
