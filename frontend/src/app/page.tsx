"use client";
import dynamic from "next/dynamic";
const Board = dynamic(() => import("@/components/board"), {
  ssr: false,
  loading: () => <main className="loading">در حال آماده‌سازی تخته…</main>,
});
export default function Page() {
  return <Board />;
}
