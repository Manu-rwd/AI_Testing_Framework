#!/usr/bin/env node
import 'dotenv/config';
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
    const base = {
      model,
      messages: [
        { role: "system", content: "Return valid JSON: {\\\"ok\\\":true}" },
        { role: "user", content: "Reply with {\\\"ok\\\":true} only." }
      ],
      response_format: { type: "json_object" as const }
    };
    const useNoTemp = model.toLowerCase().startsWith("gpt-5");
    const payload: any = useNoTemp ? base : { ...base, temperature: 0, top_p: 1 };
    let res = await client.chat.completions.create(payload);
    // If GPT-5 rejects temperature/top_p (just in case), retry without them
    if (!useNoTemp && res == null) {
      res = await client.chat.completions.create(base as any);
    }
    const content = res.choices?.[0]?.message?.content || "";
    console.log(JSON.stringify({ model, ok: true, content }, null, 2));
    process.exit(0);
  } catch (e: any) {
    const status = e?.status ?? null;
    const message = e?.message ?? String(e);
    // If temperature/top_p unsupported, retry without those fields once
    if (status === 400 && /Unsupported value: 'temperature'/.test(message)) {
      try {
        const res2 = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "Return valid JSON: {\\\"ok\\\":true}" },
            { role: "user", content: "Reply with {\\\"ok\\\":true} only." }
          ],
          response_format: { type: "json_object" }
        } as any);
        const content = res2.choices?.[0]?.message?.content || "";
        console.log(JSON.stringify({ model, ok: true, content, retried: true }, null, 2));
        process.exit(0);
      } catch (e2: any) {
        console.error(JSON.stringify({ model, ok: false, status: e2?.status ?? null, message: e2?.message ?? String(e2) }, null, 2));
        process.exit(1);
      }
    } else {
      console.error(JSON.stringify({ model, ok: false, status, message }, null, 2));
      process.exit(1);
    }
  }
}

main();


