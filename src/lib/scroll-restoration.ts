interface ScrollPositionSnapshot {
  distanceFromBottom: number;
  maxScroll: number;
  scrollY: number;
  topicOffset: number | null;
  topicSlug: string | null;
}

const bottomTolerance = 96;

function captureScrollPosition(): ScrollPositionSnapshot {
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('[data-topic]'),
  );
  let currentSection: HTMLElement | undefined;

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 180) currentSection = section;
  }

  return {
    distanceFromBottom: maxScroll - window.scrollY,
    maxScroll,
    scrollY: window.scrollY,
    topicOffset: currentSection?.getBoundingClientRect().top ?? null,
    topicSlug: currentSection?.dataset.topic ?? null,
  };
}

function restoreScrollPosition(snapshot: ScrollPositionSnapshot) {
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  let top: number;

  if (snapshot.distanceFromBottom <= bottomTolerance) {
    top = maxScroll - snapshot.distanceFromBottom;
  } else {
    const topic = snapshot.topicSlug
      ? document.querySelector<HTMLElement>(
          `[data-topic="${CSS.escape(snapshot.topicSlug)}"]`,
        )
      : null;

    if (topic && snapshot.topicOffset !== null) {
      top =
        window.scrollY +
        topic.getBoundingClientRect().top -
        snapshot.topicOffset;
    } else if (snapshot.maxScroll > 0) {
      top = (snapshot.scrollY / snapshot.maxScroll) * maxScroll;
    } else {
      top = snapshot.scrollY;
    }
  }

  window.scrollTo({
    behavior: 'instant',
    left: window.scrollX,
    top: Math.min(maxScroll, Math.max(0, top)),
  });
}

export function preserveScrollOnNextAstroNavigation() {
  const snapshot = captureScrollPosition();

  function restore() {
    window.clearTimeout(cleanupTimer);
    window.requestAnimationFrame(() => restoreScrollPosition(snapshot));
  }

  document.addEventListener('astro:after-swap', restore, { once: true });
  const cleanupTimer = window.setTimeout(
    () => document.removeEventListener('astro:after-swap', restore),
    10_000,
  );
}
