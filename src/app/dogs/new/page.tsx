import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createDog } from "@/lib/actions";
import { SpeciesField } from "@/components/SpeciesField";
import { NewDogForm } from "@/components/NewDogForm";

export default async function NewDogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;
  const owners = await prisma.owner.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="rounded-md bg-[#ff964f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#f2803a]"
        >
          ← Back
        </Link>
        <h1 className="inline-block rounded-md bg-[#fbe4cf] px-4 py-2 text-2xl font-semibold">
          New animal
        </h1>
      </div>

      {error === "owner" && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Choose an existing owner or enter the name of a new owner.
        </p>
      )}

      <NewDogForm action={createDog} className="flex flex-col gap-6">
        <section className="rounded-lg border border-[#fbe4cf] bg-[#fff1e3] p-5">
          <h2 className="mb-4 font-medium text-zinc-800">Animal details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <input name="dogName" required className={inputClass} />
            </Field>
            <SpeciesField />
            <Field label="Breed">
              <input name="breed" className={inputClass} />
            </Field>
            <Field label="Gender">
              <select name="gender" className={inputClass} defaultValue="UNKNOWN">
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input type="date" name="birthDate" className={inputClass} />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                step="0.1"
                name="weightKg"
                className={`${inputClass} no-spinner`}
              />
            </Field>
            <Field label="Microchip no.">
              <input name="chipNumber" className={inputClass} />
            </Field>
          </div>
          <Field label="Notes" className="mt-4">
            <textarea name="notes" rows={3} className={inputClass} />
          </Field>
        </section>

        <section className="rounded-lg border border-[#fbe4cf] bg-[#fff1e3] p-5">
          <h2 className="mb-4 font-medium text-zinc-800">Owner</h2>

          {owners.length > 0 && (
            <Field label="Choose an existing owner">
              <select name="ownerId" className={inputClass} defaultValue="">
                <option value="">— New owner —</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} {owner.phone ? `(${owner.phone})` : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <p className="mb-3 mt-4 text-sm text-zinc-500">
            If you don&apos;t choose an owner above, fill in the details of a new one:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input name="newOwnerName" className={inputClass} />
            </Field>
            <Field label="Phone">
              <input name="newOwnerPhone" className={inputClass} />
            </Field>
            <Field label="Email">
              <input type="email" name="newOwnerEmail" className={inputClass} />
            </Field>
            <Field label="Address">
              <input name="newOwnerAddress" className={inputClass} />
            </Field>
          </div>
        </section>

        <button
          type="submit"
          className="self-start rounded-md bg-[#ff964f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#f2803a]"
        >
          Save animal
        </button>
      </NewDogForm>
    </main>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500";

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
