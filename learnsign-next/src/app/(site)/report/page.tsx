import { ReportView } from "@/components/report/report-view";

export const metadata = {
  title: "Parent Report",
  description: "AI-generated learning report with progress charts and insights.",
};

export default function ReportPage() {
  return (
    <main className="container py-10">
      <div className="mx-auto max-w-4xl">
        <ReportView />
      </div>
    </main>
  );
}
