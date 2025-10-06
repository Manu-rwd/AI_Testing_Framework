#!/usr/bin/env node
import OpenAI from "openai";

function getEnv(name: string, def?: string): string {
  const v = process.env[name] ?? def;
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

async function main() {
  const apiKey = getEnv("OPENAI_API_KEY");
  const model = process.env.AGENT_MODEL || "gpt-5";
  const client = new OpenAI({ apiKey });
  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "Return valid JSON: {\"ok\":true}" },
        { role: "user", content: "Reply with {\"ok\":true} only." }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    });
    const content = res.choices?.[0]?.message?.content || "";
    console.log(JSON.stringify({ model, ok: true, content }, null, 2));
    process.exit(0);
  } catch (e: any) {
    const status = e?.status ?? null;
    const message = e?.message ?? String(e);
    console.error(JSON.stringify({ model, ok: false, status, message }, null, 2));
    process.exit(1);
  }
}

main();


