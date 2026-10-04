import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SpeciesField } from "@/components/SpeciesField";
import { LinkedSections } from "@/components/LinkedSections";
import { EditableListItem } from "@/components/EditableListItem";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { FileMenu } from "@/components/FileMenu";
import { FolderMenu } from "@/components/FolderMenu";
import { DraggableFile, DropTarget } from "@/components/FileDnd";
import {
  addMedicalRecord,
  addMedication,
  addVaccination,
  createFolder,
  deleteAttachment,
  deleteDog,
  deleteFolder,
  deleteMedicalRecord,
  deleteMedication,
  deleteVaccination,
  moveAttachment,
  moveAttachmentToFolder,
  moveToNewFolder,
  renameFolder,
  updateDog,
  updateMedicalRecord,
  updateMedication,
  updateOwner,
  updateVaccination,
} from "@/lib/actions";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500";

const genderLabel: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  UNKNOWN: "Unknown",
};

function fmt(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

// Small version of the image from Cloudinary (fast to load)
function thumbnail(url: string): string {
  return url.replace("/upload/", "/upload/c_fill,w_300,h_300,q_auto/");
}

function fmtSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isOverdue(date: Date | null | undefined): boolean {
  if (!date) return false;
  // Overdue only from the next day — a dose dated today isn't overdue yet
  return toDateInput(date) < new Date().toISOString().slice(0, 10);
}

export default async function DogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await requireUser();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canDelete = role === "DOCTOR" || role === "ADMIN";

  const dog = await prisma.dog.findUnique({
    where: { id },
    include: {
      owner: true,
      medicalRecords: { orderBy: { date: "desc" } },
      vaccinations: { orderBy: { dateGiven: "desc" } },
      medications: { orderBy: { startDate: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      attachmentFolders: { orderBy: { name: "asc" } },
    },
  });

  if (!dog) notFound();

  const unsorted = dog.attachments.filter((file) => !file.folderId);
  const folderOptions = dog.attachmentFolders.map((folder) => ({ id: folder.id, name: folder.name }));

  const boundAddRecord = addMedicalRecord.bind(null, dog.id);
  const boundAddVaccination = addVaccination.bind(null, dog.id);
  const boundAddMedication = addMedication.bind(null, dog.id);
  const boundUpdateOwner = updateOwner.bind(null, dog.id);
  const boundUpdateDog = updateDog.bind(null, dog.id);
  const boundDeleteDog = deleteDog.bind(null, dog.id);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="relative mb-6">
        <Link
          href="/"
          className="mb-4 inline-block rounded-md bg-[#ff964f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#f2803a] lg:absolute lg:mb-0 lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:-translate-x-[calc(100%+1rem)]"
        >
          ← Back
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-[#fbe4cf] bg-[#fff1e3] p-5">
          <div>
            <h1 className="text-3xl font-semibold">{dog.name}</h1>
            {dog.birthDate && (
              <p className="text-zinc-500">born on {fmt(dog.birthDate)}</p>
            )}
          </div>
          {canDelete && (
            <form
              action={async () => {
                "use server";
                await boundDeleteDog();
              }}
            >
              <ConfirmSubmitButton
                message={`Are you sure you want to delete the profile of ${dog.name}? All examinations, vaccinations and medications will be deleted too. This cannot be undone.`}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
              >
                Delete profile
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </div>

      <LinkedSections
        leftKey={`dog-${dog.updatedAt.toISOString()}`}
        leftTitle="Profile"
        leftView={
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Info label="Species" value={dog.species} />
            <Info label="Breed" value={dog.breed ?? "—"} />
            <Info label="Gender" value={genderLabel[dog.gender]} />
            <Info label="Weight" value={dog.weightKg ? `${dog.weightKg} kg` : "—"} />
            <Info label="Microchip no." value={dog.chipNumber ?? "—"} />
            <Info label="Notes" value={dog.notes ?? "—"} />
          </dl>
        }
        leftForm={
          <form action={boundUpdateDog} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <input name="dogName" required defaultValue={dog.name} className={inputClass} />
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                name="birthDate"
                defaultValue={toDateInput(dog.birthDate)}
                className={inputClass}
              />
            </Field>
            <SpeciesField defaultValue={dog.species} />
            <Field label="Breed">
              <input name="breed" defaultValue={dog.breed ?? ""} className={inputClass} />
            </Field>
            <Field label="Gender">
              <select name="gender" defaultValue={dog.gender} className={inputClass}>
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                step="0.1"
                name="weightKg"
                defaultValue={dog.weightKg ?? ""}
                className={`${inputClass} no-spinner`}
              />
            </Field>
            <Field label="Microchip no.">
              <input name="chipNumber" defaultValue={dog.chipNumber ?? ""} className={inputClass} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea name="notes" rows={3} defaultValue={dog.notes ?? ""} className={inputClass} />
            </Field>
            <button
              type="submit"
              className="self-start rounded-md bg-[#ff964f] px-4 py-2 text-sm font-medium text-white hover:bg-[#f2803a] sm:col-span-2"
            >
              Save profile
            </button>
          </form>
        }
        rightKey={`owner-${dog.owner.updatedAt.toISOString()}`}
        rightTitle="Owner"
        rightView={
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Info label="Name" value={dog.owner.name} />
            <Info label="Phone" value={dog.owner.phone ?? "—"} />
            <Info label="Email" value={dog.owner.email ?? "—"} />
            <Info label="Address" value={dog.owner.address ?? "—"} />
          </dl>
        }
        rightForm={
          <form action={boundUpdateOwner} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input type="hidden" name="ownerId" value={dog.owner.id} />
            <Field label="Name *">
              <input name="name" required defaultValue={dog.owner.name} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input name="phone" defaultValue={dog.owner.phone ?? ""} className={inputClass} />
            </Field>
            <Field label="Email">
              <input
                type="email"
                name="email"
                defaultValue={dog.owner.email ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Address">
              <input name="address" defaultValue={dog.owner.address ?? ""} className={inputClass} />
            </Field>
            <button
              type="submit"
              className="self-start rounded-md bg-[#ff964f] px-4 py-2 text-sm font-medium text-white hover:bg-[#f2803a] sm:col-span-2"
            >
              Save owner
            </button>
          </form>
        }
      />

      {/* Medical examinations */}
      <Section title="Medical examinations and procedures">
        <ul className="mb-4 flex flex-col gap-3">
          {dog.medicalRecords.length === 0 && <Empty text="No examinations recorded." />}
          {dog.medicalRecords.map((record) => (
            <EditableListItem
              key={`${record.id}-${record.updatedAt.toISOString()}`}
              deleteAction={deleteMedicalRecord.bind(null, dog.id, record.id)}
              canDelete={canDelete}
              view={
                <div>
                  <p className="font-medium">{record.title}</p>
                  <p className="text-zinc-500">{fmt(record.date)}
                    {record.vetName ? ` · Dr. ${record.vetName}` : ""}
                  </p>
                  {record.description && (
                    <p className="mt-1 text-zinc-700">{record.description}</p>
                  )}
                </div>
              }
              form={
                <form
                  action={updateMedicalRecord.bind(null, dog.id, record.id)}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <Field label="Title *">
                    <input name="title" required defaultValue={record.title} className={inputClass} />
                  </Field>
                  <Field label="Date *">
                    <input
                      type="date"
                      name="date"
                      required
                      defaultValue={toDateInput(record.date)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Veterinarian">
                    <input name="vetName" defaultValue={record.vetName ?? ""} className={inputClass} />
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={record.description ?? ""}
                      className={inputClass}
                    />
                  </Field>
                  <AddButton label="Save changes" />
                </form>
              }
            />
          ))}
        </ul>

        <form action={boundAddRecord} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Title *">
            <input name="title" required className={inputClass} placeholder="e.g. Annual check-up" />
          </Field>
          <Field label="Date">
            <input type="date" name="date" className={inputClass} />
          </Field>
          <Field label="Veterinarian">
            <input name="vetName" className={inputClass} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea name="description" rows={2} className={inputClass} />
          </Field>
          <AddButton label="+ Add examination" />
        </form>
      </Section>

      {/* Vaccinations */}
      <Section title="Vaccinations">
        <ul className="mb-4 flex flex-col gap-3">
          {dog.vaccinations.length === 0 && <Empty text="No vaccinations recorded." />}
          {dog.vaccinations.map((vaccination) => (
            <EditableListItem
              key={`${vaccination.id}-${vaccination.updatedAt.toISOString()}`}
              deleteAction={deleteVaccination.bind(null, dog.id, vaccination.id)}
              canDelete={canDelete}
              view={
                <div>
                  <p className="font-medium">{vaccination.name}</p>
                  <p className="text-zinc-500">Given on {fmt(vaccination.dateGiven)}</p>
                  {vaccination.nextDueDate && (
                    <p
                      className={
                        isOverdue(vaccination.nextDueDate)
                          ? "font-medium text-red-600"
                          : "text-zinc-700"
                      }
                    >
                      Next dose: {fmt(vaccination.nextDueDate)}
                      {isOverdue(vaccination.nextDueDate) ? " (overdue)" : ""}
                    </p>
                  )}
                  {vaccination.notes && <p className="mt-1 text-zinc-700">{vaccination.notes}</p>}
                </div>
              }
              form={
                <form
                  action={updateVaccination.bind(null, dog.id, vaccination.id)}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <Field label="Vaccine name *">
                    <input name="name" required defaultValue={vaccination.name} className={inputClass} />
                  </Field>
                  <Field label="Date given *">
                    <input
                      type="date"
                      name="dateGiven"
                      required
                      defaultValue={toDateInput(vaccination.dateGiven)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Next dose (date)">
                    <input
                      type="date"
                      name="nextDueDate"
                      defaultValue={toDateInput(vaccination.nextDueDate)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Notes">
                    <input name="notes" defaultValue={vaccination.notes ?? ""} className={inputClass} />
                  </Field>
                  <AddButton label="Save changes" />
                </form>
              }
            />
          ))}
        </ul>

        <form action={boundAddVaccination} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Vaccine name *">
            <input name="name" required className={inputClass} placeholder="e.g. Rabies" />
          </Field>
          <Field label="Date given *">
            <input type="date" name="dateGiven" required className={inputClass} />
          </Field>
          <Field label="Next dose (date)">
            <input type="date" name="nextDueDate" className={inputClass} />
          </Field>
          <Field label="Notes">
            <input name="notes" className={inputClass} />
          </Field>
          <AddButton label="+ Add vaccination" />
        </form>
      </Section>

      {/* Medications */}
      <Section title="Prescribed medications">
        <ul className="mb-4 flex flex-col gap-3">
          {dog.medications.length === 0 && <Empty text="No medications prescribed." />}
          {dog.medications.map((medication) => (
            <EditableListItem
              key={`${medication.id}-${medication.updatedAt.toISOString()}`}
              deleteAction={deleteMedication.bind(null, dog.id, medication.id)}
              canDelete={canDelete}
              view={
                <div>
                  <p className="font-medium">
                    {medication.name}
                    {medication.dosage ? ` — ${medication.dosage}` : ""}
                  </p>
                  <p className="text-zinc-500">
                    From {fmt(medication.startDate)}
                    {medication.endDate ? ` to ${fmt(medication.endDate)}` : " (ongoing)"}
                  </p>
                  {medication.notes && <p className="mt-1 text-zinc-700">{medication.notes}</p>}
                </div>
              }
              form={
                <form
                  action={updateMedication.bind(null, dog.id, medication.id)}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <Field label="Medication name *">
                    <input name="name" required defaultValue={medication.name} className={inputClass} />
                  </Field>
                  <Field label="Dosage">
                    <input name="dosage" defaultValue={medication.dosage ?? ""} className={inputClass} />
                  </Field>
                  <Field label="Start date *">
                    <input
                      type="date"
                      name="startDate"
                      required
                      defaultValue={toDateInput(medication.startDate)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="End date">
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={toDateInput(medication.endDate)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Notes" className="sm:col-span-2">
                    <input name="notes" defaultValue={medication.notes ?? ""} className={inputClass} />
                  </Field>
                  <AddButton label="Save changes" />
                </form>
              }
            />
          ))}
        </ul>

        <form action={boundAddMedication} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Medication name *">
            <input name="name" required className={inputClass} />
          </Field>
          <Field label="Dosage">
            <input name="dosage" className={inputClass} placeholder="e.g. 1 tablet daily" />
          </Field>
          <Field label="Start date">
            <input type="date" name="startDate" className={inputClass} />
          </Field>
          <Field label="End date">
            <input type="date" name="endDate" className={inputClass} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <input name="notes" className={inputClass} />
          </Field>
          <AddButton label="+ Add medication" />
        </form>
      </Section>

      {/* Files and photos */}
      <Section title="Photos and documents">
        <div className="mb-4">
          <AttachmentUploader dogId={dog.id} />
        </div>

        <form
          action={createFolder.bind(null, dog.id)}
          className="mb-4 flex flex-wrap items-center gap-2"
        >
          <input
            name="name"
            required
            maxLength={60}
            placeholder="New folder, e.g. X-rays"
            className={`${inputClass} max-w-xs`}
          />
          <button
            type="submit"
            className="rounded-md bg-[#ff964f] px-4 py-2 text-sm font-medium text-white hover:bg-[#f2803a]"
          >
            + Create folder
          </button>
        </form>

        {dog.attachments.length === 0 && dog.attachmentFolders.length === 0 && (
          <Empty text="No attached files." />
        )}

        {dog.attachmentFolders.map((folder) => {
          const files = dog.attachments.filter((file) => file.folderId === folder.id);
          return (
            <DropTarget
              key={folder.id}
              as="details"
              folderId={folder.id}
              moveAction={moveAttachmentToFolder.bind(null, dog.id, folder.id)}
              className="mb-3 rounded-md border border-zinc-200 bg-white p-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
                <span className="min-w-0 truncate">
                  📁 {folder.name} <span className="font-normal text-zinc-500">({files.length})</span>
                </span>
                <FolderMenu
                  name={folder.name}
                  renameAction={renameFolder.bind(null, dog.id, folder.id)}
                  deleteAction={deleteFolder.bind(null, dog.id, folder.id)}
                />
              </summary>
              <div className="mt-3">
                {files.length === 0 ? (
                  <Empty text="The folder is empty. Drag a file here or move it with the ⋯ next to the file." />
                ) : (
                  <FileGroup
                    dogId={dog.id}
                    files={files}
                    folders={folderOptions}
                    canDelete={canDelete}
                  />
                )}
              </div>
            </DropTarget>
          );
        })}

        {(unsorted.length > 0 || dog.attachmentFolders.length > 0) && (
          <DropTarget
            as="div"
            moveAction={moveAttachmentToFolder.bind(null, dog.id, null)}
            className="rounded-md border border-transparent p-1"
          >
            {dog.attachmentFolders.length > 0 && (
              <p className="mb-2 text-sm font-medium text-zinc-700">No folder</p>
            )}
            {unsorted.length > 0 ? (
              <FileGroup dogId={dog.id} files={unsorted} folders={folderOptions} canDelete={canDelete} />
            ) : (
              <Empty text="No files without a folder. Drag a file here to take it out of a folder." />
            )}
          </DropTarget>
        )}
      </Section>
    </main>
  );
}

type FileRow = {
  id: string;
  name: string;
  url: string;
  resourceType: string;
  bytes: number;
  createdAt: Date;
  folderId: string | null;
};

// Photos are a grid of small pictures, documents are a list. Both have a ⋯ menu.
function FileGroup({
  dogId,
  files,
  folders,
  canDelete,
}: {
  dogId: string;
  files: FileRow[];
  folders: { id: string; name: string }[];
  canDelete: boolean;
}) {
  const images = files.filter((file) => file.resourceType === "image");
  const documents = files.filter((file) => file.resourceType !== "image");

  const menu = (file: FileRow, buttonClassName?: string) => (
    <FileMenu
      folders={folders}
      currentFolderId={file.folderId}
      moveAction={moveAttachment.bind(null, dogId, file.id)}
      moveToNewFolderAction={moveToNewFolder.bind(null, dogId, file.id)}
      deleteAction={canDelete ? deleteAttachment.bind(null, dogId, file.id) : undefined}
      buttonClassName={buttonClassName}
    />
  );

  return (
    <>
      {images.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((file) => (
            <DraggableFile key={file.id} id={file.id} className="relative rounded-md border border-zinc-200 bg-white p-2 text-sm">
              <div className="absolute right-3 top-3">
                {menu(file, "bg-white/90 text-zinc-700 shadow hover:bg-white")}
              </div>
              <a href={file.url} target="_blank" rel="noreferrer" draggable={false}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  draggable={false}
                  src={thumbnail(file.url)}
                  alt={file.name}
                  className="aspect-square w-full rounded object-cover"
                />
              </a>
              <p className="mt-2 truncate text-xs text-zinc-500" title={file.name}>
                {file.name}
              </p>
            </DraggableFile>
          ))}
        </ul>
      )}
      {documents.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {documents.map((file) => (
            <DraggableFile
              key={file.id}
              id={file.id}
              className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-zinc-500">
                  {fmtSize(file.bytes)} · {fmt(file.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-[#ff964f] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#f2803a]"
                >
                  Open
                </a>
                {menu(file)}
              </div>
            </DraggableFile>
          ))}
        </ul>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group mb-6 rounded-lg border border-[#fbe4cf] bg-[#fff1e3] p-5">
      <summary className="mb-4 flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-zinc-800">
        {title}
        <span className="text-zinc-500 transition-transform group-open:rotate-90">›</span>
      </summary>
      {children}
    </details>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-zinc-500">{label}</dt>
      <dd className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900">
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-zinc-700 ${className ?? ""}`}>
      {label}
      {children}
    </label>
  );
}


function Empty({ text }: { text: string }) {
  return <p className="text-sm text-zinc-500">{text}</p>;
}

function AddButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="self-start rounded-md bg-[#ff964f] px-4 py-2 text-sm font-medium text-white hover:bg-[#f2803a] sm:col-span-2"
    >
      {label}
    </button>
  );
}

