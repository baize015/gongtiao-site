import { siteConfig } from "@/site.config";

/**
 * AI 猫猫的对话接口（OpenAI 兼容协议）。
 *
 * 需要在 EdgeOne 控制台配置环境变量（不配置也能跑，会返回一句兜底的话）：
 *   AI_API_KEY   你的模型 Key
 *   AI_BASE_URL  接口地址，默认 https://api.deepseek.com/v1
 *   AI_MODEL     模型名，默认取 site.config.ts 里的 aiCat.model
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const FALLBACKS = [
  "喵……山里起雾了，我有点听不清。",
  "喵呜，今天不想说话，只想晒太阳。",
  "你等等，风太大了，把我耳朵吹歪了喵。",
  "喵？我刚刚在追一片叶子……你说什么？",
];

/* 简易限流：单个 IP 每小时 20 次（Serverless 实例内有效，够用了） */
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW = 60 * 60 * 1000;
const LIMIT = 20;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now > cur.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW });
    return false;
  }
  cur.count += 1;
  return cur.count > LIMIT;
}

function sanitize(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is ChatMessage => Boolean(m) && typeof m === "object")
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String((m as ChatMessage).content ?? "").slice(0, 500).trim(),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-12);
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return Response.json({ reply: "喵……你问得太快了，让我歇一会儿。", offline: true });
  }

  let messages: ChatMessage[] = [];
  try {
    const body = (await request.json()) as { messages?: unknown };
    messages = sanitize(body.messages);
  } catch {
    return Response.json({ reply: "喵？我没听懂。", offline: true });
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || messages.length === 0) {
    return Response.json({
      reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
      offline: true,
    });
  }

  const base = (process.env.AI_BASE_URL || "https://api.deepseek.com/v1").replace(/\/+$/, "");
  const endpoint = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
  const model = process.env.AI_MODEL || siteConfig.aiCat.model;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: siteConfig.aiCat.systemPrompt }, ...messages],
        max_tokens: siteConfig.aiCat.maxOutputTokens,
        temperature: siteConfig.aiCat.temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[ai-chat] upstream error", res.status, detail.slice(0, 300));
      return Response.json({ reply: "喵……我这边出了点小状况，等会儿再聊。", offline: true });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return Response.json({ reply: "喵……脑子突然一片空白。", offline: true });
    }
    return Response.json({ reply: reply.slice(0, 300) });
  } catch (err) {
    console.error("[ai-chat] request failed", err);
    return Response.json({ reply: "喵……山里的信号断了。", offline: true });
  } finally {
    clearTimeout(timer);
  }
}
