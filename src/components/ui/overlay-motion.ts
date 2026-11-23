/**
 * Enter and exit motion for floating layers, built on tw-animate-css and the
 * motion tokens in themes/appearance.css. Radix keeps a closing layer mounted
 * until its exit animation ends, so `data-[state=closed]` classes play out.
 * Every token is 0 under reduced motion, so the layers then appear at once.
 *
 * Each string spells its classes in full: Tailwind finds classes by scanning
 * source text, so they cannot be assembled from fragments.
 */

/** Menus, selects and popovers grow 4% from the trigger and fade in. */
const floating =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-96 data-[state=closed]:zoom-out-96 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 duration-(--motion-menu) ease-(--ease-out) data-[state=closed]:ease-(--ease-in) motion-reduce:animate-none'

export const popoverMotionClass = `${floating} origin-(--radix-popover-content-transform-origin)`
export const dropdownMotionClass = `${floating} origin-(--radix-dropdown-menu-content-transform-origin)`
export const contextMenuMotionClass = `${floating} origin-(--radix-context-menu-content-transform-origin)`
export const selectMotionClass = `${floating} origin-(--radix-select-content-transform-origin)`
export const hoverCardMotionClass = `${floating} origin-(--radix-hover-card-content-transform-origin)`

/**
 * Tooltips open as `delayed-open` or `instant-open`, never `open`, so the
 * enter animation is unconditional; they use the shorter hover duration.
 */
export const tooltipMotionClass =
  'animate-in fade-in-0 zoom-in-96 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-96 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 duration-(--motion-fast) ease-(--ease-out) origin-(--radix-tooltip-content-transform-origin) motion-reduce:animate-none'

/** Scrims behind dialogs and sheets fade with the panel they cover for. */
export const scrimMotionClass =
  'animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-(--motion-panel) ease-(--ease-out) motion-reduce:animate-none'

/**
 * Centred dialogs scale up from 96%. The native `<dialog>` primitives unmount
 * on close, so only the entrance plays; Radix dialogs also play the exit.
 */
export const dialogPanelMotionClass =
  'animate-in fade-in-0 zoom-in-96 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-96 duration-(--motion-panel) ease-(--ease-out) data-[state=closed]:ease-(--ease-in) motion-reduce:animate-none'

/** Sheets slide from their edge; the side classes live with the sheet. */
export const sheetMotionClass =
  'data-[state=open]:animate-in data-[state=closed]:animate-out duration-(--motion-panel) ease-(--ease-out) data-[state=closed]:ease-(--ease-in) motion-reduce:animate-none'
