import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Access",
  description: "Private access to the Sparesco website.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}