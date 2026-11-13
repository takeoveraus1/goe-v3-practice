import Image from "next/image";
import { cn } from "@/lib/cn";

/** The G.O.E Next Level logo (white, on a transparent background). */
export function Logo({ className }: { className?: string }) {
  return <Image src="/goe-logo.png" width={407} height={240} alt="G.O.E Next Level" priority className={cn("h-10 w-auto", className)} />;
}
