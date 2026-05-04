import { CheckCircle2 } from 'lucide-react';

export default function SuccessMessage({ message, testId }: { message: string; testId?: string }) {
  return (
    <div
      className="flex items-start gap-4 rounded-xl border border-lime/40 bg-lime/[0.06] p-6 text-cream"
      data-testid={testId ?? 'success-message'}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-lime" aria-hidden="true" />
      <p className="text-base font-medium leading-relaxed sm:text-lg">{message}</p>
    </div>
  );
}
