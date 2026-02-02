export async function onRequest(context) {
  const { request, env } = context;

  // ===== CORS =====
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
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { guest = "Tamu", tone = "Islami" } = await request.json();

  // ===== PROMPT RANDOMIZER =====
  const prompts = {
    Islami: [
      `Buatkan doa pernikahan Islami yang lembut dan singkat untuk ${guest}`,
      `Tuliskan ucapan doa Islami penuh berkah untuk ${guest}`,
      `Buat doa Islami romantis dan elegan untuk ${guest}`
    ],
    Puitis: [
      `Tuliskan ucapan cinta puitis dan elegan untuk ${guest}`,
      `Buat kalimat indah penuh makna tentang cinta untuk ${guest}`,
      `Ucapan romantis berbahasa puitis untuk ${guest}`
    ],
    Santai: [
      `Buat ucapan santai, hangat, dan tulus untuk ${guest}`,
      `Ucapan bahagia sederhana tapi berkesan untuk ${guest}`,
      `Kalimat ringan penuh doa untuk ${guest}`
    ]
  };

  const pick =
    prompts[tone]?.[
      Math.floor(Math.random() * prompts[tone].length)
    ] || prompts.Islami[0];

  // ===== GEMINI API =====
  const aiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: pick }] }]
      })
    }
  );

  const aiData = await aiRes.json();

  const text =
    aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Semoga Allah memberkahi langkah indah kalian 🤍";

  const payload = {
    guest,
    tone,
    message: text,
    time: new Date().toISOString(),
    source: "ai"
  };

  // ===== SAVE TO FIREBASE =====
  await fetch(
    `${env.FIREBASE_URL}/rsvp.json?auth=${env.FIREBASE_SECRET}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  return new Response(
    JSON.stringify({ text }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
