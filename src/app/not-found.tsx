import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 pt-24 text-center">
      <p className="text-xs tracking-widest text-turquoise">{fa.notFound.code}</p>
      <h1 className="mt-4 font-display text-4xl text-ivory">{fa.notFound.title}</h1>
      <p className="mt-4 text-silver">{fa.notFound.subtitle}</p>
      <Link href="/" className="mt-8">
        <Button>{fa.notFound.home}</Button>
      </Link>
    </div>
  );
}
