import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/reports"
      />
    </main>
  );
}