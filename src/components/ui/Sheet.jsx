import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m as Motion, useDragControls } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useScrollLock } from '../../hooks/useScrollLock';
import { EASE } from '../../lib/motion';

// The one modal of the site. Phones: bottom sheet (drag the grabber/header down to dismiss).
// ≥640px: centred dialog. size="full" is full screen on phones (games) and a large dialog on desktop.
// Always rendered in a portal so no transformed/blurred ancestor can trap it.

const SIZES = {
  md: 'sm:max-w-[42rem]',
  lg: 'sm:max-w-[56rem]',
  xl: 'sm:max-w-[72rem]',
  full: 'sm:max-w-[64rem]',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stack of open sheets so Escape / focus trapping only act on the top-most one.
const openSheets = [];

const subscribeNothing = () => () => {};

export default function Sheet({ open, ...props }) {
  // false on the server and during hydration (no portal there), true in the browser afterwards.
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  if (!isClient) return null;
  return createPortal(<AnimatePresence>{open && <SheetPanel {...props} />}</AnimatePresence>, document.body);
}

function SheetPanel({
  onClose,
  title,
  subtitle,
  size = 'md',
  footer,
  children,
  bodyClassName = '',
  initialFocusRef,
  hideTitle = false,
}) {
  const { t } = useLanguage();
  const isPhone = !useMediaQuery('(min-width: 640px)');
  const isFull = size === 'full';
  const titleId = useId();
  const panelRef = useRef(null);
  const sheetId = useRef(Symbol('sheet'));
  const dragControls = useDragControls();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useScrollLock(true);

  // Focus: move into the panel on open, trap Tab inside, give focus back to the trigger on close.
  useEffect(() => {
    const id = sheetId.current;
    const previouslyFocused = document.activeElement;
    openSheets.push(id);

    const panel = panelRef.current;
    const target = initialFocusRef?.current ?? panel;
    target?.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (openSheets[openSheets.length - 1] !== id) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = openSheets.indexOf(id);
      if (index !== -1) openSheets.splice(index, 1);
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [initialFocusRef]);

  const panelMotion = isPhone
    ? {
        initial: { y: '100%' },
        animate: { y: 0, transition: { duration: 0.42, ease: EASE.emphasized } },
        exit: { y: '100%', transition: { duration: 0.28, ease: EASE.exit } },
      }
    : {
        initial: { opacity: 0, scale: 0.98, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.24, ease: EASE.emphasized } },
        exit: { opacity: 0, scale: 0.98, transition: { duration: 0.18, ease: EASE.exit } },
      };

  const canDrag = isPhone && !isFull;
  const startDrag = (event) => {
    if (canDrag) dragControls.start(event);
  };

  // size="full" stays full screen on short landscape phones too (≤500px tall), where a centred dialog would
  // leave a game only ~240px of height; side padding then clears the notch. (Class names must stay literal
  // for Tailwind to generate them.)
  const panelShape = isFull
    ? 'h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[min(90dvh,56rem)] sm:rounded-sheet [@media(max-height:500px)]:!h-[100dvh] [@media(max-height:500px)]:!max-h-[100dvh] [@media(max-height:500px)]:!max-w-none [@media(max-height:500px)]:!rounded-none'
    : 'max-h-[92dvh] rounded-t-sheet sm:max-h-[min(85dvh,56rem)] sm:rounded-sheet';
  const notchSafeSides = isFull
    ? '[@media(max-height:500px)]:!pl-[max(1.5rem,env(safe-area-inset-left))] [@media(max-height:500px)]:!pr-[max(1.5rem,env(safe-area-inset-right))]'
    : '';

  // Without a visible title the bar would only carry the close button: the button floats at the top-right instead
  // and the body starts just below it (phones: under the 44px grabber strip, which stays the drag handle).
  // Full-screen sheets keep their bar, which also clears the status bar and the notch.
  const floatingClose = hideTitle && !subtitle && !isFull;
  const bodyTop = !floatingClose ? 'pt-5' : canDrag ? 'pt-3' : 'pt-14';
  const close = () => onCloseRef.current?.();

  return (
    <div
      className={`fixed inset-0 z-sheet flex items-end justify-center sm:items-center sm:p-6 ${
        isFull ? '[@media(max-height:500px)]:!p-0' : ''
      }`}
    >
      <Motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={() => onCloseRef.current?.()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE.standard } }}
        exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE.exit } }}
      />

      <Motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex w-full flex-col overflow-hidden bg-surface-1 shadow-sheet outline-none ${panelShape} ${SIZES[size] ?? SIZES.md}`}
        drag={canDrag ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onCloseRef.current?.();
        }}
        {...panelMotion}
      >
        {floatingClose ? (
          <>
            {/* Still names the dialog (aria-labelledby). */}
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            {canDrag && (
              <div aria-hidden="true" className="h-11 shrink-0 touch-none" onPointerDown={startDrag}>
                <div className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-white/25" />
              </div>
            )}
            <CloseButton label={t.ui.close} onClose={close} floating />
          </>
        ) : (
          <div
            className={`shrink-0 ${canDrag ? 'touch-none' : ''} ${isFull ? 'pt-[env(safe-area-inset-top)] sm:pt-0' : ''}`}
            onPointerDown={startDrag}
          >
            {canDrag && <div aria-hidden="true" className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-white/25" />}
            {/* A hidden title here (full-screen sheet, or a subtitle shown): no divider line under the bar. */}
            <header
              className={`flex items-center gap-3 py-1.5 pl-5 pr-3 sm:py-2 sm:pl-6 sm:pr-4 ${notchSafeSides} ${
                hideTitle ? '' : 'border-b border-separator/10'
              }`}
            >
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className={`truncate text-body font-semibold text-label-1 ${hideTitle ? 'sr-only' : ''}`}>
                  {title}
                </h2>
                {subtitle && <p className="truncate text-footnote text-label-2">{subtitle}</p>}
              </div>
              <CloseButton label={t.ui.close} onClose={close} />
            </header>
          </div>
        )}

        <div
          className={`relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 sm:pb-6 ${bodyTop} ${notchSafeSides} ${
            footer ? 'pb-5' : 'pb-[max(1.5rem,env(safe-area-inset-bottom))]'
          } ${bodyClassName}`}
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-separator/10 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4">
            {footer}
          </div>
        )}
      </Motion.div>
    </div>
  );
}

// A 44px target around a 30px circle. Floating over the body, the circle sits on an opaque base of the sheet's
// own colour: it looks the same at rest, and content scrolling under it doesn't show through.
function CloseButton({ label, onClose, floating = false }) {
  const circle = (
    <span className="grid size-[30px] place-items-center rounded-full bg-white/10 text-label-2 transition-colors duration-fast group-hover:bg-white/15 group-hover:text-label-1 group-active:bg-white/20">
      <Icon icon="solar:close-linear" className="size-4" aria-hidden="true" />
    </span>
  );

  return (
    <button
      type="button"
      onClick={onClose}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={label}
      className={
        floating
          ? 'group absolute right-3 top-2 z-raised grid size-tap place-items-center rounded-full sm:right-4'
          : 'group grid size-tap shrink-0 place-items-center rounded-full'
      }
    >
      {floating ? <span className="grid rounded-full bg-surface-1">{circle}</span> : circle}
    </button>
  );
}
