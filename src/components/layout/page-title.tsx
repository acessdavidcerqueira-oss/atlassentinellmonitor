import type { ReactNode } from "react";

export function PageTitle({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold text-atlas-text">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-atlas-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
