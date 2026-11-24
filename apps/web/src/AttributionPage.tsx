const LINK = "text-accent underline underline-offset-4";
const ABO = "https://amazon-berkeley-objects.s3.amazonaws.com/index.html";
const PAPER = "https://arxiv.org/abs/2110.06199";
const LICENCE = "https://creativecommons.org/licenses/by/4.0/";

/** Catalog credit and licence (AD-12). Static; outside links open in a new tab so the session tally survives. */
export function AttributionPage() {
  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-4 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mt-2 font-serif text-title">Attribution</h1>
      <div className="mt-4 space-y-4 rounded-md border border-border bg-card p-4 md:p-6">
        <p>
          Product data and images: <a className={LINK} target="_blank" rel="noreferrer" href={ABO}>Amazon Berkeley Objects</a>, credit Amazon.com, licensed under{" "}
          <a className={LINK} target="_blank" rel="noreferrer" href={LICENCE}>CC BY 4.0</a>.
        </p>
        <p>
          Collins et al. ABO: Dataset and Benchmarks for Real-World 3D Object Understanding. CVPR 2022.{" "}
          <a className={LINK} target="_blank" rel="noreferrer" href={PAPER}>arXiv:2110.06199</a>.
        </p>
        <p>Changes: Pausall uses a slice of the catalog, resizes the product images and adds generated text (taglines and reason lines).</p>
        <p>Amazon does not endorse this project.</p>
        <p>The sample clips are AI-generated.</p>
      </div>
    </main>
  );
}
