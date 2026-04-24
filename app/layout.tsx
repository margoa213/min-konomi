import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://goaregnskap.com"),
  title: {
    default: "Goa Regnskap",
    template: "%s | Goa Regnskap",
  },
  description:
    "Goa Regnskap er en enkel norsk app for privatøkonomi med månedlige rapporter, innsikt og PDF-oversikt.",
  applicationName: "Goa Regnskap",
  keywords: [
    "Goa Regnskap",
    "privatøkonomi",
    "budsjett",
    "økonomirapport",
    "månedlig rapport",
    "regnskap",
    "personlig økonomi",
  ],
  authors: [{ name: "Goa Regnskap" }],
  creator: "Goa Regnskap",
  publisher: "Goa Regnskap",
  alternates: {
    canonical: "https://goaregnskap.com",
  },
  openGraph: {
    title: "Goa Regnskap",
    description:
      "En enkel norsk app for privatøkonomi med rapporter, innsikt og PDF.",
    url: "https://goaregnskap.com",
    siteName: "Goa Regnskap",
    locale: "nb_NO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goa Regnskap",
    description:
      "En enkel norsk app for privatøkonomi med rapporter, innsikt og PDF.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="nb">
        <body className="min-h-screen bg-white text-slate-900 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}