"use client";

import Image from "next/image";
import { useState } from "react";

export function AccountAvatar({
  name,
  src,
  className,
  sizes,
}: {
  name: string;
  src?: string | null;
  className: string;
  sizes: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#0F1F42] font-extrabold text-white ${className}`}>
      {src && failedSrc !== src ? (
        <Image
          alt={`${name} profile image`}
          className="object-cover"
          fill
          onError={() => setFailedSrc(src)}
          sizes={sizes}
          src={src}
        />
      ) : initials(name)}
    </span>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
