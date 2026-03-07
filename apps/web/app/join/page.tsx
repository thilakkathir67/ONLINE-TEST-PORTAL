import { JoinTestCard } from "../../components/join-test-card";



export default function JoinPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h2 className="text-2xl font-semibold tracking-tight">Join a Test</h2>
      <p className="mt-2 text-white/65">Paste the test link or enter the test code.</p>
      <div className="mt-6">
        <JoinTestCard />
      </div>
    </div>
  );
}
