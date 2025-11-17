import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../../lib/server/firebaseAdmin"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body || {};
  const { game, score, coins, uid } = body;

  if (!game || typeof score !== "number" || typeof coins !== "number") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    // Best practice: verify session / token here instead of trusting uid in body.
    // If you use session cookies, validate them and derive uid server-side.
    // For now, require client to send uid and write under that path.
    if (!uid) {
      return res.status(400).json({ error: "Missing uid" });
    }

    const ts = Date.now();
    const roundRef = admin.database().ref(`users/${uid}/games/${game}/rounds/${ts}`);
    await roundRef.set({
      score,
      coins,
      timestamp: ts,
    });

    // Optionally update overall stats/leaderboard / lastPlayed
    const metaRef = admin.database().ref(`users/${uid}/games/${game}/meta`);
    await metaRef.update({
      lastPlayedAt: ts,
      lastScore: score,
      lastCoins: coins,
    });

    return res.status(200).json({ ok: true, ts });
  } catch (err: any) {
    console.error("save-round error", err);
    return res.status(500).json({ error: "server error" });
  }
}
