import { fetchProductsAdmin } from "@/lib/supabase-products";
import { isAdminAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/admin/cms/LoginForm";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminInternalPage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string; error?: string }>;
}) {
  const authed = await isAdminAuthenticated();
  const params = await searchParams;

  if (!authed) {
    return <LoginForm showError={params.error === "1"} />;
  }

  const products = await fetchProductsAdmin();
  return <AdminShell initialProducts={products} />;
}
