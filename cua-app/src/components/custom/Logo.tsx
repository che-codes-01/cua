import Link from "next/dist/client/link";
import React from "react";
import { GiCamelHead } from "react-icons/gi";

function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <Link href="/dashboard" className="p-2">
      <div className="flex gap-2 items-center font-bold text-xl">
        <GiCamelHead className="h-8 w-8 " />
        <p>Cuboidal</p>
      </div>
      <div className="font-light text-muted-foreground">
        {subtitle && <span className="text-sm font-normal">{subtitle}</span>}
      </div>
    </Link>
  );
}

export default Logo;
