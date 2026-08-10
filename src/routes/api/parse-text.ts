export async function POST() {
  return new Response(JSON.stringify({ fields: {} }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
