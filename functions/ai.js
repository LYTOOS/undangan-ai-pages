export async function onRequest(context) {
  const { request, env } = context;

  /* ===== CORS ===== */
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const body = await request.json();
    const guest = body.guest || "Tamu Undangan";
    const tone = body.tone || "Islami";

    const nonce = Date.now() + Math.random().toString(36).slice(2);

    const prompt = `
Buat 1 ucapan ${tone} untuk pertunangan.
Nama tamu: ${guest}

Aturan:
- Bahasa Indonesia
- Maks 3 kalimat
- Variasi kalimat
- Tidak klise
- Jangan ulangi hasil sebelumnya

ID: ${nonce}
`;

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const aiData = await aiRes.json();

    const text =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Semoga Allah memberkahi langkah indah kalian 🤍";

    /* SAVE FIREBASE */
    await fetch(`${env.FIREBASE_URL}/rsvp.json?auth=${env.FIREBASE_SECRET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest,
        tone,
        message: text,
        time: new Date().toISOString()
      })
    });

    return new Response(
      JSON.stringify({ text }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      }
    );
  }
}
