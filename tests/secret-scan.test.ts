import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function scan(content: string) {
  const dir = mkdtempSync(join(tmpdir(), "pausal-secret-"));
  const file = join(dir, "probe.env");
  writeFileSync(file, content);
  try {
    return spawnSync(
      join(root, "node_modules", ".bin", "secretlint"),
      ["--secretlintrc", join(root, ".secretlintrc.json"), file],
      { cwd: root, encoding: "utf8" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("secret scan", () => {
  it("fails on an AWS secret access key", () => {
    // Built at runtime so the repository scan does not flag this test file.
    // AWS's published EXAMPLE key is allowlisted by the rule, so use a made-up value.
    const key = ["wJalrXUtnFEMI", "K7MDENG", "bPxRfiCYzzzzzzzzzz"].join("/");
    const res = scan(`aws_secret_access_key = "${key}"\n`);
    expect(res.status).not.toBe(0);
    expect(res.stdout + res.stderr).toContain("AWSSecretAccessKey");
  });

  it("passes on a clean file", () => {
    expect(scan("PAUSAL_MODE=demo\n").status).toBe(0);
  });
});
