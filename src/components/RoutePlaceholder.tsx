interface RoutePlaceholderProps {
  description: string;
  eyebrow: string;
  note: string;
  title: string;
}

export function RoutePlaceholder({
  description,
  eyebrow,
  note,
  title,
}: RoutePlaceholderProps) {
  return (
    <section aria-labelledby="route-title" className="route-preview">
      <div>
        <p className="route-preview__eyebrow">{eyebrow}</p>
        <h1 id="route-title">{title}</h1>
        <p className="route-preview__description">{description}</p>
      </div>
      <p className="route-preview__note">{note}</p>
    </section>
  );
}
