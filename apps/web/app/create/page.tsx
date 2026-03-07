import { CreateTestForm } from "../../components/create-test-form";

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Create a Test</h2>
        <p className="mt-2 text-white/65">
          Add questions manually or generate using AI. Login is optional (only needed for saving & analytics).
        </p>
      </div>
      <CreateTestForm />
    </div>
  );
}
