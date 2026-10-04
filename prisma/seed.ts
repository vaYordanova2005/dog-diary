import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Demo accounts. They get a random password nobody knows: visitors sign in with the
// one-click buttons on the login page, which work when DEMO_MODE="true" is set.
const accounts = [
  { username: "doctor", name: "Doctor", role: "DOCTOR" as const },
  { username: "intern", name: "Intern", role: "INTERN" as const },
];

// Dates are relative to "now" so the demo always has an overdue and an upcoming vaccination.
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

// All people, phone numbers and microchip numbers below are made up.
const demoAnimals = [
  {
    owner: { name: "Emily Carter", phone: "555-0101", email: "emily.carter@example.com", address: "12 Maple Street" },
    dog: {
      name: "Max",
      species: "Dog",
      breed: "Golden Retriever",
      gender: "MALE" as const,
      birthDate: daysFromNow(-365 * 4 - 40),
      weightKg: 32.5,
      chipNumber: "900000000000001",
      notes: "Friendly, but nervous at the vet's. Allergic to chicken-based food.",
    },
    records: [
      { date: daysFromNow(-20), title: "Annual check-up", vetName: "Taylor", description: "Healthy overall. Teeth in good condition. Weight stable." },
      { date: daysFromNow(-210), title: "Ear infection", vetName: "Taylor", description: "Right ear cleaned and drops prescribed. Follow-up in two weeks." },
    ],
    vaccinations: [
      { name: "Rabies", dateGiven: daysFromNow(-20), nextDueDate: daysFromNow(345), notes: "Booster every year." },
      { name: "DHPP", dateGiven: daysFromNow(-400), nextDueDate: daysFromNow(-35), notes: "Booster is overdue — remind the owner." },
    ],
    medications: [
      { name: "Otomax ear drops", dosage: "5 drops twice daily", startDate: daysFromNow(-210), endDate: daysFromNow(-196), notes: "Finished course." },
    ],
  },
  {
    owner: { name: "Daniel Brooks", phone: "555-0102", email: "daniel.brooks@example.com", address: "48 Oak Avenue" },
    dog: {
      name: "Luna",
      species: "Cat",
      breed: "Siamese",
      gender: "FEMALE" as const,
      birthDate: daysFromNow(-365 * 2 - 100),
      weightKg: 4.1,
      chipNumber: "900000000000002",
      notes: "Indoor cat.",
    },
    records: [
      { date: daysFromNow(-60), title: "Spay surgery", vetName: "Taylor", description: "Routine procedure, no complications. Stitches removed after 10 days." },
    ],
    vaccinations: [
      { name: "FVRCP", dateGiven: daysFromNow(-60), nextDueDate: daysFromNow(305), notes: null },
    ],
    medications: [
      { name: "Meloxicam", dosage: "0.1 ml once daily", startDate: daysFromNow(-60), endDate: daysFromNow(-55), notes: "Post-surgery pain relief." },
    ],
  },
  {
    owner: { name: "Sophia Nguyen", phone: "555-0103", email: "sophia.nguyen@example.com", address: "7 Harbor Road" },
    dog: {
      name: "Rocky",
      species: "Dog",
      breed: "German Shepherd",
      gender: "MALE" as const,
      birthDate: daysFromNow(-365 * 7),
      weightKg: 38,
      chipNumber: "900000000000003",
      notes: "Hip dysplasia — keep exercise moderate.",
    },
    records: [
      { date: daysFromNow(-8), title: "Joint check", vetName: "Patel", description: "X-rays taken. Mild progression of hip dysplasia; continue joint supplement." },
      { date: daysFromNow(-300), title: "Dental cleaning", vetName: "Patel", description: "Scaling and polishing under anaesthesia." },
    ],
    vaccinations: [
      { name: "Rabies", dateGiven: daysFromNow(-100), nextDueDate: daysFromNow(265), notes: null },
      { name: "Leptospirosis", dateGiven: daysFromNow(-100), nextDueDate: daysFromNow(14), notes: "Next dose due soon." },
    ],
    medications: [
      { name: "Glucosamine chewables", dosage: "1 tablet daily", startDate: daysFromNow(-8), endDate: null, notes: "Long-term." },
    ],
  },
  {
    owner: { name: "Emily Carter", phone: "555-0101", email: "emily.carter@example.com", address: "12 Maple Street" },
    dog: {
      name: "Coco",
      species: "Rabbit",
      breed: "Holland Lop",
      gender: "FEMALE" as const,
      birthDate: daysFromNow(-365 - 200),
      weightKg: 1.8,
      chipNumber: null,
      notes: "Eats hay and fresh greens only.",
    },
    records: [
      { date: daysFromNow(-45), title: "Nail trimming and health check", vetName: "Taylor", description: "All fine." },
    ],
    vaccinations: [
      { name: "Myxomatosis", dateGiven: daysFromNow(-150), nextDueDate: daysFromNow(215), notes: null },
    ],
    medications: [],
  },
  {
    owner: { name: "Marcus Reed", phone: "555-0104", email: null, address: "301 Pine Lane" },
    dog: {
      name: "Bella",
      species: "Dog",
      breed: "Beagle",
      gender: "FEMALE" as const,
      birthDate: daysFromNow(-200),
      weightKg: 8.2,
      chipNumber: "900000000000005",
      notes: "Puppy — vaccination series in progress.",
    },
    records: [
      { date: daysFromNow(-30), title: "First puppy visit", vetName: "Patel", description: "Deworming given. Feeding and training advice discussed." },
    ],
    vaccinations: [
      { name: "DHPP (puppy series)", dateGiven: daysFromNow(-30), nextDueDate: daysFromNow(-2), notes: "Second dose was due two days ago." },
    ],
    medications: [
      { name: "Pyrantel dewormer", dosage: "1 ml per 5 kg", startDate: daysFromNow(-30), endDate: daysFromNow(-30), notes: "Single dose." },
    ],
  },
  {
    owner: { name: "Olivia Fischer", phone: "555-0105", email: "olivia.fischer@example.com", address: "9 Willow Court" },
    dog: {
      name: "Kiwi",
      species: "Bird",
      breed: "Budgerigar",
      gender: "UNKNOWN" as const,
      birthDate: null,
      weightKg: 0.04,
      chipNumber: null,
      notes: "Beak and wing check once a year.",
    },
    records: [],
    vaccinations: [],
    medications: [],
  },
];

async function createAccounts() {
  for (const account of accounts) {
    const existing = await prisma.user.findUnique({ where: { username: account.username } });
    if (existing) {
      console.log("Account already exists:", account.username);
      continue;
    }

    const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);

    await prisma.user.create({
      data: {
        name: account.name,
        username: account.username,
        passwordHash,
        role: account.role,
      },
    });

    console.log("Account created:", account.username, `(${account.role})`);
  }
}

async function createDemoData() {
  // Only fill an empty database, so re-running the seed never duplicates or overwrites anything.
  if ((await prisma.dog.count()) > 0) {
    console.log("Animals already exist — skipping demo data");
    return;
  }

  // The same owner can have several animals, so owners are created once and reused.
  const ownerIds = new Map<string, string>();

  for (const animal of demoAnimals) {
    let ownerId = ownerIds.get(animal.owner.name);
    if (!ownerId) {
      ownerId = (await prisma.owner.create({ data: animal.owner })).id;
      ownerIds.set(animal.owner.name, ownerId);
    }

    await prisma.dog.create({
      data: {
        ...animal.dog,
        ownerId,
        medicalRecords: { create: animal.records },
        vaccinations: { create: animal.vaccinations },
        medications: { create: animal.medications },
      },
    });

    console.log("Demo animal created:", animal.dog.name);
  }
}

async function main() {
  await createAccounts();
  await createDemoData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
