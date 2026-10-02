export function LiveRegion({ message }) {
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message.text}
      {message.id % 2 === 1 ? "\u00a0" : ""}
    </div>
  );
}
