interface RoutePlaceholderProps {
  description: string;
  eyebrow: string;
  title: string;
}

export function RoutePlaceholder({
  description,
  eyebrow,
  title,
}: RoutePlaceholderProps) {
  return (
    <section aria-labelledby="route-title" className="route-placeholder">
      <p className="route-placeholder__eyebrow">{eyebrow}</p>
      <h1 id="route-title">{title}</h1>
      <p>{description}</p>
    </section>
  );
}
