import { jsonSuccess, jsonError } from "@/lib/api-response";
import { authenticateRequest, parseJSON } from "@/lib/error-handler";
import { AppError, ValidationError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

import { checkRateLimit } from "@/lib/rateLimit";
import { detectInjection, sanitizeMessage } from "@/utils/promptGuard";

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  // Rate limiting
  const rateLimitResult = await checkRateLimit(decodedToken.uid);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

    // Parse body
    const body = await parseJSON(request, 1024 * 10);

    const validation = groqSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
      throw new ValidationError(firstError);
    }

    let rawMessage = "";
    let history = [];

    if (validation.data.messages && validation.data.messages.length > 0) {
      const lastMsg = validation.data.messages[validation.data.messages.length - 1];
      rawMessage = lastMsg.content;
      history = validation.data.messages.slice(0, -1);
    } else {
      rawMessage = validation.data.message || validation.data.userMessage;
    }

    const trimmedMessage = rawMessage.trim();

  // Check for prompt injection
  const injectionCheck = detectInjection(trimmedMessage);
  if (injectionCheck.isInjection) {
    console.warn(`[nova-ai-safety] Injection blocked for user ${decodedToken.uid}: ${injectionCheck.matchedPattern}`);
    return jsonError("Safety check: System instructions override or prompt injection attempt detected.", 400);
  }

  // Sanitize and call Groq
  const sanitizedMessage = sanitizeMessage(trimmedMessage);
  const content = await callGroq(sanitizedMessage);

  return jsonSuccess({ message: content });
});
