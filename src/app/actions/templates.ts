"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { isDayType, ASSIGNABLE_DAY_TYPES, type DayType } from "@/lib/constants";

/// Confirms the template belongs to the current user; returns the user id.
async function assertOwner(templateId: string): Promise<string> {
  const user = await requireUser();
  const owned = await db.checklistTemplate.findFirst({
    where: { id: templateId, userId: user.id },
    select: { id: true },
  });
  if (!owned) redirect("/checklists");
  return user.id;
}

const nameSchema = z.string().trim().min(1, "Give it a name.").max(80);

export async function createTemplate(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return;

  const count = await db.checklistTemplate.count({ where: { userId: user.id } });
  const created = await db.checklistTemplate.create({
    data: { userId: user.id, name: parsed.data, order: count },
  });
  revalidatePath("/checklists");
  redirect(`/checklists/${created.id}`);
}

export async function updateTemplateMeta(formData: FormData): Promise<void> {
  const templateId = String(formData.get("templateId"));
  await assertOwner(templateId);

  const name = nameSchema.safeParse(formData.get("name"));
  if (!name.success) return;

  await db.checklistTemplate.update({
    where: { id: templateId },
    data: { name: name.data },
  });
  revalidatePath(`/checklists/${templateId}`);
  revalidatePath("/checklists");
}

export async function archiveTemplate(formData: FormData): Promise<void> {
  const templateId = String(formData.get("templateId"));
  await assertOwner(templateId);
  await db.checklistTemplate.update({
    where: { id: templateId },
    data: { isArchived: true },
  });
  // Clean up day-type assignments pointing at it.
  await db.dayTypeAssignment.deleteMany({ where: { templateId } });
  revalidatePath("/checklists");
  redirect("/checklists");
}

export async function addItem(formData: FormData): Promise<void> {
  const templateId = String(formData.get("templateId"));
  await assertOwner(templateId);
  const label = z.string().trim().min(1).max(200).safeParse(formData.get("label"));
  if (!label.success) return;

  const count = await db.checklistItem.count({
    where: { templateId, isArchived: false },
  });
  await db.checklistItem.create({
    data: { templateId, label: label.data, order: count },
  });
  revalidatePath(`/checklists/${templateId}`);
}

export async function updateItem(formData: FormData): Promise<void> {
  const templateId = String(formData.get("templateId"));
  await assertOwner(templateId);
  const itemId = String(formData.get("itemId"));
  const label = z.string().trim().min(1).max(200).safeParse(formData.get("label"));
  if (!label.success) return;

  await db.checklistItem.updateMany({
    where: { id: itemId, templateId },
    data: { label: label.data },
  });
  revalidatePath(`/checklists/${templateId}`);
}

/// Copies one or more existing item labels (from the user's other checklists)
/// onto this template, skipping any it already has. Appended in order.
export async function addExistingItems(formData: FormData): Promise<void> {
  const templateId = String(formData.get("templateId"));
  await assertOwner(templateId);

  const labels = formData
    .getAll("labels")
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0 && v.length <= 200)
    .slice(0, 200);
  if (labels.length === 0) return;

  const existing = await db.checklistItem.findMany({
    where: { templateId, isArchived: false },
    select: { label: true },
  });
  const have = new Set(existing.map((e) => e.label));
  const toAdd = [...new Set(labels)].filter((l) => !have.has(l));
  if (toAdd.length === 0) return;

  let order = await db.checklistItem.count({
    where: { templateId, isArchived: false },
  });
  await db.$transaction(
    toAdd.map((label) =>
      db.checklistItem.create({ data: { templateId, label, order: order++ } }),
    ),
  );
  revalidatePath(`/checklists/${templateId}`);
}

/// Persists a new item order (from drag-and-drop).
export async function reorderItems(
  templateId: string,
  orderedIds: string[],
): Promise<void> {
  await assertOwner(templateId);
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.checklistItem.updateMany({
        where: { id, templateId },
        data: { order: index },
      }),
    ),
  );
  revalidatePath(`/checklists/${templateId}`);
}

export async function deleteItem(formData: FormData): Promise<void> {
  const templateId = String(formData.get("templateId"));
  await assertOwner(templateId);
  const itemId = String(formData.get("itemId"));
  await db.checklistItem.updateMany({
    where: { id: itemId, templateId },
    data: { isArchived: true },
  });
  revalidatePath(`/checklists/${templateId}`);
}

/// Replace the set of day-types this template is assigned to. Because each
/// day-type maps to at most one template, assigning here moves the day-type
/// off any other template.
export async function setAssignments(formData: FormData): Promise<void> {
  const templateId = String(formData.get("templateId"));
  const userId = await assertOwner(templateId);

  const selected = formData
    .getAll("dayTypes")
    .map(String)
    .filter((d): d is DayType => isDayType(d));
  const selectedSet = new Set(selected);

  await db.$transaction(async (tx) => {
    // Assign selected day-types to this template (move if needed).
    for (const dayType of ASSIGNABLE_DAY_TYPES) {
      if (selectedSet.has(dayType)) {
        await tx.dayTypeAssignment.upsert({
          where: { userId_dayType: { userId, dayType } },
          create: { userId, dayType, templateId },
          update: { templateId },
        });
      } else {
        // Unassign this day-type only if it currently points here.
        await tx.dayTypeAssignment.deleteMany({
          where: { userId, dayType, templateId },
        });
      }
    }
  });

  revalidatePath(`/checklists/${templateId}`);
  revalidatePath("/checklists");
}
