import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ chat?: string; tab?: string }>;
};

export default async function MedicConsultatiiLegacyRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.chat) {
    query.set("chat", params.chat);
  }
  if (params.tab) {
    query.set("tab", params.tab);
  }
  const suffix = query.toString();
  redirect(suffix.length > 0 ? `/medic/consultatii?${suffix}` : "/medic/consultatii");
}
