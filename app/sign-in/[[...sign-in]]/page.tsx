"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <SignIn
        routing="path"
        path="/sign-in"
        forceRedirectUrl="/reports"
        signUpUrl="/sign-up"
      />
    </main>
  );
}