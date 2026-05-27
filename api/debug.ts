import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const keyPrefix = process.env.ANTHROPIC_API_KEY
      ? process.env.ANTHROPIC_API_KEY.substring(0, 12) + "..."
          : "MISSING";
    const envKeys = Object.keys(process.env).filter(
          (k) => !k.startsWith("__") && !k.includes("SECRET")
        );

  return res.status(200).json({
        hasAnthropicKey,
        keyPrefix,
        envKeyCount: envKeys.length,
        envKeys: envKeys.sort(),
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
  });
}
