"use client";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
};

export function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
  className = "",
  disabled = false,
  label,
  description,
}: ToggleSwitchProps) {
  const switchControl = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-starfeet-blue/30 dark:focus:ring-sky-300/30 disabled:cursor-not-allowed disabled:opacity-60",
        checked 
          ? "border-starfeet-blue bg-starfeet-blue dark:border-sky-300 dark:bg-sky-400" 
          : "border-gray-300 bg-gray-200 dark:border-slate-700 dark:bg-slate-800",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 rounded-full bg-white dark:bg-slate-100 shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );

  if (!label && !description) {
    return switchControl;
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {label ? <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{label}</p> : null}
        {description ? <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {switchControl}
    </div>
  );
}
