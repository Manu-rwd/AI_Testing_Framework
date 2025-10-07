import 'dotenv/config';
import OpenAI from "openai";

export type ChatInput = {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  responseFormatJson?: boolean;
};

export class LlmCaller {
  private client: OpenAI;
  private primaryModel: string;
  private fallbackModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required");
    this.client = new OpenAI({ apiKey });
    this.primaryModel = process.env.AGENT_MODEL || "gpt-5";
    this.fallbackModel = "gpt-4.1-mini";
  }

  async chat(input: ChatInput) {
    const fmt = input.responseFormatJson ? { type: "json_object" as const } : undefined;
    const isGpt5 = this.primaryModel.toLowerCase().startsWith("gpt-5");
    try {
      const base = { model: this.primaryModel, messages: input.messages, response_format: fmt } as any;
      const payload = isGpt5 ? base : { ...base, temperature: 0, top_p: 1 };
      return await this.client.chat.completions.create(payload);
    } catch (e: any) {
      const msg = e?.message || "";
      const code = e?.status || 0;
      // If GPT-5 rejects temperature/top_p, retry without them on primary
      if (!isGpt5 && code === 400 && /Unsupported value: 'temperature'/.test(msg)) {
        const base = { model: this.primaryModel, messages: input.messages, response_format: fmt } as any;
        return await this.client.chat.completions.create(base);
      }
      const isModelIssue = code === 400 || code === 404 || /model/i.test(msg);
      if (!isModelIssue) throw e;
      // Fallback once
      return await this.client.chat.completions.create({
        model: this.fallbackModel,
        messages: input.messages,
        // Always include deterministic knobs on fallback
        temperature: 0,
        top_p: 1,
        response_format: fmt
      });
    }
  }
}


