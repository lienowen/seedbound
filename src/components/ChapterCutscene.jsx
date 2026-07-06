// Full-screen story card shown once when the player first reaches a chapter's
// starting level. Presents the chapter illustration, kicker, title, narration
// and a single CTA that dismisses into the level underneath.
export function ChapterCutscene({ chapter, locale, onDismiss }) {
  if (!chapter) return null;
  const text = chapter[locale] || chapter.en;
  return (
    <div className="chapter-cut" role="dialog" aria-modal="true" aria-label={text.title}>
      <div className="chapter-cut__veil" onClick={onDismiss} />
      <div className="chapter-cut__card">
        <div className="chapter-cut__art">
          <img src={chapter.image || "/placeholder.svg"} alt="" aria-hidden="true" />
          <div className="chapter-cut__art-fade" />
        </div>
        <div className="chapter-cut__body">
          <span className="chapter-cut__kicker">{text.kicker}</span>
          <h2 className="chapter-cut__title text-balance">{text.title}</h2>
          <p className="chapter-cut__text text-pretty">{text.body}</p>
          <button type="button" className="chapter-cut__cta" onClick={onDismiss}>
            {text.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
