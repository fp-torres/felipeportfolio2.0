import { Icon } from '@iconify/react';

// Calm empty / error block used inside the Laboratório sheets: icon, short title, explanation, actions.
// Landscape phones (≤500px tall) get less padding and side-by-side actions, so "Try again" stays in view.
export default function LabStatus({ icon, title, text, children }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 px-2 py-10 text-center [@media(max-height:500px)]:py-3"
    >
      <Icon icon={icon} className="size-7 text-label-2" aria-hidden="true" />
      <div>
        <p className="text-title-3 text-label-1">{title}</p>
        {text && <p className="mx-auto mt-1 max-w-[28rem] text-callout text-label-2">{text}</p>}
      </div>
      {children && (
        <div className="mt-2 flex flex-col items-center gap-1 [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-5">
          {children}
        </div>
      )}
    </div>
  );
}
