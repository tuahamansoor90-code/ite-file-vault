export async function POST() {
  return new Response(JSON.stringify({ reply: "AI features have been disabled.", actions: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
