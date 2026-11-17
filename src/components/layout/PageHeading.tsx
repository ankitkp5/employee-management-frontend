import type { ReactNode } from "react";

interface PageHeadingProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export default function PageHeading({
  title,
  subtitle,
  action,
}: PageHeadingProps) {
  return (
    <div className="topbar">
      <div>
        <div className="eyebrow">EMPLOYEE MANAGEMENT</div>
        <h1>{title}</h1>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>

      <div className="topbar-actions">{action}</div>
    </div>
  );
}
