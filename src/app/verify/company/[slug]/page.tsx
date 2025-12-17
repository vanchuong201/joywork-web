"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type StatementToVerify = {
  id: string;
  title: string;
  description?: string;
  expiresAt?: string;
};

type VerificationData = {
  company: {
    id: string;
    name: string;
    slug: string;
  };
  contact: {
    email: string;
    name?: string;
  };
  statements: StatementToVerify[];
};

function VerifyCompanyStatementsContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params?.slug;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [data, setData] = useState<VerificationData | null>(null);
  const [answers, setAnswers] = useState<Record<string, "YES" | "NO">>({});

  useEffect(() => {
    const token = searchParams.get("token");
    if (!slug || !token) {
      setError("Liên kết xác thực không hợp lệ. Vui lòng mở lại từ email.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        const res = await fetch(
          `${API_BASE_URL}/api/companies/public/${encodeURIComponent(
            slug,
          )}/statements/verify?token=${encodeURIComponent(token || "")}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const msg =
            body?.error?.message ||
            body?.message ||
            "Không thể tải danh sách tuyên bố cần xác thực.";
          setError(msg);
          setData(null);
        } else {
          const body = await res.json();
          setData(body.data as VerificationData);
          setAnswers({});
        }
      } catch (e) {
        console.error(e);
        setError("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug, searchParams]);

  const handleAnswerChange = (statementId: string, value: "YES" | "NO") => {
    setAnswers((prev) => ({ ...prev, [statementId]: value }));
  };

  const handleSubmit = async () => {
    if (!data) return;
    const token = searchParams.get("token");
    if (!token) {
      setError("Thiếu token xác thực.");
      return;
    }

    const payloadAnswers = Object.entries(answers).map(([statementId, answer]) => ({
      statementId,
      answer,
    }));

    if (!payloadAnswers.length) {
      setError("Vui lòng chọn Đúng/Không đúng cho ít nhất một tuyên bố trước khi gửi.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(
        `${API_BASE_URL}/api/companies/public/${encodeURIComponent(
          data.company.slug,
        )}/statements/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            answers: payloadAnswers,
          }),
        },
      );

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          body?.error?.message ||
          body?.message ||
          "Không thể gửi phản hồi. Vui lòng thử lại.";
        setError(msg);
        return;
      }

      const updated = body?.data?.updated ?? 0;
      if (updated > 0) {
        setSuccessMessage("Cảm ơn bạn đã xác thực các cam kết của doanh nghiệp.");
      } else {
        setSuccessMessage("Không có cam kết nào được cập nhật (có thể bạn đã xác thực trước đó).");
      }

      // Reload danh sách tuyên bố còn lại
      setAnswers({});
      // Re-trigger effect by updating searchParams reference is tricky; just refetch directly
      // using existing logic with token & slug
      // We emulate by calling fetchData logic inline
      (async () => {
        try {
          setLoading(true);
          const res2 = await fetch(
            `${API_BASE_URL}/api/companies/public/${encodeURIComponent(
              data.company.slug,
            )}/statements/verify?token=${encodeURIComponent(token)}`,
            { cache: "no-store" },
          );
          if (res2.ok) {
            const b2 = await res2.json();
            setData(b2.data as VerificationData);
          } else {
            setData(null);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    } catch (e) {
      console.error(e);
      setError("Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4" />
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h1 className="text-lg font-semibold text-slate-900 mb-2">
            Liên kết xác thực không khả dụng
          </h1>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <p className="text-xs text-slate-400">
            Vui lòng kiểm tra lại email từ JOYWork hoặc liên hệ bộ phận nhân sự của công ty.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const hasStatements = data.statements.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Xác thực cam kết từ {data.company.name}
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            Email của bạn: <span className="font-medium">{data.contact.email}</span>
            {data.contact.name && (
              <> &middot; Xin chào <span className="font-medium">{data.contact.name}</span></>
            )}
          </p>

          {successMessage && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {hasStatements ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Vui lòng xác thực các cam kết sau đây bằng cách chọn{" "}
                <span className="font-semibold">Đúng</span> hoặc{" "}
                <span className="font-semibold">Không đúng</span> cho từng mục.
              </p>

              <div className="space-y-4 mb-6">
                {data.statements.map((s) => {
                  const selected = answers[s.id];
                  return (
                    <div
                      key={s.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/60"
                    >
                      <div className="font-semibold text-slate-900 mb-1">{s.title}</div>
                      {s.description && (
                        <div className="text-sm text-slate-600 mb-2 whitespace-pre-line">
                          {s.description}
                        </div>
                      )}
                      {s.expiresAt && (
                        <div className="text-xs text-slate-400 mb-3">
                          Thời hạn xác thực đến:{" "}
                          {new Date(s.expiresAt).toLocaleString("vi-VN")}
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(s.id, "YES")}
                          className={`px-3 py-1.5 rounded-full text-sm border ${
                            selected === "YES"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500"
                          }`}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(s.id, "NO")}
                          className={`px-3 py-1.5 rounded-full text-sm border ${
                            selected === "NO"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-slate-700 border-slate-200 hover:border-red-500"
                          }`}
                        >
                          Không đúng
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  Sau khi gửi, bạn sẽ không thể thay đổi phản hồi cho các cam kết này.
                </p>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Đang gửi..." : "Gửi phản hồi"}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              Hiện tại không có cam kết nào cần bạn xác thực. Cảm ơn bạn đã dành thời gian!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyCompanyStatementsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyCompanyStatementsContent />
    </Suspense>
  );
}


