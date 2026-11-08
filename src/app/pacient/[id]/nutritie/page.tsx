import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { NutritionPage } from "@/components/nutrition/nutrition-page";
import { getNutritionPageData } from "@/lib/data/nutrition";
import { toIsoDate } from "@/lib/data/mappers";
import { addDays } from "@/lib/nutrition/dates";
import { REACTION_WINDOW_DAYS } from "@/lib/nutrition/summary";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function NutritiePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă jurnalul de nutriție…
        </main>
      }
    >
      <NutritionContent params={params} />
    </Suspense>
  );
}

async function NutritionContent({ params }: PageProps) {
  const { id } = await params;
  await connection();

  // Ziua locală a utilizatorului poate diferi de ziua UTC de pe server cu o zi în orice
  // direcție, deci încărcăm o zi în plus la ambele capete. Fereastra acoperă și cele 30
  // de zile din secțiunea „Reacții recente”.
  const serverToday = toIsoDate(new Date());
  const data = await getNutritionPageData(id, {
    from: addDays(serverToday, -REACTION_WINDOW_DAYS),
    to: addDays(serverToday, 1),
  });

  if (!data) {
    notFound();
  }

  return <NutritionPage data={data} />;
}
