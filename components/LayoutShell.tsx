"use client";

import { usePathname } from "next/navigation";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumb from "@/components/Breadcrumb";
import EnquiryDrawer from "@/components/EnquiryDrawer";

type Props = {
  children: React.ReactNode;
};

export default function LayoutShell({ children }: Props) {
  const pathname = usePathname();

  const hideLayout = pathname === "/password";

  return (
    <>
      {!hideLayout && <SiteHeader />}
      {!hideLayout && <Breadcrumb />}

      {children}

      {!hideLayout && <SiteFooter />}
      {!hideLayout && <EnquiryDrawer />}
    </>
  );
}