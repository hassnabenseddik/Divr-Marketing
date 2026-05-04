type LogoProps = { className?: string };

/**
 * Divr wordmark — matches the platform header in the provided screenshot:
 * a single lime "Divr" wordmark, no icon.
 */
export default function Logo({ className }: LogoProps) {
  return (
    <span
      className={`select-none font-extrabold tracking-tight text-lime ${className ?? ''}`}
      style={{ fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}
    >
      Divr
    </span>
  );
}
