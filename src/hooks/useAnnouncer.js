import { useCallback, useState } from "react";

/**
 * Text for a polite live region. The id lets LiveRegion change the DOM even
 * when the same sentence is announced twice in a row.
 */
export function useAnnouncer() {
  const [message, setMessage] = useState({ text: "", id: 0 });
  const announce = useCallback((text) => setMessage((current) => ({ text, id: current.id + 1 })), []);
  return [message, announce];
}
