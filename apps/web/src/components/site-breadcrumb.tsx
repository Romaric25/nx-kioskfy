import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@kioskfy/ui";
import { Link, useLocation } from "@tanstack/react-router";
import React from "react";
import { ROUTE_LABELS } from "@/lib/route-labels";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface SiteBreadcrumbProps {
  items?: BreadcrumbSegment[];
}

export function SiteBreadcrumb({ items }: SiteBreadcrumbProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Manual mode: explicit items
  if (items && items.length > 0) {
    return (
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/" className="inline-flex items-center gap-1.5">
              Accueil
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <Link
                      to={item.href}
                      className="inline-flex items-center gap-1.5"
                    >
                      {item.label}
                    </Link>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Automatic mode: generated from the URL
  const paths = pathname?.split("/").filter(Boolean) || [];

  if (paths.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link to="/" className="inline-flex items-center gap-1.5">
            Accueil
          </Link>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const href = `/${paths.slice(0, index + 1).join("/")}`;

          let label = ROUTE_LABELS[path] || path.replace(/-/g, " ");

          if (path.length > 20) {
            label = "Détails";
          }

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="capitalize">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <Link
                    to={href}
                    className="inline-flex items-center gap-1.5 capitalize"
                  >
                    {label}
                  </Link>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
