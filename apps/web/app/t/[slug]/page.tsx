import { TestClient } from "../../../components/test-client";

export default async function TestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <TestClient slug={slug} />
    </div>
  );
}
