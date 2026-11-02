"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

type Props = Omit<Extract<ButtonProps, { href?: undefined }>, "type"> & { pendingLabel?: string };

/** Submit button that disables itself while its form's server action runs. */
export function SubmitButton({ children, pendingLabel, disabled, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
