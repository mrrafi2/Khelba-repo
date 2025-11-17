import admin from "../../../../lib/server/firebaseAdmin"; 
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { game, score, coins, uid } = body ?? {};

    if (!game || typeof score !== "number" || typeof coins !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Optional: verify idToken from Authorization header (recommended)
    const authHeader = req.headers.get("authorization") || "";
    let verifiedUid = uid ?? null;
    if (!verifiedUid && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        verifiedUid = decoded.uid;
      } catch (err) {
        console.warn("idToken verify failed", err);
      }
    }

    if (!verifiedUid) {
      // If you want to accept uid in body (less secure), comment out the next line
      return NextResponse.json({ error: "Missing uid or valid token" }, { status: 400 });
    }

    const ts = Date.now();
    const db = admin.database();
    const roundRef = db.ref(`users/${verifiedUid}/games/${game}/rounds/${ts}`);
    await roundRef.set({ score, coins, timestamp: ts });

    // update meta
    const metaRef = db.ref(`users/${verifiedUid}/games/${game}/meta`);
    await metaRef.update({ lastPlayedAt: ts, lastScore: score, lastCoins: coins });

    return NextResponse.json({ ok: true, ts });
  } catch (err) {
    console.error("save-score route error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
