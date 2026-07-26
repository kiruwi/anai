import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import {
  buildPaidOrderEmails,
  type PaidOrder,
  type PaidOrderItem,
} from "./orderEmail.ts";

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email";
const checkoutRequestIdPattern = /^[A-Za-z0-9_-]{10,120}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const staleClaimMilliseconds = 5 * 60_000;

type NotificationRow = {
  order_id: string;
  status: "processing" | "sent" | "failed";
  attempts: number;
  claimed_at: string;
  updated_at: string;
};

const cleanString = (value: unknown) => typeof value === "string" ? value.trim() : "";

export default {
  fetch: withSupabase({ auth: "secret" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({})) as { checkoutRequestId?: unknown };
    const checkoutRequestId = cleanString(body.checkoutRequestId);
    if (!checkoutRequestIdPattern.test(checkoutRequestId)) {
      return Response.json({ error: "A valid checkout request ID is required" }, { status: 400 });
    }

    const { data: payment, error: paymentError } = await ctx.supabaseAdmin
      .from("payments")
      .select("order_id, mpesa_receipt_number, paid_at")
      .eq("mpesa_checkout_request_id", checkoutRequestId)
      .eq("provider", "mpesa")
      .eq("status", "paid")
      .maybeSingle();

    if (paymentError) {
      console.error("Paid payment lookup failed", { checkoutRequestId, code: paymentError.code });
      return Response.json({ error: "Paid order lookup failed" }, { status: 500 });
    }
    if (!payment) {
      return Response.json({ error: "A paid order was not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { data: insertedClaim, error: insertClaimError } = await ctx.supabaseAdmin
      .from("order_email_notifications")
      .insert({ order_id: payment.order_id, status: "processing", attempts: 1, claimed_at: now, updated_at: now })
      .select("order_id")
      .maybeSingle();

    let hasClaim = Boolean(insertedClaim);
    if (insertClaimError && insertClaimError.code !== "23505") {
      console.error("Order email claim failed", { orderId: payment.order_id, code: insertClaimError.code });
      return Response.json({ error: "Order email could not be prepared" }, { status: 500 });
    }

    if (!hasClaim) {
      const { data: existingClaim, error: existingClaimError } = await ctx.supabaseAdmin
        .from("order_email_notifications")
        .select("order_id, status, attempts, claimed_at, updated_at")
        .eq("order_id", payment.order_id)
        .single();

      if (existingClaimError || !existingClaim) {
        console.error("Order email claim lookup failed", { orderId: payment.order_id, code: existingClaimError?.code });
        return Response.json({ error: "Order email could not be prepared" }, { status: 500 });
      }

      const claim = existingClaim as NotificationRow;
      if (claim.status === "sent") {
        return Response.json({ sent: true, alreadySent: true });
      }

      const claimIsStale = Date.now() - new Date(claim.claimed_at).getTime() >= staleClaimMilliseconds;
      if (claim.status === "processing" && !claimIsStale) {
        return Response.json({ sent: false, processing: true }, { status: 202 });
      }

      const { data: reclaimed } = await ctx.supabaseAdmin
        .from("order_email_notifications")
        .update({
          status: "processing",
          attempts: claim.attempts + 1,
          claimed_at: now,
          updated_at: now,
          last_error: null,
        })
        .eq("order_id", payment.order_id)
        .eq("updated_at", claim.updated_at)
        .select("order_id")
        .maybeSingle();

      hasClaim = Boolean(reclaimed);
      if (!hasClaim) {
        return Response.json({ sent: false, processing: true }, { status: 202 });
      }
    }

    const markFailed = async (message: string) => {
      await ctx.supabaseAdmin
        .from("order_email_notifications")
        .update({ status: "failed", last_error: message.slice(0, 1_000), updated_at: new Date().toISOString() })
        .eq("order_id", payment.order_id);
    };

    const brevoApiKey = Deno.env.get("BREVO_API_KEY")?.trim();
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL")?.trim();
    const salesEmail = (Deno.env.get("SALES_NOTIFICATION_EMAIL") || Deno.env.get("SUPPORT_NOTIFICATION_EMAIL"))?.trim();
    if (!brevoApiKey || !senderEmail || !salesEmail || !emailPattern.test(salesEmail)) {
      const errorMessage = "Paid-order email secrets are incomplete";
      console.error(errorMessage);
      await markFailed(errorMessage);
      return Response.json({ error: "Order email notification is not configured" }, { status: 500 });
    }

    const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
      ctx.supabaseAdmin
        .from("orders")
        .select("id, order_number, customer_id, customer_email, customer_phone, subtotal_kes, delivery_fee_kes, total_kes, delivery_county, delivery_town, delivery_address")
        .eq("id", payment.order_id)
        .eq("payment_status", "paid")
        .single(),
      ctx.supabaseAdmin
        .from("order_items")
        .select("product_name, sku, color, size, unit_price_kes, quantity, line_total_kes")
        .eq("order_id", payment.order_id)
        .order("created_at", { ascending: true }),
    ]);

    if (orderError || itemsError || !order || !items?.length || !emailPattern.test(order.customer_email || "")) {
      const errorMessage = "Paid order details are incomplete";
      console.error(errorMessage, { orderId: payment.order_id, orderCode: orderError?.code, itemsCode: itemsError?.code });
      await markFailed(errorMessage);
      return Response.json({ error: "Paid order details are incomplete" }, { status: 500 });
    }

    const { data: customer } = order.customer_id
      ? await ctx.supabaseAdmin.from("customers").select("full_name").eq("id", order.customer_id).maybeSingle()
      : { data: null };
    const paidOrder: PaidOrder = {
      id: order.id,
      order_number: order.order_number,
      customer_name: customer?.full_name?.trim() || "Customer",
      customer_email: order.customer_email,
      customer_phone: order.customer_phone || "Not provided",
      subtotal_kes: order.subtotal_kes,
      delivery_fee_kes: order.delivery_fee_kes,
      total_kes: order.total_kes,
      delivery_county: order.delivery_county,
      delivery_town: order.delivery_town,
      delivery_address: order.delivery_address,
      paid_at: payment.paid_at || now,
      mpesa_receipt_number: payment.mpesa_receipt_number || "Not provided",
      items: items as PaidOrderItem[],
    };
    const emails = buildPaidOrderEmails(paidOrder);

    const response = await fetch(brevoEndpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "ANAI", email: senderEmail },
        subject: emails.customer.subject,
        textContent: emails.customer.textContent,
        htmlContent: emails.customer.htmlContent,
        messageVersions: [
          {
            to: [{ name: paidOrder.customer_name, email: paidOrder.customer_email }],
            subject: emails.customer.subject,
            textContent: emails.customer.textContent,
            htmlContent: emails.customer.htmlContent,
          },
          {
            to: [{ name: "ANAI Sales", email: salesEmail }],
            replyTo: { name: paidOrder.customer_name, email: paidOrder.customer_email },
            subject: emails.sales.subject,
            textContent: emails.sales.textContent,
            htmlContent: emails.sales.htmlContent,
          },
        ],
        headers: { "Idempotency-Key": paidOrder.id },
        tags: ["paid-order"],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const result = await response.json().catch(() => ({})) as {
      messageId?: string;
      messageIds?: string[];
      code?: string;
      message?: string;
    };
    const wasIdempotentDuplicate = result.code === "duplicate_parameter";
    const messageIds = result.messageIds || (result.messageId ? [result.messageId] : []);
    if ((!response.ok || !messageIds.length) && !wasIdempotentDuplicate) {
      const errorMessage = result.message || `Brevo returned ${response.status}`;
      console.error("Brevo paid-order notification failed", { orderId: paidOrder.id, status: response.status, code: result.code });
      await markFailed(errorMessage);
      return Response.json({ error: "Paid-order emails could not be sent" }, { status: 502 });
    }

    const sentAt = new Date().toISOString();
    const { error: sentUpdateError } = await ctx.supabaseAdmin
      .from("order_email_notifications")
      .update({ status: "sent", sent_at: sentAt, brevo_message_ids: messageIds, last_error: null, updated_at: sentAt })
      .eq("order_id", paidOrder.id);

    if (sentUpdateError) {
      console.error("Paid-order emails sent but status update failed", { orderId: paidOrder.id, code: sentUpdateError.code });
    }

    return Response.json({ sent: true, messageIds });
  }),
};
