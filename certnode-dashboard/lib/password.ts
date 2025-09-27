import argon2 from "argon2";

const HASH_CONFIG: argon2.Options & { type: argon2.Type } = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
};

export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, HASH_CONFIG);
}

export async function verifyPassword(
  plainText: string,
  hashed: string,
): Promise<boolean> {
  return argon2.verify(hashed, plainText, HASH_CONFIG);
}
