export type PaidOrderItem = {
  product_name: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  unit_price_kes: number;
  quantity: number;
  line_total_kes: number;
};

export type PaidOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal_kes: number;
  delivery_fee_kes: number;
  total_kes: number;
  delivery_county: string | null;
  delivery_town: string | null;
  delivery_address: string | null;
  paid_at: string;
  mpesa_receipt_number: string;
  items: PaidOrderItem[];
};

type EmailContent = {
  subject: string;
  textContent: string;
  htmlContent: string;
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const displayValue = (value: string | null | undefined) => value?.trim() || "Not provided";
const formatKes = (amount: number) => `KES ${Math.max(Math.round(amount), 0).toLocaleString("en-KE")}`;

const getDeliveryLabel = (order: PaidOrder) => {
  if (order.delivery_town === "Town pickup") return "Town pickup";

  return [order.delivery_address, order.delivery_town, order.delivery_county]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(", ") || "Delivery details to be confirmed";
};

const getItemDescription = (item: PaidOrderItem) => [
  item.color ? `Colour: ${item.color}` : "",
  item.size ? `Size: ${item.size}` : "",
  item.sku ? `SKU: ${item.sku}` : "",
].filter(Boolean).join(" · ");

const buildItemText = (items: PaidOrderItem[]) => items
  .map((item) => {
    const description = getItemDescription(item);
    return `${item.quantity} × ${item.product_name}${description ? ` (${description})` : ""} — ${formatKes(item.line_total_kes)}`;
  })
  .join("\n");

const buildItemsHtml = (items: PaidOrderItem[]) => items
  .map((item) => `<tr>
    <td style="padding:10px 12px 10px 0;border-bottom:1px solid #e8e1da">
      <strong>${escapeHtml(item.product_name)}</strong><br>
      <span style="color:#6f6863">${escapeHtml(getItemDescription(item) || "Standard item")}</span>
    </td>
    <td align="center" style="padding:10px 12px;border-bottom:1px solid #e8e1da">${item.quantity}</td>
    <td align="right" style="padding:10px 0 10px 12px;border-bottom:1px solid #e8e1da">${escapeHtml(formatKes(item.line_total_kes))}</td>
  </tr>`)
  .join("");

const buildTotalsHtml = (order: PaidOrder) => `
  <table style="width:100%;border-collapse:collapse;margin-top:18px">
    <tr><td style="padding:4px 0">Subtotal</td><td align="right">${escapeHtml(formatKes(order.subtotal_kes))}</td></tr>
    <tr><td style="padding:4px 0">Delivery</td><td align="right">${escapeHtml(formatKes(order.delivery_fee_kes))}</td></tr>
    <tr><td style="padding:8px 0 4px;font-weight:bold">Total paid</td><td align="right" style="font-weight:bold">${escapeHtml(formatKes(order.total_kes))}</td></tr>
  </table>`;

export const buildPaidOrderEmails = (order: PaidOrder): {
  customer: EmailContent;
  sales: EmailContent;
} => {
  const deliveryLabel = getDeliveryLabel(order);
  const itemText = buildItemText(order.items);
  const itemRows = buildItemsHtml(order.items);
  const customerSubject = `Order ${order.order_number} confirmed`;
  const customerText = [
    `Hi ${order.customer_name},`,
    "",
    "Your ANAI payment is confirmed. Here is what you purchased:",
    "",
    itemText,
    "",
    `Subtotal: ${formatKes(order.subtotal_kes)}`,
    `Delivery: ${formatKes(order.delivery_fee_kes)}`,
    `Total paid: ${formatKes(order.total_kes)}`,
    `Delivery / pickup: ${deliveryLabel}`,
    `M-Pesa receipt: ${order.mpesa_receipt_number}`,
    `Order reference: ${order.order_number}`,
    "",
    "We will contact you with the next delivery or pickup update.",
  ].join("\n");
  const customerHtml = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:Arial,sans-serif;color:#171717;line-height:1.5">
    <div style="max-width:640px;margin:0 auto">
      <h1 style="font-size:26px;margin:0 0 12px">Payment confirmed</h1>
      <p>Hi ${escapeHtml(order.customer_name)},</p>
      <p>Your ANAI order has been paid successfully. Here is what you purchased:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:18px">
        <thead><tr><th align="left">Product</th><th align="center">Qty</th><th align="right">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${buildTotalsHtml(order)}
      <p><strong>Delivery / pickup:</strong> ${escapeHtml(deliveryLabel)}</p>
      <p><strong>M-Pesa receipt:</strong> ${escapeHtml(order.mpesa_receipt_number)}<br>
      <strong>Order reference:</strong> ${escapeHtml(order.order_number)}</p>
      <p>We will contact you with the next delivery or pickup update.</p>
    </div>
  </body>
</html>`;

  const salesSubject = `[PAID] ${order.order_number} — ${formatKes(order.total_kes)}`;
  const salesText = [
    "A new ANAI order has been paid.",
    "",
    `Order: ${order.order_number}`,
    `Customer: ${order.customer_name}`,
    `Email: ${order.customer_email}`,
    `Phone: ${order.customer_phone}`,
    `M-Pesa receipt: ${order.mpesa_receipt_number}`,
    `Paid at: ${order.paid_at}`,
    `Delivery / pickup: ${deliveryLabel}`,
    "",
    "Products:",
    itemText,
    "",
    `Subtotal: ${formatKes(order.subtotal_kes)}`,
    `Delivery: ${formatKes(order.delivery_fee_kes)}`,
    `Total paid: ${formatKes(order.total_kes)}`,
  ].join("\n");
  const salesHtml = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:Arial,sans-serif;color:#171717;line-height:1.5">
    <div style="max-width:680px;margin:0 auto">
      <h1 style="font-size:26px;margin:0 0 12px">New paid order</h1>
      <p><strong>Order:</strong> ${escapeHtml(order.order_number)}<br>
      <strong>Customer:</strong> ${escapeHtml(order.customer_name)}<br>
      <strong>Email:</strong> ${escapeHtml(order.customer_email)}<br>
      <strong>Phone:</strong> ${escapeHtml(order.customer_phone)}<br>
      <strong>M-Pesa receipt:</strong> ${escapeHtml(order.mpesa_receipt_number)}<br>
      <strong>Paid at:</strong> ${escapeHtml(order.paid_at)}<br>
      <strong>Delivery / pickup:</strong> ${escapeHtml(deliveryLabel)}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:18px">
        <thead><tr><th align="left">Product</th><th align="center">Qty</th><th align="right">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${buildTotalsHtml(order)}
    </div>
  </body>
</html>`;

  return {
    customer: { subject: customerSubject, textContent: customerText, htmlContent: customerHtml },
    sales: { subject: salesSubject, textContent: salesText, htmlContent: salesHtml },
  };
};
