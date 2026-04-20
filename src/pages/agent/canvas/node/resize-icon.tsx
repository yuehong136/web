export function ResizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      strokeWidth="2.5"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-secondary hover:text-components-system-accent-text transition-colors"
      style={{
        position: 'absolute',
        right: 4,
        bottom: 4,
      }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="16 20 20 20 20 16" />
      <line x1="14" y1="14" x2="20" y2="20" />
    </svg>
  )
}

export const controlStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'nwse-resize',
}

