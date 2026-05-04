import Image from 'next/image';

type HeroProps = {
  headline: string;
  subline: string;
  imageUrl: string;
  imageAlt: string;
};

export default function Hero({ headline, subline, imageUrl, imageAlt }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      <div className="container-x py-24 sm:py-32 lg:py-40">
        <div className="max-w-3xl">
          <h1
            className="text-4xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-6xl"
            data-testid="hero-headline"
          >
            {headline}
          </h1>
          <p
            className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/85 sm:text-xl"
            data-testid="hero-subline"
          >
            {subline}
          </p>
        </div>
      </div>
    </section>
  );
}
