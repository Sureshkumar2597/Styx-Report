/* ======================================================================
   Waits until a subtree is actually "settled" and safe to snapshot:
   fonts loaded, images loaded, two paint cycles elapsed, plus a small
   fixed buffer for any last CSS transition. Pure DOM/browser API,
   no React dependency — reusable outside this project too.
   ====================================================================== */

function waitForFonts(): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts?.ready) return Promise.resolve();
  return fonts.ready.then(() => undefined);
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  const pending = images.filter((img) => !img.complete);

  if (pending.length === 0) return Promise.resolve();

  return Promise.all(
    pending.map(
      (img) =>
        new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true }); // don't hang the whole export on one broken image
        }),
    ),
  ).then(() => undefined);
}

function waitTwoPaints(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export interface WaitForRenderOptions {
  /** Extra fixed buffer after fonts/images/paints resolve, to absorb
   *  any chart library's own internal draw delay (e.g. SVG chart libs
   *  that finish their layout a tick after mount). */
  extraBufferMs?: number;
}

export async function waitForRenderSettled(
  root: HTMLElement,
  options: WaitForRenderOptions = {},
): Promise<void> {
  const { extraBufferMs = 250 } = options;

  await Promise.all([waitForFonts(), waitForImages(root)]);
  await waitTwoPaints();
  if (extraBufferMs > 0) await wait(extraBufferMs);
}
