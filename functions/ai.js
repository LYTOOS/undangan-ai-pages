export default {
  async fetch(req, env) {

    /* =======================
       CORS (WAJIB)
    ======================= */
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    /* =======================
       REQUEST BODY
    ======================= */
    const body = await req.json();
    const guest = body.guest || "Tamu Undangan";
    const tone = body.tone || "Islami";
    let message = body.message || null;

    /* =======================
       AI GENERATOR (ANTI SAMA)
    ======================= */
    if (!message) {

      const styles = {
        Islami: [
          "lembut dan penuh doa",
          "syar'i dan menenangkan",
          "islami modern dan hangat"
        ],
        Puitis: [
          "romantis puitis",
          "sastra indah",
          "kalimat elegan penuh makna"
        ],
        Santai: [
          "santai dan akrab",
          "ringan tapi berkesan",
          "hangat seperti sahabat"
        ]
      };

      const randomStyle =
        styles[tone][Math.floor(Math.random() * styles[tone].length)];

      const nonce =
        Date.now() + "-" + Math.random().toString(36).substring(2, 8);

      const prompt = `
Buatkan 1 ucapan ${tone} ${randomStyle} untuk acara pertunangan.

Nama tamu: ${guest}

Aturan:
- Maksimal 3 kalimat
- Bahasa Indonesia
- Tidak klise
- Jangan mengulang kalimat sebelumnya
- Variasikan diksi dan struktur kalimat

ID Unik: ${nonce}
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

      message =
        aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Semoga Allah memberkahi langkah indah kalian 🤍";
    }

    /* =======================
       SAVE TO FIREBASE
    ======================= */
    await fetch(`${env.FIREBASE_URL}/rsvp.json?auth=${env.FIREBASE_SECRET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest,
        tone,
        message,
        time: new Date().toISOString(),
        source: "ai"
      })
    });

    /* =======================
       RESPONSE
    ======================= */
    return new Response(
      JSON.stringify({ text: message }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};
