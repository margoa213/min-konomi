"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <SignUp
        routing="path"
        path="/sign-up"
        fallbackRedirectUrl="/reports"
      />
    </main>
  );
}