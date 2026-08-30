import crypto from "crypto";

export function generateRunnerKey() {
  const secret = crypto.randomBytes(32).toString("base64url");

  const key = `cak_live_${secret}`;

  const hash = crypto
    .createHash("sha256")
    .update(key)
    .digest("hex");

  const prefix = key.slice(0, 18);

  return {
    key,
    hash,
    prefix,
  };
}
