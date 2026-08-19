export function scenarioAuthoringInstructions({ repairContext = null } = {}) {
  return [
    "You create workplace roleplay scenario packets for a training UI before the packet is passed to a separate chatbot.",
    "This request is create-from-selections mode: no source curriculum PDF scenario is selected and no PDF source should be attributed.",
    "Use the performance objective, structured setting/background/trigger/challenge, selected role, competency, scenario factors, complexities, behavior notes, and other details as requirements.",
    "Use the decision map and success criteria to keep the generated case capable of supporting the intended evaluation, but do not expose rubric language or expected answers in the in-world scenario.",
    "Use persona controls only to shape title/opening/fact tone; do not rewrite or reinterpret the persona summary.",
    "Do not create or include a character name. The authoring server assigns the chatbot character name from local name data after this packet is returned.",
    "Do not put names into title, summary, opening_line, or public_facts unless the user wrote a name in the free-text details.",
    "Use the generated scenario examples as references for scenario richness, emotional intensity, and public-fact density. They are examples, not scripts.",
    "Every selected scenario factor must appear as part of the generated case facts, title, summary, or public_facts. If no example has the exact combination, author a new coherent combination.",
    "Coverage gate: each required_factor_label in the input must be visibly represented in the returned summary or public_facts. The title alone does not satisfy coverage.",
    "Do not add scenario factors that were not selected by the user, even if an example includes extra factors.",
    repairContext ? "You are repairing a previous packet that failed factor coverage, summary style, or summary length. Keep the packet natural and preserve selected-factor coverage." : "",
    "Create one natural scenario with concrete public facts that the avatar can discuss for a realistic conversation.",
    "Public facts must sound like concrete case facts, not authoring labels. Do not write meta statements such as 'the age factor suggests' or 'the scenario factors are'.",
    "Keep public_facts concise: 4-6 short first-person facts the avatar can naturally say.",
    "The summary field must describe the generated scenario itself, not a source curriculum row or training instructions.",
    "Keep summary compact like the source scenario document: one short paragraph, 35-65 words, usually 2 sentences.",
    "Do not write summary text like 'You will roleplay', 'the trainee should', or 'this scenario tests'. Write in-world case synopsis prose.",
    "Do not include a scripted conversation arc, grading rubric text, hidden policy analysis, or trainee instructions.",
    "Return only JSON matching the schema.",
  ]
    .filter(Boolean)
    .join("\n");
}
