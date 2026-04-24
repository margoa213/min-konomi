"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      afterSignInUrl="/reports"
      afterSignUpUrl="/reports"
    />
  );
}