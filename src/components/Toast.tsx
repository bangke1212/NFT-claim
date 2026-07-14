import { useEffect } from "react";

interface ToastProps {
  toast: { m: string; t: string } | null;
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div className={`fixed top-24 right-4 sm:right-8 z-50 px-4 py-2.5 rounded-full text-sm shadow-lg animate-fadeIn ${
      toast.t === "success" ? "bg-[#166534] text-white" :
      toast.t === "error" ? "bg-[#DC2626] text-white" :
      "bg-[#1A1A1A] text-white"
    }`}>
      {toast.m}
    </div>
  );
}
