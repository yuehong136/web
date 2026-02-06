import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  darkEnhance?: boolean;
  disableDarkFilter?: boolean;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc = "data:image/svg+xml,%3csvg%20width='100'%20height='100'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20width='100'%20height='100'%20fill='%23f3f4f6'/%3e%3c/svg%3e",
  darkEnhance = false,
  disableDarkFilter = false
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <img
      src={hasError ? fallbackSrc : src}
      alt={alt}
      className={className}
      data-dark-enhance={darkEnhance ? "true" : undefined}
      data-no-filter={disableDarkFilter ? "true" : undefined}
      onError={() => setHasError(true)}
    />
  );
}
