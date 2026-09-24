import React, {
  ButtonHTMLAttributes,
  memo,
  useCallback,
  useRef,
  useState,
} from "react";

export type ButtonVariant = "primary" | "secondary";
export type ButtonStatus = "idle" | "loading" | "success" | "error";
export type BadgeTone = "warning" | "danger" | "info" | "success";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  variant?: ButtonVariant;
  status?: ButtonStatus;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  onClick?: () => void;
}

export interface StatusBadgeProps {
  label: string;
  tone: BadgeTone;
}

export interface ErrorActionsProps {
  status: ButtonStatus;
  onRetry: () => void;
  retryLabel?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

let rippleSeed = 0;

function ButtonBase({
  variant = "primary",
  status = "idle",
  loadingLabel,
  successLabel,
  errorLabel,
  disabled,
  children,
  onClick,
  className,
  ...rest
}: ButtonProps): JSX.Element {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isBusy = status === "loading";
  const isDisabled = Boolean(disabled) || isBusy;

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const button = buttonRef.current;
      if (!button || isDisabled) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      const id = ++rippleSeed;

      setRipples((current) => [...current, { id, x, y, size }]);
      window.setTimeout(() => {
        setRipples((current) => current.filter((ripple) => ripple.id !== id));
      }, 600);
    },
    [isDisabled],
  );

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    onClick?.();
  }, [isDisabled, onClick]);

  const label =
    status === "loading" && loadingLabel
      ? loadingLabel
      : status === "success" && successLabel
        ? successLabel
        : status === "error" && errorLabel
          ? errorLabel
          : children;

  const classes = [
    "styx-button",
    `styx-button--${variant}`,
    status !== "idle" ? `styx-button--${status}` : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      ref={buttonRef}
      type={rest.type ?? "button"}
      className={classes}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isBusy}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <span className="styx-button__spinner" aria-hidden="true" />
      <span className="styx-button__check" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14" focusable="false">
          <path
            d="M3 8.5 6.2 11.7 13 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="styx-button__label">{label}</span>

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="styx-button__ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </button>
  );
}

export const Button = memo(ButtonBase);

function StatusBadgeBase({ label, tone }: StatusBadgeProps): JSX.Element {
  return (
    <span className={`status-badge status-badge--${tone}`} role="status">
      <span className="status-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export const StatusBadge = memo(StatusBadgeBase);

function ErrorActionsBase({
  status,
  onRetry,
  retryLabel = "Try Again",
}: ErrorActionsProps): JSX.Element {
  return (
    <div className="error-actions">
      <Button
        variant="primary"
        status={status}
        onClick={onRetry}
        loadingLabel="Retrying…"
        successLabel="Reconnected"
        errorLabel="Still offline"
        aria-label={retryLabel}
      >
        {retryLabel}
      </Button>
    </div>
  );
}

export const ErrorActions = memo(ErrorActionsBase);
