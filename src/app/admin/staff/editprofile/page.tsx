"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffEditProfileRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/admin/profile");
  }, [router]);

  return null;
}
