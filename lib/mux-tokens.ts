import jwt from "jsonwebtoken";

export function signMuxPlaybackToken(playbackId: string): string {
  const keyId = process.env.MUX_SIGNING_KEY!;
  const privateKey = Buffer.from(
    process.env.MUX_PRIVATE_KEY!,
    "base64"
  ).toString("utf8");

  return jwt.sign(
    { sub: playbackId, aud: "v", exp: Math.floor(Date.now() / 1000) + 3600 },
    privateKey,
    { algorithm: "RS256", keyid: keyId }
  );
}
