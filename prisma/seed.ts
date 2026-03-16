import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { employeeId: "EMP001" },
    update: {},
    create: {
      employeeId: "EMP001",
      upn: "alice@company.com",
      displayName: "Alice Manager",
      email: "alice@company.com",
      isManager: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { employeeId: "EMP002" },
    update: {},
    create: {
      employeeId: "EMP002",
      upn: "bob@company.com",
      displayName: "Bob Lead",
      email: "bob@company.com",
      managerId: alice.id,
      isManager: true,
    },
  });

  const staffData: [string, string, string, string][] = [
    ["EMP003", "Carol Dev", "carol@company.com", "bob"],
    ["EMP004", "Dave Dev", "dave@company.com", "bob"],
    ["EMP005", "Eve QA", "eve@company.com", "alice"],
    ["EMP006", "Frank Liu", "frank.liu@company.com", "bob"],
    ["EMP007", "Grace Kim", "grace.kim@company.com", "alice"],
    ["EMP008", "Henry Wong", "henry.wong@company.com", "bob"],
    ["EMP009", "Ivy Chen", "ivy.chen@company.com", "alice"],
    ["EMP010", "Jack Martinez", "jack.martinez@company.com", "bob"],
    ["EMP011", "Kate Johnson", "kate.johnson@company.com", "alice"],
    ["EMP012", "Leo Brown", "leo.brown@company.com", "bob"],
    ["EMP013", "Mia Davis", "mia.davis@company.com", "alice"],
    ["EMP014", "Noah Wilson", "noah.wilson@company.com", "bob"],
    ["EMP015", "Olivia Taylor", "olivia.taylor@company.com", "alice"],
    ["EMP016", "Paul Anderson", "paul.anderson@company.com", "bob"],
    ["EMP017", "Quinn Thomas", "quinn.thomas@company.com", "alice"],
    ["EMP018", "Rachel Lee", "rachel.lee@company.com", "bob"],
    ["EMP019", "Sam White", "sam.white@company.com", "alice"],
    ["EMP020", "Tina Harris", "tina.harris@company.com", "bob"],
    ["EMP021", "Uma Clark", "uma.clark@company.com", "alice"],
    ["EMP022", "Victor Lewis", "victor.lewis@company.com", "bob"],
    ["EMP023", "Wendy Walker", "wendy.walker@company.com", "alice"],
    ["EMP024", "Xavier Hall", "xavier.hall@company.com", "bob"],
    ["EMP025", "Yara Young", "yara.young@company.com", "alice"],
  ];
  const managerById = { alice: alice.id, bob: bob.id } as const;
  for (const [eid, name, email, managerKey] of staffData) {
    await prisma.user.upsert({
      where: { employeeId: eid },
      update: {},
      create: {
        employeeId: eid,
        upn: email,
        displayName: name,
        email,
        managerId: managerById[managerKey],
        isManager: false,
      },
    });
  }

  const users = await prisma.user.findMany({ where: { isManager: false }, select: { employeeId: true } });
  for (const u of users) {
    await prisma.equipmentAssignment.upsert({
      where: { assetTag_assignedToEmployeeId: { assetTag: `AST-${u.employeeId}-001`, assignedToEmployeeId: u.employeeId } },
      update: {},
      create: {
        assetTag: `AST-${u.employeeId}-001`,
        serial: `SN-${u.employeeId}-001`,
        model: "MacBook Pro 14",
        assignedToEmployeeId: u.employeeId,
        source: "ref_tab",
      },
    });
    await prisma.equipmentAssignment.upsert({
      where: { assetTag_assignedToEmployeeId: { assetTag: `AST-${u.employeeId}-002`, assignedToEmployeeId: u.employeeId } },
      update: {},
      create: {
        assetTag: `AST-${u.employeeId}-002`,
        serial: `SN-${u.employeeId}-002`,
        model: "Dell Monitor 27",
        assignedToEmployeeId: u.employeeId,
        source: "ref_tab",
      },
    });
  }

  console.log("Seed done: users + equipment assignments.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
