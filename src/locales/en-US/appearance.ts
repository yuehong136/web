export const appearanceResource = {
  appearance: {
    title: 'Appearance',
    description:
      'Make room for the way you work. Changes apply immediately on this device.',
    reset: 'Restore defaults',
    saved: 'Saved on this device',
    preset: 'Workspace style',
    presetDescription:
      'Choose a palette. Reading size and density stay yours to decide.',
    presets: {
      ink: {
        name: 'Ink',
        description:
          'Neutral grays with an ink primary; the accent marks selection, focus and citations. The default.',
      },
      mist: {
        name: 'Mist',
        description:
          'Cool blue-gray surfaces with a steel-blue primary, carried over from the previous default.',
      },
      celadon: {
        name: 'Celadon',
        description:
          'Green-tinted grays and a calm celadon accent for search and reading.',
      },
      clay: {
        name: 'Clay',
        description:
          'Warm paper with a clay accent; long answers are set in a serif for writing and research.',
      },
      iris: {
        name: 'Iris',
        description:
          'Violet accents over violet-gray surfaces for building agents and creative work.',
      },
      amber: {
        name: 'Amber',
        description:
          'Graphite surfaces with amber highlights for operations, data and development.',
      },
      custom: {
        name: 'Custom',
        description:
          'Generate the whole palette from your brand color; contrast is checked the same way.',
      },
    },
    mode: 'Color mode',
    modes: { system: 'Follow system', light: 'Light', dark: 'Dark' },
    density: 'Information density',
    densities: { comfortable: 'Comfortable', compact: 'Compact' },
    textScale: 'Reading size',
    scales: { standard: 'Standard', larger: 'Larger', largest: 'Largest' },
    motion: 'Motion',
    motions: { system: 'Follow system', reduced: 'Reduce motion' },
    contrast: 'Contrast',
    contrastDescription:
      'High contrast darkens secondary text, borders and focus rings for bright rooms or when you need crisper text.',
    contrasts: { standard: 'Standard', high: 'High' },
    action: 'Primary button color',
    actionDescription: 'Use ink or the accent for primary and send buttons.',
    actions: { scheme: 'Follow style', ink: 'Ink', accent: 'Accent' },
    brand: {
      title: 'Custom palette',
      description: 'Saved on this device only.',
      color: 'Brand color',
      colorDescription:
        'Sets the accent hue and vividness; lightness is computed for contrast.',
      chroma: 'Vividness',
      neutral: 'Neutral tint',
      neutralDescription: 'Lets the grays carry a little of the brand color.',
    },
    language: 'Interface language',
    languageDescription:
      'Applies to the interface. Your messages and model responses keep their own language.',
    preview: 'Live preview',
    previewDescription: 'A sample conversation using your current preferences.',
    previewQuestion: 'Help me find the key ideas in my research.',
    previewAnswer:
      'Start with the evidence. Group related findings, compare their sources, and turn the strongest ideas into your next step.',
    previewSource: 'Research notes',
    previewSourceDetail:
      'Open sources from a reply to inspect the supporting material here.',
    previewComposer: 'Ask a follow-up',
    previewSend: 'Preview send button',
    previewMenu: 'View a source',
    previewDocument: 'Source detail',
  },
}
