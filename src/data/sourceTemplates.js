// Civilian examples for the design walkthrough. The SJT curriculum is military.
export const CIVILIAN_SOURCE_TEMPLATES = [
  {
    curriculum_scenario_id: "civilian-language-001", domainType: "Civilian",
    category: "Sex", subcategory: "Workplace language", item_number: "1",
    document_id: "civilian-design-examples",
    scenario_text: "An employee reports that their supervisor repeatedly uses demeaning language in team meetings. They are worried that raising the concern will affect their upcoming performance review and want to understand their options.",
  },
  {
    curriculum_scenario_id: "civilian-religion-001", domainType: "Civilian",
    category: "Religion", subcategory: "Religious accommodation", item_number: "1",
    document_id: "civilian-design-examples",
    scenario_text: "An employee says a request to adjust their schedule for a religious observance was dismissed without discussion. They want a fair review and are concerned about being treated differently by their manager.",
  },
  {
    curriculum_scenario_id: "civilian-race-001", domainType: "Civilian",
    category: "Race", subcategory: "Work assignments", item_number: "1",
    document_id: "civilian-design-examples",
    scenario_text: "An employee believes race has influenced how high-visibility assignments are distributed. A colleague witnessed the assignment discussion, while the supervisor says the decision reflected project experience.",
  },
];

export function sourceDomain(source) {
  return source?.domainType || "Military";
}
