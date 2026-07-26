export type SupportRequest = {
  id: string;
  request_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  category: string;
  order_reference: string | null;
  message: string;
  created_at: string;
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const displayValue = (value: string | null) => value?.trim() || "Not provided";

export const buildSupportEmail = (request: SupportRequest) => {
  const subject = `[${request.request_number}] New ${request.category} support request`;
  const fields = [
    ["Request", request.request_number],
    ["Category", request.category],
    ["Name", request.full_name],
    ["Email", request.email],
    ["Phone", displayValue(request.phone)],
    ["Order / M-Pesa reference", displayValue(request.order_reference)],
    ["Received", request.created_at],
  ];
  const textContent = [
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    request.message,
  ].join("\n");
  const detailRows = fields
    .map(([label, value]) => `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`)
    .join("");
  const htmlContent = `<!doctype html>
<html lang="en">
  <body style="font-family:Arial,sans-serif;color:#171717;line-height:1.5">
    <h1 style="font-size:22px">New support request</h1>
    <table style="border-collapse:collapse">${detailRows}</table>
    <h2 style="font-size:18px;margin-top:24px">Message</h2>
    <p style="white-space:pre-wrap">${escapeHtml(request.message)}</p>
  </body>
</html>`;

  return { subject, textContent, htmlContent };
};
