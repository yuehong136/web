import { useMemo } from 'react'
import { initialIterationStartValues } from '../../constant'
import { Output, type OutputType } from '../components/output'

export function IterationStartForm() {
  const outputList = useMemo<OutputType[]>(() => {
    return Object.entries(initialIterationStartValues.outputs || {}).map(
      ([key, value]) => ({
        title: key,
        type: value?.type,
      }),
    )
  }, [])

  return (
    <section className="space-y-6 p-space-base">
      <Output list={outputList} />
    </section>
  )
}
