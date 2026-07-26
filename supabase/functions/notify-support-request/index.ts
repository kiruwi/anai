import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { buildSupportEmail, type SupportRequest } from "./supportEmail.ts";

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email";
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({})) as { requestId?: unknown };
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (!requestIdPattern.test(requestId)) {
      return Response.json({ error: "A valid support request ID is required" }, { status: 400 });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY")?.trim();
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL")?.trim();
    const notificationEmail = Deno.env.get("SUPPORT_NOTIFICATION_EMAIL")?.trim();
    if (!brevoApiKey || !senderEmail || !notificationEmail) {
      console.error("Support notification secrets are incomplete");
      return Response.json({ error: "Email notification is not configured" }, { status: 500 });
    }

    const { data, error } = await ctx.supabaseAdmin
      .from("support_requests")
      .select("id, request_number, full_name, email, phone, category, order_reference, message, created_at")
      .eq("id", requestId)
      .single();

    if (error || !data) {
      console.error("Support request lookup failed", { requestId, code: error?.code });
      return Response.json({ error: "Support request was not found" }, { status: 404 });
    }

    const supportRequest = data as SupportRequest;
    const email = buildSupportEmail(supportRequest);
    const response = await fetch(brevoEndpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "ANAI Support", email: senderEmail },
        to: [{ name: "ANAI Support", email: notificationEmail }],
        replyTo: { name: supportRequest.full_name, email: supportRequest.email },
        subject: email.subject,
        textContent: email.textContent,
        htmlContent: email.htmlContent,
        headers: { "Idempotency-Key": `support-request-${supportRequest.id}` },
        tags: ["support-request"],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const result = await response.json().catch(() => ({})) as { messageId?: string; message?: string };
    if (!response.ok || !result.messageId) {
      console.error("Brevo support notification failed", {
        requestId,
        status: response.status,
        message: result.message,
      });
      return Response.json({ error: "Email notification could not be sent" }, { status: 502 });
    }

    return Response.json({ sent: true, messageId: result.messageId });
  }),
};
