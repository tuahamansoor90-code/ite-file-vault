type AppErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type AppErrorEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: AppErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __appErrorEvents?: AppErrorEvents;
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[FileVault Error]", error, context);
}
