import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { ReportView } from "@/components/report/report-view";

export const metadata = {
  title: "Parent Report",
  description: "AI-generated learning report with progress charts and insights.",
};

export default async function ReportPage() {
  // Defence in depth: middleware gates /report, this guard survives a bypass.
  if (!(await getUser())) redirect("/login?redirectTo=/report");

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-4xl">
        <ReportView />
      </div>
    </main>
  );
}
