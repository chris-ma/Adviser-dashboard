interface PageHeaderProps {
  title: string;
  subtitle?: string;
  source?: string;
  asAtDate?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, source, asAtDate, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        {(source || asAtDate) && (
          <p className="text-xs text-muted-foreground mt-1">
            {source && <span>Source: {source}</span>}
            {source && asAtDate && <span className="mx-1">·</span>}
            {asAtDate && <span>As at {asAtDate}</span>}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
