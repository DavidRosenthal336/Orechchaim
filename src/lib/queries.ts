import "server-only";
import { db } from "@/lib/db";

/// All non-archived templates for a user, with items and day-type assignments.
export async function getTemplatesForUser(userId: string) {
  return db.checklistTemplate.findMany({
    where: { userId, isArchived: false },
    orderBy: { order: "asc" },
    include: {
      items: {
        where: { isArchived: false },
        orderBy: { order: "asc" },
      },
      assignments: true,
      _count: { select: { items: { where: { isArchived: false } } } },
    },
  });
}

/// A single template owned by the user, or null. Includes items + assignments.
export async function getTemplateForUser(userId: string, templateId: string) {
  return db.checklistTemplate.findFirst({
    where: { id: templateId, userId, isArchived: false },
    include: {
      items: {
        where: { isArchived: false },
        orderBy: { order: "asc" },
      },
      assignments: true,
    },
  });
}

/// Map of dayType -> templateId for a user (which checklist each day uses).
export async function getAssignmentsForUser(userId: string) {
  const rows = await db.dayTypeAssignment.findMany({ where: { userId } });
  return new Map(rows.map((r) => [r.dayType, r.templateId]));
}
