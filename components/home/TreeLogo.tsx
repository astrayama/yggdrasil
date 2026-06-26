import Image from "next/image";

type TreeLogoProps = {
  className?: string;
  title?: string;
  decorative?: boolean;
};

export function TreeLogo({
  className = "",
  title = "Yggdrasil tree logo",
  decorative = false,
}: TreeLogoProps) {
  return (
    <Image
      src="/yggdrasil-logo.svg"
      alt={decorative ? "" : title}
      className={className}
      width={394}
      height={418}
      aria-hidden={decorative ? true : undefined}
      priority
    />
  );
}
