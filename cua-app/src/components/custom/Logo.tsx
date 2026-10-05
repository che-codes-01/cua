import Link from "next/link";
import React from "react";
import { GiCamelHead } from "react-icons/gi";

function Logo({ subtitle, href = "/" }: { subtitle?: string; href?: string }) {
  return (
    <Link href={href} className="p-2">
      <div className="flex gap-2 items-center font-bold text-xl text-white">
        <GiCamelHead className="h-8 w-8" />
        <p>Cuboidal</p>
      </div>
      <div className="font-light text-muted-foreground">
        {subtitle && <span className="text-sm font-normal">{subtitle}</span>}
      </div>
    </Link>
  );
}

export default Logo;
