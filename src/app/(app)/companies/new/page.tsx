"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/i, "Only letters, numbers and hyphens")
    .min(2),
  tagline: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCompanyPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post("/api/companies", values);
      toast.success("Company created");
      router.push(`/companies/${data.data.company.slug}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? "Create failed");
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Create New Company</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input placeholder="Company Name" {...register("name")} />
        <Input placeholder="Slug (unique)" {...register("slug")} />
        <Input placeholder="Tagline" {...register("tagline")} />
        <Textarea placeholder="Description" rows={5} {...register("description")} />
        <Button disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</Button>
      </form>
    </div>
  );
}


