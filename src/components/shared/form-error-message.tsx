export function FormErrorMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}
