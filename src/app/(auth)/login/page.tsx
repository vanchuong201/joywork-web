"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/store/useAuth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const fetchMe = useAuth((s) => s.fetchMe);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post("/api/auth/login", values);
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.data.accessToken);
      }
      await fetchMe();
      toast.success("Logged in successfully");
      router.push("/");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-[var(--brand)]" />
          <h1 className="text-xl font-semibold">Login to JoyWork</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Email Address" type="email" {...register("email")} />
          <Input placeholder="Password" type="password" {...register("password")} />
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Don’t have an account? <a className="text-[var(--brand)]" href="/register">Register</a>
        </div>
      </div>
    </div>
  );
}


