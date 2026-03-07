"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "./ui";

export function JoinTestCard() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function parseSlug(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // allow full link: /t/slug or http://.../t/slug
    const match = trimmed.match(/\/t\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    // allow raw slug
    return trimmed;
  }

  function go() {
    const slug = parseSlug(value);
    if (!slug) return alert("Enter a valid link or code");
    router.push(`/t/${slug}`);
  }

  return (
    <Card>
      <div className="text-lg font-semibold">Enter Test Link / Code</div>
      <div className="mt-5">
        <Label>Link or code</Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Paste link or code (e.g., AbC123xYz)" />
          <Button onClick={go} className="sm:w-40">Join</Button>
        </div>
      </div>
    </Card>
  );
}
