"use client";

import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";

export function DeleteDocumentButton({
  id,
  itemLabel,
  action,
}: {
  id: string;
  itemLabel: string;
  action: (id: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();

  return (
    <DeleteButton
      id={id}
      itemLabel={itemLabel}
      action={action}
      onDeleted={() => router.push("/documents")}
    />
  );
}
