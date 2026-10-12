import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout&checkout=1");
  return children;
}
