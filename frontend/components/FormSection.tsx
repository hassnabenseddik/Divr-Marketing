type FormSectionProps = {
  headline: string;
  children: React.ReactNode;
};

export default function FormSection({ headline, children }: FormSectionProps) {
  return (
    <section className="bg-navy-deep">
      <div className="container-x py-20 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2
            className="mb-10 text-3xl font-extrabold tracking-tight text-cream sm:text-4xl"
            data-testid="form-headline"
          >
            {headline}
          </h2>
          <div className="rounded-2xl border border-white/[0.06] bg-navy-soft/40 p-6 sm:p-10">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
