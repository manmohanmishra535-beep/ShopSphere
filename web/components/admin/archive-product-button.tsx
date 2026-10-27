"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

export function ArchiveProductButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const archive = async () => {
    setLoading(true);
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      toast.success("Product archived", `${title} is now hidden from the storefront.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Could not archive product", errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="text-muted hover:text-danger" onClick={() => setOpen(true)} title="Archive product">
        <Archive className="h-3.5 w-3.5" />
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => void archive()}
        loading={loading}
        title="Archive this product?"
        description={`${title} will be removed from the storefront. Existing orders keep their history.`}
        confirmLabel="Archive"
      />
    </>
  );
}
