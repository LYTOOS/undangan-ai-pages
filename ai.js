export async function onRequest({ request, env }) {

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: cors
    });
  }

  const { guest = "Tamu", tone = "Islami" } = await request.json();

  return new Response(
    JSON.stringify({
      text: `TEST OK untuk ${guest} (${tone})`
    }),
    {
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    }
  );
}
