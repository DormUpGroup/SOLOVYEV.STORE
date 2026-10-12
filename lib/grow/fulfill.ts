import { createServiceClient } from "@/utils/supabase/admin";
import { orderChargeAmount } from "@/lib/checkout/shipping";
import {
  approveGrowTransaction,
  expandUuid,
  flattenGrowCallback,
  growCallbackData,
  isGrowApiConfigured,
  isGrowPaymentApproved,
  type GrowCallbackPayload,
} from "@/lib/grow/client";
import { approveMakeGrowTransaction } from "@/lib/grow/make";

type OrderPaymentRow = {
  id: string;
  user_id: string;
  order_ref: string;
  status: string;
  subtotal: number | string;
  shipping_amount: number | string | null;
  grow_process_token: string | null;
};

function amountsMatch(expected: number, charged: number | undefined): boolean {
  if (charged == null || Number.isNaN(Number(charged))) return true;
  return Math.abs(Number(charged) - expected) < 0.51;
}

async function findOrder(
  admin: ReturnType<typeof createServiceClient>,
  payload: GrowCallbackPayload,
) {
  const data = growCallbackData(payload);
  const processToken = String(data.processToken ?? "").trim();
  if (processToken) {
    const byToken = await admin
      .from("orders")
      .select("id,user_id,order_ref,status,subtotal,shipping_amount,grow_process_token")
      .eq("grow_process_token", processToken)
      .maybeSingle();
    if (byToken.data) return byToken;
  }

  const processId = String(data.processId ?? "").trim();
  if (processId) {
    const byProcess = await admin
      .from("orders")
      .select("id,user_id,order_ref,status,subtotal,shipping_amount,grow_process_token")
      .eq("grow_process_id", processId)
      .maybeSingle();
    if (byProcess.data) return byProcess;
  }

  const orderRef = String(data.customFields?.cField2 ?? data.cField2 ?? "").trim();
  if (orderRef.startsWith("SS-")) {
    const byRef = await admin
      .from("orders")
      .select("id,user_id,order_ref,status,subtotal,shipping_amount,grow_process_token")
      .eq("order_ref", orderRef)
      .maybeSingle();
    if (byRef.data) return byRef;
  }

  const compactOrderId = String(data.customFields?.cField1 ?? data.cField1 ?? "").trim();
  const orderId = expandUuid(compactOrderId);
  if (orderId) {
    return admin
      .from("orders")
      .select("id,user_id,order_ref,status,subtotal,shipping_amount,grow_process_token")
      .eq("id", orderId)
      .maybeSingle();
  }

  return { data: null, error: null };
}

export async function fulfillGrowCallback(
  payload: GrowCallbackPayload,
): Promise<{ ok: boolean; orderRef?: string; error?: string }> {
  if (!isGrowPaymentApproved(payload)) {
    return { ok: false, error: "Payment not approved" };
  }

  const admin = createServiceClient();
  const { data: order, error } = await findOrder(admin, payload);
  if (error) return { ok: false, error: error.message };
  if (!order) return { ok: false, error: "Order not found" };

  const row = order as OrderPaymentRow;
  const data = growCallbackData(payload);
  const expected = orderChargeAmount(Number(row.subtotal), Number(row.shipping_amount ?? 0));
  const charged = data.sum != null ? Number(data.sum) : undefined;
  if (!amountsMatch(expected, charged)) {
    return { ok: false, error: "Payment amount mismatch" };
  }

  if (row.status !== "paid" && row.status !== "shipped" && row.status !== "completed") {
    if (row.status === "cancelled") return { ok: false, error: "Order cancelled" };
    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        grow_status: String(data.statusCode ?? data.status ?? "2"),
        grow_transaction_id: data.transactionId ? String(data.transactionId) : null,
        card_last4: data.cardSuffix ? String(data.cardSuffix).slice(-4) : null,
      })
      .eq("id", row.id)
      .in("status", ["pending_payment", "pending_whatsapp", "in_chat"]);
    if (updateError) return { ok: false, error: updateError.message };
  }

  const callbackFields = flattenGrowCallback(payload);
  if (isGrowApiConfigured()) await approveGrowTransaction(callbackFields);
  else await approveMakeGrowTransaction(callbackFields);
  return { ok: true, orderRef: row.order_ref };
}

export async function confirmGrowOrder(
  orderRef: string,
  options?: { expectedUserId?: string },
): Promise<{ ok: boolean; pending?: boolean; orderRef?: string; error?: string }> {
  const admin = createServiceClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id,user_id,order_ref,status")
    .eq("order_ref", orderRef)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!order) return { ok: false, error: "Order not found" };
  if (options?.expectedUserId && order.user_id !== options.expectedUserId) {
    return { ok: false, error: "Order not found" };
  }
  if (order.status === "paid" || order.status === "shipped" || order.status === "completed") {
    return { ok: true, orderRef: order.order_ref };
  }
  if (order.status === "cancelled") return { ok: false, error: "Order cancelled" };
  return { ok: false, pending: true, orderRef: order.order_ref, error: "Payment pending" };
}
