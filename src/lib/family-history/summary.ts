import { conditionLabel } from "@/lib/family-history/conditions";
import {
  FAMILY_RELATIONS,
  RELATION_SHORT,
  type FamilyMember,
  type FamilyRiskFactor,
  type FamilyRiskSummary,
} from "@/lib/family-history/types";

/** „a”, „a și b”, „a, b și c”. */
function joinRo(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} și ${items[items.length - 1]}`;
}

/**
 * Construiește rezumatul „Factori de risc familiali identificați”.
 * Grupează după afecțiune și ordonează rudele după gradul de rudenie (părinți primii).
 * Nu interpretează riscul – doar sintetizează ce a declarat părintele.
 */
export function buildFamilyRiskSummary(
  childProfileId: string,
  members: FamilyMember[],
  now: Date = new Date(),
): FamilyRiskSummary {
  const byKey = new Map<string, FamilyRiskFactor>();
  const order = (relation: FamilyMember["relation"]) => FAMILY_RELATIONS.indexOf(relation);
  const sorted = [...members].sort((a, b) => order(a.relation) - order(b.relation));

  for (const member of sorted) {
    if (member.conditionsStatus !== "known") continue;
    for (const condition of member.conditions) {
      const label = conditionLabel(condition.code, condition.customLabel);
      // „Altele” cu descrieri diferite sunt factori diferiți.
      const key = condition.code === "other" ? `other:${label.toLowerCase()}` : condition.code;
      const factor = byKey.get(key) ?? { code: condition.code, label, relatives: [], sentence: "" };
      factor.relatives.push({ relation: member.relation, onsetAge: condition.onsetAge, note: condition.note });
      byKey.set(key, factor);
    }
  }

  const factors = [...byKey.values()].map((factor) => {
    const relatives = factor.relatives.map((relative) =>
      relative.onsetAge == null ? RELATION_SHORT[relative.relation] : `${RELATION_SHORT[relative.relation]} (debut la ${relative.onsetAge} ani)`,
    );
    return { ...factor, sentence: `${factor.label} la ${joinRo(relatives)}` };
  });
  // Afecțiunile prezente la mai multe rude apar primele.
  factors.sort((a, b) => b.relatives.length - a.relatives.length || a.label.localeCompare(b.label, "ro"));

  const membersUnknown = members.filter((member) => member.conditionsStatus === "unknown").length;
  const lines = factors.map((factor) => `- ${factor.sentence}.`);
  const text =
    factors.length === 0
      ? "Istoric medical familial: nu au fost declarați factori de risc."
      : `Istoric medical familial (declarat de părinte, neverificat medical):\n${lines.join("\n")}`;

  return {
    childProfileId,
    generatedAt: now.toISOString(),
    factors,
    membersRecorded: members.length,
    membersUnknown,
    text:
      membersUnknown > 0
        ? `${text}\nIstoric necunoscut pentru ${membersUnknown === 1 ? "un membru al familiei" : `${membersUnknown} membri ai familiei`}.`
        : text,
  };
}
