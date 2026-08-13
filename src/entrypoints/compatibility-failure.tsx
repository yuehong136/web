import { mountFailure } from './mount-application'
import { CompatibilityFailure } from './compatibility-failure-view'

export function mountCompatibilityFailure(): void {
  mountFailure(<CompatibilityFailure />)
}
