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
    try {
      return await this.client.chat.completions.create({
        model: this.primaryModel,
        messages: input.messages,
        temperature: 0,
        top_p: 1,
        response_format: fmt
      });
    } catch (e: any) {
      const msg = e?.message || "";
      const code = e?.status || 0;
      const isModelIssue = code === 400 || code === 404 || /model/i.test(msg);
      if (!isModelIssue) throw e;
      // Fallback once
      return await this.client.chat.completions.create({
        model: this.fallbackModel,
        messages: input.messages,
        temperature: 0,
        top_p: 1,
        response_format: fmt
      });
    }
  }
}


