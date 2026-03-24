import { randomBytes } from "crypto";

export function generateHash(bytes: number) {
  return randomBytes(bytes).toString("hex");
}
