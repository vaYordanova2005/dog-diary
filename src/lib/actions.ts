"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MAX_FILE_BYTES, classifyFile, cloudinary, destroyFiles } from "@/lib/cloudinary";
import { validateFile } from "@/lib/fileTypes";
import { requireUser } from "@/lib/session";

async function ensureCanDelete() {
  const session = await requireUser();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "DOCTOR" && role !== "ADMIN") {
    throw new Error("Only a doctor or admin can delete records.");
  }
}

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

// For update: an empty field must clear the old value (null), not keep it
function strOrNull(formData: FormData, key: string): string | null {
  return str(formData, key) ?? null;
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// For update: an empty date must clear the old value (null)
function toDateOrNull(value: string | undefined): Date | null {
  return toDate(value) ?? null;
}

// ---------- Dog + owner ----------

export async function createDog(formData: FormData) {
  await requireUser();
  const dogName = str(formData, "dogName");
  if (!dogName) throw new Error("The dog's name is required.");

  const ownerId = str(formData, "ownerId");
  const newOwnerName = str(formData, "newOwnerName");

  let resolvedOwnerId = ownerId;

  if (!resolvedOwnerId) {
    if (!newOwnerName) {
      // The form checks this before submitting; this is only a fallback guard
      redirect("/dogs/new?error=owner");
    }
    const owner = await prisma.owner.create({
      data: {
        name: newOwnerName,
        phone: str(formData, "newOwnerPhone"),
        email: str(formData, "newOwnerEmail"),
        address: str(formData, "newOwnerAddress"),
      },
    });
    resolvedOwnerId = owner.id;
  }

  const dog = await prisma.dog.create({
    data: {
      name: dogName,
      species: str(formData, "species") ?? "Dog",
      breed: str(formData, "breed"),
      gender: (str(formData, "gender") as "MALE" | "FEMALE" | "UNKNOWN") ?? "UNKNOWN",
      birthDate: toDate(str(formData, "birthDate")),
      weightKg: str(formData, "weightKg") ? Number(str(formData, "weightKg")) : undefined,
      chipNumber: str(formData, "chipNumber"),
      notes: str(formData, "notes"),
      ownerId: resolvedOwnerId,
    },
  });

  revalidatePath("/");
  redirect(`/dogs/${dog.id}`);
}

export async function updateDog(dogId: string, formData: FormData) {
  await requireUser();
  const dogName = str(formData, "dogName");
  if (!dogName) throw new Error("The dog's name is required.");
  const weightKgStr = str(formData, "weightKg");

  await prisma.dog.update({
    where: { id: dogId },
    data: {
      name: dogName,
      birthDate: toDateOrNull(str(formData, "birthDate")),
      species: str(formData, "species") ?? "Dog",
      breed: strOrNull(formData, "breed"),
      gender: (str(formData, "gender") as "MALE" | "FEMALE" | "UNKNOWN") ?? "UNKNOWN",
      weightKg: weightKgStr ? Number(weightKgStr) : null,
      chipNumber: strOrNull(formData, "chipNumber"),
      notes: strOrNull(formData, "notes"),
    },
  });

  revalidatePath(`/dogs/${dogId}`);
  revalidatePath("/");
}

export async function updateOwner(dogId: string, formData: FormData) {
  await requireUser();
  const ownerId = str(formData, "ownerId");
  if (!ownerId) throw new Error("Missing owner.");
  const name = str(formData, "name");
  if (!name) throw new Error("The owner's name is required.");

  await prisma.owner.update({
    where: { id: ownerId },
    data: {
      name,
      phone: strOrNull(formData, "phone"),
      email: strOrNull(formData, "email"),
      address: strOrNull(formData, "address"),
    },
  });

  revalidatePath(`/dogs/${dogId}`);
}

export async function deleteDog(dogId: string) {
  await ensureCanDelete();
  // The files are in Cloudinary, the database doesn't delete them by itself — we remove them before the profile
  const attachments = await prisma.attachment.findMany({ where: { dogId } });
  await destroyFiles(attachments);
  await prisma.dog.delete({ where: { id: dogId } });
  revalidatePath("/");
  redirect("/");
}

// ---------- Medical examinations ----------

export async function addMedicalRecord(dogId: string, formData: FormData) {
  await requireUser();
  const title = str(formData, "title");
  if (!title) throw new Error("The title is required.");

  await prisma.medicalRecord.create({
    data: {
      dogId,
      title,
      description: str(formData, "description"),
      vetName: str(formData, "vetName"),
      date: toDate(str(formData, "date")) ?? new Date(),
    },
  });

  revalidatePath(`/dogs/${dogId}`);
}

export async function updateMedicalRecord(dogId: string, recordId: string, formData: FormData) {
  await requireUser();
  const title = str(formData, "title");
  const date = toDate(str(formData, "date"));
  if (!title || !date) throw new Error("The title and date are required.");

  await prisma.medicalRecord.update({
    where: { id: recordId },
    data: {
      title,
      description: strOrNull(formData, "description"),
      vetName: strOrNull(formData, "vetName"),
      date,
    },
  });

  revalidatePath(`/dogs/${dogId}`);
}

export async function deleteMedicalRecord(dogId: string, recordId: string) {
  await ensureCanDelete();
  await prisma.medicalRecord.delete({ where: { id: recordId } });
  revalidatePath(`/dogs/${dogId}`);
}

// ---------- Vaccinations ----------

export async function addVaccination(dogId: string, formData: FormData) {
  await requireUser();
  const name = str(formData, "name");
  const dateGiven = toDate(str(formData, "dateGiven"));
  if (!name || !dateGiven) throw new Error("The vaccine name and date are required.");

  await prisma.vaccination.create({
    data: {
      dogId,
      name,
      dateGiven,
      nextDueDate: toDate(str(formData, "nextDueDate")),
      notes: str(formData, "notes"),
    },
  });

  revalidatePath(`/dogs/${dogId}`);
}

export async function updateVaccination(
  dogId: string,
  vaccinationId: string,
  formData: FormData,
) {
  await requireUser();
  const name = str(formData, "name");
  const dateGiven = toDate(str(formData, "dateGiven"));
  if (!name || !dateGiven) throw new Error("The vaccine name and date are required.");

  await prisma.vaccination.update({
    where: { id: vaccinationId },
    data: {
      name,
      dateGiven,
      nextDueDate: toDateOrNull(str(formData, "nextDueDate")),
      notes: strOrNull(formData, "notes"),
    },
  });

  revalidatePath(`/dogs/${dogId}`);
}

export async function deleteVaccination(dogId: string, vaccinationId: string) {
  await ensureCanDelete();
  await prisma.vaccination.delete({ where: { id: vaccinationId } });
  revalidatePath(`/dogs/${dogId}`);
}

// ---------- Medications ----------

export async function addMedication(dogId: string, formData: FormData) {
  await requireUser();
  const name = str(formData, "name");
  if (!name) throw new Error("The medication name is required.");

  await prisma.medication.create({
    data: {
      dogId,
      name,
      dosage: str(formData, "dosage"),
      startDate: toDate(str(formData, "startDate")) ?? new Date(),
      endDate: toDate(str(formData, "endDate")),
      notes: str(formData, "notes"),
    },
  });

  revalidatePath(`/dogs/${dogId}`);
}

export async function updateMedication(dogId: string, medicationId: string, formData: FormData) {
  await requireUser();
  const name = str(formData, "name");
  const startDate = toDate(str(formData, "startDate"));
  if (!name || !startDate) throw new Error("The name and start date are required.");

  await prisma.medication.update({
    where: { id: medicationId },
    data: {
      name,
      dosage: strOrNull(formData, "dosage"),
      startDate,
      endDate: toDateOrNull(str(formData, "endDate")),
      notes: strOrNull(formData, "notes"),
    },
  });

  revalidatePath(`/dogs/${dogId}`);
}

export async function deleteMedication(dogId: string, medicationId: string) {
  await ensureCanDelete();
  await prisma.medication.delete({ where: { id: medicationId } });
  revalidatePath(`/dogs/${dogId}`);
}

// ---------- Attachments (photos, PDF, Word) ----------
// Files go straight from the browser to Cloudinary (Vercel doesn't accept large
// requests through the server). The server only signs the upload and then verifies and saves.
//
// These actions return { error } instead of throwing: on the live site Next.js
// hides the text of thrown errors and the user would see only a generic message.

export type ActionResult = { error?: string };

export async function prepareUpload(
  dogId: string,
  file: { name: string; type: string; size: number },
) {
  await requireUser();
  const invalid = validateFile(file);
  if (invalid) return { error: invalid[0].toUpperCase() + invalid.slice(1) + "." };
  const kind = classifyFile(file.name, file.type)!;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return { error: "File storage is not configured." };

  // We don't sign without an existing animal — otherwise the file would be orphaned in Cloudinary
  const dog = await prisma.dog.findUnique({ where: { id: dogId }, select: { id: true } });
  if (!dog) return { error: "Animal not found." };

  const publicId =
    `dog-diary/${dogId}/${randomUUID()}` + (kind.resourceType === "raw" ? `.${kind.extension}` : "");
  const params: Record<string, string | number> = {
    timestamp: Math.round(Date.now() / 1000),
    public_id: publicId,
  };
  // Photos are shrunk and converted to JPEG (phone HEIC files don't display in the browser)
  if (kind.resourceType === "image") params.transformation = "c_limit,w_2000,h_2000,q_auto,f_jpg";

  const signature = cloudinary.utils.api_sign_request(params, apiSecret);
  return {
    upload: { cloudName, apiKey, resourceType: kind.resourceType, params, signature },
  };
}

export async function saveAttachment(
  dogId: string,
  upload: { publicId: string; resourceType: string; name: string; folderId?: string | null },
): Promise<ActionResult> {
  await requireUser();
  if (!upload.publicId.startsWith(`dog-diary/${dogId}/`)) return { error: "Invalid file." };
  if (upload.resourceType !== "image" && upload.resourceType !== "raw") {
    return { error: "Invalid file." };
  }

  // One uploaded file — one record (otherwise deleting one would break the other)
  const existing = await prisma.attachment.findFirst({ where: { publicId: upload.publicId } });
  if (existing) return {};

  // Folder only from the same animal; if it was deleted in the meantime — the file goes to "no folder"
  const folder = upload.folderId
    ? await prisma.attachmentFolder.findFirst({ where: { id: upload.folderId, dogId } })
    : null;

  try {
    // We ask Cloudinary instead of trusting the browser for the URL and size
    const resource = await cloudinary.api.resource(upload.publicId, {
      resource_type: upload.resourceType,
    });
    // The size from the browser may be forged — we check the real one
    if (resource.bytes > MAX_FILE_BYTES) {
      await destroyFiles([upload]);
      return { error: "The file is larger than 10 MB." };
    }

    await prisma.attachment.create({
      data: {
        dogId,
        name: upload.name.slice(0, 200),
        url: resource.secure_url,
        publicId: upload.publicId,
        resourceType: upload.resourceType,
        bytes: resource.bytes,
        folderId: folder?.id ?? null,
      },
    });
  } catch (error) {
    // The file was uploaded but saving failed — we remove it from Cloudinary so it isn't orphaned
    console.error("saveAttachment failed", upload.publicId, error);
    await destroyFiles([upload]);
    return { error: "The file could not be saved." };
  }

  revalidatePath(`/dogs/${dogId}`);
  return {};
}

export async function deleteAttachment(dogId: string, attachmentId: string): Promise<ActionResult> {
  await ensureCanDelete();
  const attachment = await prisma.attachment.findFirst({ where: { id: attachmentId, dogId } });
  if (!attachment) return { error: "The file no longer exists." };
  await destroyFiles([attachment]);
  await prisma.attachment.delete({ where: { id: attachmentId } });
  revalidatePath(`/dogs/${dogId}`);
  return {};
}

// ---------- File folders ----------

function folderName(value: string): string | null {
  const name = value.trim();
  return name ? name.slice(0, 60) : null;
}

export async function createFolder(dogId: string, formData: FormData) {
  await requireUser();
  const name = folderName(str(formData, "name") ?? "");
  if (!name) return; // the field is required in the form — only whitespace gets here
  await prisma.attachmentFolder.create({ data: { dogId, name } });
  revalidatePath(`/dogs/${dogId}`);
}

export async function renameFolder(dogId: string, folderId: string, value: string): Promise<ActionResult> {
  await requireUser();
  const name = folderName(value);
  if (!name) return { error: "The folder name is required." };
  // updateMany with dogId — so a folder of another animal can't be renamed
  const { count } = await prisma.attachmentFolder.updateMany({
    where: { id: folderId, dogId },
    data: { name },
  });
  revalidatePath(`/dogs/${dogId}`);
  return count === 0 ? { error: "The folder no longer exists." } : {};
}

// The folder's files stay (they go back to "no folder") — only the grouping is deleted
export async function deleteFolder(dogId: string, folderId: string): Promise<ActionResult> {
  await requireUser();
  await prisma.attachmentFolder.deleteMany({ where: { id: folderId, dogId } });
  revalidatePath(`/dogs/${dogId}`);
  return {};
}

export async function moveAttachment(
  dogId: string,
  attachmentId: string,
  folderId: string | null,
): Promise<ActionResult> {
  await requireUser();
  if (folderId) {
    const folder = await prisma.attachmentFolder.findFirst({ where: { id: folderId, dogId } });
    if (!folder) {
      revalidatePath(`/dogs/${dogId}`);
      return { error: "The folder no longer exists." };
    }
  }
  const { count } = await prisma.attachment.updateMany({
    where: { id: attachmentId, dogId },
    data: { folderId },
  });
  revalidatePath(`/dogs/${dogId}`);
  return count === 0 ? { error: "The file no longer exists." } : {};
}

// Creates a folder and immediately puts the file in it (from the file's ⋯ menu)
export async function moveToNewFolder(dogId: string, attachmentId: string, value: string): Promise<ActionResult> {
  await requireUser();
  const name = folderName(value);
  if (!name) return { error: "The folder name is required." };
  const attachment = await prisma.attachment.findFirst({ where: { id: attachmentId, dogId } });
  if (!attachment) {
    revalidatePath(`/dogs/${dogId}`);
    return { error: "The file no longer exists." };
  }
  await prisma.$transaction(async (tx) => {
    const folder = await tx.attachmentFolder.create({ data: { dogId, name } });
    await tx.attachment.update({ where: { id: attachmentId }, data: { folderId: folder.id } });
  });
  revalidatePath(`/dogs/${dogId}`);
  return {};
}

// A variant of moveAttachment for dragging: the folder is bound beforehand, the file arrives on drop
export async function moveAttachmentToFolder(
  dogId: string,
  folderId: string | null,
  attachmentId: string,
): Promise<ActionResult> {
  return moveAttachment(dogId, attachmentId, folderId);
}
