import { ResultClient } from "../../../components/result-client";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ResultClient attemptId={attemptId} />
    </div>
  );
}
