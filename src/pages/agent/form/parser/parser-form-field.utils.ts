import type { SelectOptionGroup } from '@/components/ui/select-with-search'

function hasOptionValue(options: SelectOptionGroup[], value: string) {
  return options.some((option) => {
    if (option.value === value) {
      return true
    }

    return option.options?.some((item) => item.value === value) || false
  })
}

export function ensureCurrentOption(
  options: SelectOptionGroup[],
  value: string | undefined,
  label?: string,
) {
  if (!value || hasOptionValue(options, value)) {
    return options
  }

  return [{ label: label || value, value }, ...options]
}

export function buildFlatOptions(
  values: string[],
  labelBuilder: (value: string) => string,
) {
  return values.map((value) => ({
    label: labelBuilder(value),
    value,
  }))
}

export function buildModelOptions(groups: { label: string; options: { label: string; value: string }[] }[]) {
  return groups.map((group) => ({
    label: group.label,
    options: group.options.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  }))
}
