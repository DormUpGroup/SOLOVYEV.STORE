import Image from "next/image";

const LOGO_SRC = "/assets/logo.jpg";
const LOGO_ALT = "SOLOVYEV STORE";

interface StoreLogoMarkProps {
  size?: number;
  className?: string;
}

export function StoreLogoMark({ size = 40, className = "store-logo" }: StoreLogoMarkProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt={LOGO_ALT}
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export { LOGO_ALT, LOGO_SRC };
