const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const FROM = process.env.EMAIL_FROM || '"ShopKart" <noreply@shopkart.com>';

// ── Shared layout wrapper ────────────────────────────────
const layout = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(0,0,0,.07);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#F0522B,#ff8c66);padding:28px 36px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-.03em;">ShopKart</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px 36px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background:#f9fafb;padding:18px 36px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} ShopKart · All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

// ── Order Confirmation Email ─────────────────────────────
const sendOrderConfirmation = async ({ to, name, order, items }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`📧 [CONSOLE] Order confirmation for ${to} — Order #${order.order_number}`);
    return;
  }

  const itemRows = (items || []).map(i => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">${i.product_name}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center;">${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:right;font-weight:700;">₹${Number(i.subtotal).toLocaleString('en-IN')}</td>
    </tr>`).join('');

  const deliveryDate = order.estimated_delivery
    ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Within 5–7 days';

  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 6px;">Order Confirmed! 🎉</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Hi ${name || 'there'}, your order has been placed successfully.</p>

    <!-- Order Meta -->
    <div style="background:#fff7f5;border:1px solid rgba(240,82,43,.2);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;">Order Number</span>
        <span style="font-size:13px;font-weight:800;color:#F0522B;font-family:monospace;">#${order.order_number}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;">Payment</span>
        <span style="font-size:13px;font-weight:700;color:#111827;">${(order.payment_method || 'COD').toUpperCase()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:#6b7280;">Estimated Delivery</span>
        <span style="font-size:13px;font-weight:700;color:#111827;">${deliveryDate}</span>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Item</th>
          <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Qty</th>
          <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Price Breakdown -->
    <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;">Subtotal</span>
        <span style="font-size:13px;color:#374151;">₹${Number(order.subtotal).toLocaleString('en-IN')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;">Shipping</span>
        <span style="font-size:13px;color:${order.shipping_amount > 0 ? '#374151' : '#16a34a'};">${order.shipping_amount > 0 ? '₹' + Number(order.shipping_amount).toLocaleString('en-IN') : 'FREE'}</span>
      </div>
      ${Number(order.tax_amount) > 0 ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;">Tax (GST)</span>
        <span style="font-size:13px;color:#374151;">₹${Number(order.tax_amount).toLocaleString('en-IN')}</span>
      </div>` : ''}
      <div style="border-top:1px solid #e5e7eb;padding-top:10px;margin-top:4px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:15px;font-weight:800;color:#111827;">Total Paid</span>
        <span style="font-size:20px;font-weight:800;color:#F0522B;">₹${Number(order.total_amount).toLocaleString('en-IN')}</span>
      </div>
    </div>

    <!-- Shipping Address -->
    <div style="margin-bottom:24px;">
      <h4 style="font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 10px;">Shipping To</h4>
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.7;">
        <strong>${order.shipping_full_name}</strong><br>
        ${order.shipping_address_line1}${order.shipping_address_line2 ? ', ' + order.shipping_address_line2 : ''}<br>
        ${order.shipping_city}, ${order.shipping_state} – ${order.shipping_postal_code}
      </p>
    </div>

    <p style="font-size:13px;color:#6b7280;margin:0;">You can track your order anytime from <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/orders" style="color:#F0522B;font-weight:700;">My Orders</a>.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order Confirmed — #${order.order_number} | ShopKart`,
    html: layout(content),
    text: `Hi ${name}, your order #${order.order_number} has been confirmed. Total: ₹${Number(order.total_amount).toLocaleString('en-IN')}. Estimated delivery: ${deliveryDate}.`,
  });

  console.log(`📧 Order confirmation sent to ${to}`);
};

// ── Order Cancellation Email ─────────────────────────────
const sendOrderCancellation = async ({ to, name, order, reason }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`📧 [CONSOLE] Order cancellation for ${to} — Order #${order.order_number}`);
    return;
  }

  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 6px;">Order Cancelled</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Hi ${name || 'there'}, your order has been cancelled as requested.</p>

    <div style="background:#fef2f2;border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;">Order Number</span>
        <span style="font-size:13px;font-weight:800;color:#ef4444;font-family:monospace;">#${order.order_number}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;">Amount</span>
        <span style="font-size:13px;font-weight:700;color:#111827;">₹${Number(order.total_amount).toLocaleString('en-IN')}</span>
      </div>
      ${reason ? `
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:#6b7280;">Reason</span>
        <span style="font-size:13px;color:#374151;">${reason}</span>
      </div>` : ''}
    </div>

    <p style="font-size:14px;color:#374151;margin:0 0 16px;">If you paid online, the refund will be processed within <strong>5–7 business days</strong> to your original payment method.</p>
    <p style="font-size:13px;color:#6b7280;margin:0;">Questions? Reply to this email or visit <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/orders" style="color:#F0522B;font-weight:700;">My Orders</a>.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order Cancelled — #${order.order_number} | ShopKart`,
    html: layout(content),
    text: `Hi ${name}, your order #${order.order_number} has been cancelled. Amount: ₹${Number(order.total_amount).toLocaleString('en-IN')}.`,
  });

  console.log(`📧 Order cancellation sent to ${to}`);
};

module.exports = { sendOrderConfirmation, sendOrderCancellation };
