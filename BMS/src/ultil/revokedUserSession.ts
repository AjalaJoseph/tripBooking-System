import { redis } from "../config/redis";

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;
export const revokeRefreshTokenFamily = async (familyId: string, reason:string): Promise<void> => {
  const familyKey = `refresh-family:${familyId}`;
  const revokedFamilyKey = `revoked-family:${familyId}`;
  const jtis = await redis.smembers(familyKey);

  // Mark the entire family as revoked
  await redis.set(
    revokedFamilyKey,
    JSON.stringify({familyId, reason: reason, revokedAt: new Date().toISOString(),}),
    "EX",
    REFRESH_TOKEN_TTL
  );

  // Remove every active refresh-token session in this family
  if (jtis.length > 0) {
    const refreshKeys = jtis.map(
      (jti) => `refresh:${jti}`
    );

    await redis.del(...refreshKeys);
  }

  // Remove the family set itself
  await redis.del(familyKey);
};