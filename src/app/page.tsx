import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { FilterDetails } from "@/components/FilterDetails";
import { SearchInput } from "@/components/SearchInput";

function calculateAge(birthDate: Date | null): string | null {
  if (!birthDate) return null;
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  // The month isn't "complete" yet if the day of the month hasn't been reached
  if (now.getDate() < birthDate.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0) return `${months} mo.`;
  return `${years} yr.`;
}

const genderLabel: Record<string, string> = {
  MALE: "male",
  FEMALE: "female",
  UNKNOWN: "unknown",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; species?: string; breed?: string; gender?: string }>;
}) {
  await requireUser();
  const { q, species, breed, gender } = await searchParams;
  const query = q?.trim();
  const speciesFilter = species?.trim();
  const breedFilter = breed?.trim();
  const genderFilter = gender?.trim();

  const conditions = [];
  if (query) {
    conditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { species: { contains: query, mode: "insensitive" as const } },
        { breed: { contains: query, mode: "insensitive" as const } },
        { owner: { name: { contains: query, mode: "insensitive" as const } } },
      ],
    });
  }
  if (speciesFilter) conditions.push({ species: speciesFilter });
  if (breedFilter) conditions.push({ breed: breedFilter });
  if (genderFilter) {
    conditions.push({ gender: genderFilter as "MALE" | "FEMALE" | "UNKNOWN" });
  }

  const [dogs, allDogs] = await Promise.all([
    prisma.dog.findMany({
      where: conditions.length ? { AND: conditions } : undefined,
      include: { owner: true },
      orderBy: { name: "asc" },
    }),
    prisma.dog.findMany({ select: { species: true, breed: true } }),
  ]);

  const speciesOptions = Array.from(new Set(allDogs.map((d) => d.species))).sort();
  const breedOptions = Array.from(
    new Set(allDogs.map((d) => d.breed).filter((b): b is string => Boolean(b)))
  ).sort();
  const hasActiveFilters = Boolean(speciesFilter || breedFilter || genderFilter);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6">
        <h1 className="inline-block rounded-md bg-[#fbe4cf] px-4 py-2 text-2xl font-semibold">
          Animal list
        </h1>
      </div>

      <form id="dog-search" className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <SearchInput
          defaultValue={query ?? ""}
          placeholder="Search by name, species, breed or owner..."
          className="w-full max-w-md rounded-md border border-[#fbe4cf] bg-[#fff1e3] px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-[#f2803a]"
        />
        <div className="flex items-start gap-3">
          <FilterDetails hasActiveFilters={hasActiveFilters}>
          <div className="absolute right-0 z-10 mt-2 w-60 rounded-md border border-[#fbe4cf] bg-white p-4 shadow-lg">
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-zinc-600">Species</label>
              <select
                name="species"
                defaultValue={speciesFilter ?? ""}
                className="w-full rounded-md border border-[#fbe4cf] bg-[#fff1e3] px-2 py-1.5 text-sm outline-none focus:border-[#f2803a]"
              >
                <option value="">All</option>
                {speciesOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-zinc-600">Breed</label>
              <select
                name="breed"
                defaultValue={breedFilter ?? ""}
                className="w-full rounded-md border border-[#fbe4cf] bg-[#fff1e3] px-2 py-1.5 text-sm outline-none focus:border-[#f2803a]"
              >
                <option value="">All</option>
                {breedOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-zinc-600">Gender</label>
              <select
                name="gender"
                defaultValue={genderFilter ?? ""}
                className="w-full rounded-md border border-[#fbe4cf] bg-[#fff1e3] px-2 py-1.5 text-sm outline-none focus:border-[#f2803a]"
              >
                <option value="">All</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Link href="/" className="text-xs text-zinc-500 hover:underline">
                Clear
              </Link>
              <button
                type="submit"
                className="rounded-md bg-[#ff964f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#f2803a]"
              >
                Apply
              </button>
            </div>
          </div>
          </FilterDetails>
          <Link
            href="/dogs/new"
            className="rounded-md bg-[#ff964f] px-4 py-2 text-sm font-medium text-white hover:bg-[#f2803a]"
          >
            + New animal
          </Link>
        </div>
      </form>

      {dogs.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-zinc-500">
          {query || hasActiveFilters ? "No animals found." : "No animals added yet."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#ffceac] text-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Species</th>
                <th className="px-4 py-3 font-medium">Breed</th>
                <th className="px-4 py-3 font-medium">Gender</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#fbe4cf] bg-[#fff1e3]">
              {dogs.map((dog) => (
                <tr key={dog.id} className="cursor-pointer hover:bg-[#fde3c8]">
                  <td className="p-0">
                    <Link
                      href={`/dogs/${dog.id}`}
                      className="block px-4 py-3 font-medium text-zinc-900"
                    >
                      {dog.name}
                    </Link>
                  </td>
                  <td className="p-0 text-zinc-600">
                    <Link href={`/dogs/${dog.id}`} className="block px-4 py-3">
                      {dog.species}
                    </Link>
                  </td>
                  <td className="p-0 text-zinc-600">
                    <Link href={`/dogs/${dog.id}`} className="block px-4 py-3">
                      {dog.breed ?? "—"}
                    </Link>
                  </td>
                  <td className="p-0 text-zinc-600">
                    <Link href={`/dogs/${dog.id}`} className="block px-4 py-3">
                      {genderLabel[dog.gender]}
                    </Link>
                  </td>
                  <td className="p-0 text-zinc-600">
                    <Link href={`/dogs/${dog.id}`} className="block px-4 py-3">
                      {calculateAge(dog.birthDate) ?? "—"}
                    </Link>
                  </td>
                  <td className="p-0 text-zinc-600">
                    <Link href={`/dogs/${dog.id}`} className="block px-4 py-3">
                      {dog.owner.name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
