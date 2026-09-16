export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  autoComplete,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
  step?: string;
  min?: string;
}) {
  return (
    <label className="block text-sm font-medium mb-3">
      <span className="block mb-1 text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        step={step}
        min={min}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  required,
  placeholder,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-medium mb-3">
      <span className="block mb-1 text-foreground">{label}</span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  required,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm font-medium mb-3">
      <span className="block mb-1 text-foreground">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mb-3 rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mb-3 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success">
      {message}
    </p>
  );
}

export function SubmitButton({
  children,
  pending,
  full = true,
}: {
  children: React.ReactNode;
  pending?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${full ? "w-full" : ""} rounded-lg bg-primary text-primary-contrast font-semibold py-2.5 px-4 disabled:opacity-60`}
    >
      {pending ? "Please wait..." : children}
    </button>
  );
}
