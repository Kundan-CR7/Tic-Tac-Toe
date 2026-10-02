/** Animates its height between 0 and auto; hidden content is inert. */
export function Collapse({ open, children }) {
  return (
    <div className="collapse" data-open={open || undefined} inert={!open}>
      <div className="collapse-inner">{children}</div>
    </div>
  );
}
