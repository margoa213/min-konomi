"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <SignUp
        routing="path"
        path="/sign-up"
        forceRedirectUrl="/reports"
        signInUrl="/sign-in"
      />
    </main>
  );
}