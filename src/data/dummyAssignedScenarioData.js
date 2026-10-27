// Placeholder assignment records. In production, replace this list with the
// scenarios assigned to the signed-in user by the assignment service.
const DUMMY_ASSIGNMENTS = [
  { assignmentId: "assignment-1042", catalogIndex: 2, activityLabel: "Assigned today", assignedBy: "Morgan Lee" },
  { assignmentId: "assignment-1038", catalogIndex: 5, activityLabel: "Assigned yesterday", assignedBy: "Morgan Lee" },
  { assignmentId: "assignment-1029", catalogIndex: 8, activityLabel: "Assigned 3 days ago", assignedBy: "Taylor Brooks" },
  { assignmentId: "assignment-1017", catalogIndex: 11, activityLabel: "Assigned 1 week ago", assignedBy: "Taylor Brooks" },
];

export function assignedScenariosFromCatalog(scenarios) {
  if (!scenarios.length) return [];

  return DUMMY_ASSIGNMENTS.map((assignment, fallbackIndex) => {
    const scenario = scenarios[assignment.catalogIndex] || scenarios[fallbackIndex];
    if (!scenario) return null;
    return {
      ...scenario,
      assignmentId: assignment.assignmentId,
      activityLabel: assignment.activityLabel,
      assignedBy: assignment.assignedBy,
    };
  }).filter(Boolean);
}
