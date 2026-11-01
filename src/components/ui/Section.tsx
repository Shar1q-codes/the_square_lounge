import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

type Props = ComponentPropsWithoutRef<"section"> & { id: string };

/** Page section: anchor id, labelled by its SectionHeading (`${id}-title`). */
export function Section({ id, className, children, ...rest }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("relative py-24 md:py-32", className)}
      {...rest}
    >
      <Container>{children}</Container>
    </section>
  );
}
