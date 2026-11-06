import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./marquee-banner.module.css";

const DEFAULT_TEXT = "برای خرید با استفاده از اسنپ پی به واتساپ پیام دهید";

/** Put the logo file in /public with this name (or pass `logoSrc`). */
const DEFAULT_LOGO = "/snappay-logo.png";
/** The logo's real pixel size — only the ratio matters, but a correct one avoids the banner shifting while the image loads. */
const LOGO_WIDTH = 160;
const LOGO_HEIGHT = 40;

/**
 * Copies of the message in ONE half of the track. A half must be wider than
 * the screen, otherwise a gap shows up where the loop restarts. 12 copies
 * is roughly 5,000px+ — enough for a 4K monitor.
 */
const COPIES = 12;
/** Seconds each copy takes to scroll by — keeps the speed the same if COPIES changes. */
const SECONDS_PER_COPY = 6;

/**
 * A scrolling promo strip: logo + message, repeated endlessly.
 * Pass `href` to make the whole strip a link (e.g. the WhatsApp chat).
 */
export function MarqueeBanner({
  text = DEFAULT_TEXT,
  logoSrc = DEFAULT_LOGO,
  href,
  className,
}: {
  text?: string;
  logoSrc?: string;
  href?: string;
  className?: string;
}) {
  const half = Array.from({ length: COPIES }, (_, i) => (
    // Each copy is its own RTL row, so the logo sits at the *start* (right
    // side) of the sentence even though the track itself is forced LTR below.
    <div key={i} dir="rtl" className="flex shrink-0 items-center gap-3 whitespace-nowrap px-6 sm:px-10">
      {/* <Image
        src={logoSrc}
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        loading="eager"
        className="h-7 w-auto sm:h-8"
      /> */}
      <span>{text}</span>
    </div>
  ));

  const content = (
    <>
      {/* Screen readers get the message once, not 24 times. */}
      <span className="sr-only">{text}</span>
      {/*
        dir="ltr" on the clipping wrapper (not just the track): a box wider
        than its parent overflows toward the end side of the *parent's*
        direction, so under the page's RTL it would overflow to the left and
        the slide math below would leave a gap.
      */}
      <div aria-hidden="true" dir="ltr" className="overflow-hidden">
        <div
          className={cn(styles.track, "flex w-max")}
          style={{ "--marquee-duration": `${COPIES * SECONDS_PER_COPY}s` } as CSSProperties}
        >
          <div className="flex shrink-0">{half}</div>
          <div className="flex shrink-0">{half}</div>
        </div>
      </div>
    </>
  );

  return (
    <section
      aria-label="اطلاعیه"
      className={cn(
        styles.root,
        " m-6 rounded-lg overflow-hidden bg-[#008efa] py-2.5 text-sm font-bold text-white  sm:text-base",
        className,
      )}
    >
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </section>
  );
}
