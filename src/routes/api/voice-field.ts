export async function POST() {
  return new Response(JSON.stringify({ text: "" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
