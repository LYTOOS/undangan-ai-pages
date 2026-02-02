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

    const seed = crypto.randomUUID();

    const mood = [
      "tenang",
      "khusyuk",
      "hangat",
      "haru",
      "penuh syukur",
      "lembut"
    ][Math.floor(Math.random() * 6)];
    
    const length = [
      "2 kalimat",
      "3 kalimat",
      "maksimal 35 kata",
      "maksimal 40 kata"
    ][Math.floor(Math.random() * 4)];
    
    const prompt = `
    Kamu adalah AI penulis doa pernikahan profesional.
    
    Tulis SATU ucapan ${tone} bernuansa ${mood}.
    Panjang: ${length}
    
    ATURAN WAJIB:
    - Bahasa Indonesia
    - DILARANG mengulang struktur sebelumnya
    - DILARANG kalimat klise
    - HARUS terdengar alami & manusiawi
    - SETIAP OUTPUT HARUS BERBEDA TOTAL
    
    Seed unik: ${seed}
    Nama tamu: ${guest}
    `;

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1.15,
            topK: 50,
            topP: 0.95
          }
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
