interface ReelDropLogoProps {
  className?: string;
  alt?: string;
}

export function ReelDropLogo({ className = "h-8 md:h-10 w-auto", alt = "ReelDrop Logo" }: ReelDropLogoProps) {
  return (
    <>
      {/* Dark mode logo (green) */}
      <img 
        src="/images/reeldrop_logoa_green.svg" 
        alt={alt}
        className={`dark:block hidden ${className}`}
      />
      {/* Light mode logo (black) */}
      <img 
        src="/images/reeldrop_logoa_black.svg" 
        alt={alt}
        className={`dark:hidden block ${className}`}
      />
    </>
  );
}