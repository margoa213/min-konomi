import { currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { seedDemoDataForUser } from "./seed-demo-data-for-user";

export async function getOrCreateCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Innlogget Clerk-bruker mangler e-postadresse.");
  }

  const fullName =
    [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || null;

  const existingByClerkId = await db.user.findUnique({
    where: { clerkUserId: clerkUser.id },
  });

  if (existingByClerkId) {
    return db.user.update({
      where: { id: existingByClerkId.id },
      data: {
        email,
        name: fullName,
      },
    });
  }

  const existingByEmail = await db.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    const linkedUser = await db.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkUserId: clerkUser.id,
        name: fullName,
      },
    });

    await seedDemoDataForUser(linkedUser.id);
    return linkedUser;
  }

  const newUser = await db.user.create({
    data: {
      clerkUserId: clerkUser.id,
      email,
      name: fullName,
    },
  });

  await seedDemoDataForUser(newUser.id);

  return newUser;
}