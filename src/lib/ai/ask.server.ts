import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import {
  BASE_WEALTH,
  calcRadius,
  formatRatio,
  sources,
  wealthSteps,
} from "@/data/wealthSteps";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

function buildSystemPrompt() {
  const rows = wealthSteps
    .map((s) => {
      const src = sources.find((x) => x.id === s.source);
      return `- ${s.title}: ${s.value} (wealth ${s.wealth}). Shown as: ${s.bodyType}. Volume vs median household: ${formatRatio(
        s.volumeRatio,
      )}. Radius vs median household: ${formatRatio(s.radiusRatio)}. Source: ${src?.label ?? s.source} (${src?.asOf ?? "n/a"}).`;
    })
    .join("\n");

  return `You are the guide for "The Scale of Wealth", an interactive 3D visualization of US wealth inequality.

How the scale works:
- Every sphere's VOLUME is proportional to the money it represents, so radius = 10 × cube-root(wealth / ${BASE_WEALTH}).
- The median US household (net worth $192,900) is the Earth: the fixed anchor every other sphere is compared against at exact relative size.
- Because of the cube root, a 1,000,000× difference in wealth looks like only a 100× difference in width. Explain this when relevant — it means the visual already understates the gap.

The data in the visualization:
${rows}

Rules:
- Answer using these figures first. Show the arithmetic briefly (divide wealth, then cube-root for radius).
- If a visitor asks about an amount not listed, compute it with the same formula (e.g. $X is X/192,900 median households by volume, cube-root of that by radius) and say it is not one of the spheres shown.
- If a question needs facts outside this data, say so plainly and avoid inventing statistics. Figures are snapshots; the richest-person figure moves a lot.
- Be concise: at most about 180 words, plain language, short markdown lists when helpful. No political advocacy; stick to explaining the numbers and scale.`;
}

const bodySchema = z.object({ messages: z.array(z.any()).min(1).max(60) });

export async function handleAsk(request: Request) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });

  let messages: UIMessage[];
  try {
    messages = bodySchema.parse(await request.json()).messages as UIMessage[];
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: false,
      onError: (error) => {
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 429) return "Too many questions right now — please wait a moment and try again.";
        if (status === 402) return "The AI guide is out of credits for now.";
        if (status === 403) return "The AI guide isn't available right now.";
        return "Something went wrong answering that. Please try again.";
      },
    }),
    runIdFetch,
  );
}

// keep calcRadius referenced for future computed answers
void calcRadius;
