import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const { userId } = await auth();

  // Hvis ikke logget inn → send til sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Reports fungerer 🎉</h1>
      <p>Du er logget inn.</p>
    </div>
  );
}