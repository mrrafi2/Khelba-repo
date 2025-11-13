// pages/api/games/top-scores.ts
import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../../firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { game, limit = "10" } = req.query;
  if (!game || typeof game !== "string") return res.status(400).json({ error: "Missing game" });

  try {
    const db = admin.database();
    const snap = await db.ref(`leaderboards/${game}`).orderByChild("score").limitToLast(Number(limit)).once("value");
    const entries: any[] = [];
    snap.forEach((ch) => entries.push({ id: ch.key, ...(ch.val() as object) }));
    // results are ascending (limitToLast), so sort desc
    entries.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return res.status(200).json(entries);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
}
