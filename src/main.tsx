import {
  ClientRuntime,
  selectApplicationRuntime,
} from '@/entrypoints/runtime-selection'
import { mountCompatibilityFailure } from '@/entrypoints/compatibility-failure'
import { mountDesktopApplication } from '@/entrypoints/desktop'
import { mountWebApplication } from '@/entrypoints/web'

const protocol = window.location.protocol
const host = window.location.host
const isDesktopDocument = protocol === 'app:' && host === 'bundle'
const selection = selectApplicationRuntime({
  protocol,
  host,
  ...(isDesktopDocument ? { bridge: window.multiRagDesktop } : {}),
})

switch (selection.runtime) {
  case ClientRuntime.WEB:
    mountWebApplication()
    break
  case ClientRuntime.DESKTOP:
    mountDesktopApplication(selection.composition)
    break
  case ClientRuntime.INCOMPATIBLE:
    mountCompatibilityFailure()
    break
}
