import { useCallback, useState } from "react";

export interface Feedback {
  error: string;
  notice: string;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
  clear: () => void;
}

// Error / success messages shown at the top of every page.
export function useFeedback(): Feedback {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const clear = useCallback(() => {
    setError("");
    setNotice("");
  }, []);

  return { error, notice, setError, setNotice, clear };
}
