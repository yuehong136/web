import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Circle,
  Download,
  Edit,
  FileText,
  Folder,
  Heart,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Info,
  Lock,
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  ShoppingCart,
  Star,
  StopCircle,
  Upload,
  User,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toDisplayString } from './shared'

const iconMap: Record<string, LucideIcon> = {
  accountCircle: User,
  add: Circle,
  arrowBack: ArrowLeft,
  arrowForward: ArrowRight,
  attachFile: FileText,
  calendarToday: Calendar,
  call: Phone,
  camera: Camera,
  check: Check,
  close: X,
  delete: X,
  download: Download,
  edit: Edit,
  event: Calendar,
  error: AlertTriangle,
  fastForward: ArrowRight,
  favorite: Heart,
  favoriteOff: Heart,
  folder: Folder,
  help: HelpCircle,
  home: Home,
  info: Info,
  locationOn: MapPin,
  lock: Lock,
  lockOpen: Lock,
  mail: Mail,
  menu: Menu,
  moreHoriz: MoreHorizontal,
  moreVert: MoreVertical,
  notifications: Info,
  notificationsOff: Info,
  pause: Pause,
  payment: ShoppingCart,
  person: User,
  phone: Phone,
  photo: ImageIcon,
  play: Play,
  print: FileText,
  refresh: RefreshCw,
  rewind: ArrowLeft,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  shoppingCart: ShoppingCart,
  skipNext: ArrowRight,
  skipPrevious: ArrowLeft,
  star: Star,
  starHalf: Star,
  starOff: Star,
  stop: StopCircle,
  upload: Upload,
  visibility: Circle,
  visibilityOff: Circle,
  volumeDown: Volume2,
  volumeMute: Volume2,
  volumeOff: Volume2,
  volumeUp: Volume2,
  warning: AlertTriangle,
}

export function XCardText({
  className,
  text,
  tone = 'default',
  variant = 'body',
}: {
  className?: string
  text?: unknown
  tone?: 'default' | 'inherit'
  variant?: string
}) {
  const displayText = toDisplayString(text)
  return (
    <p
      className={cn(
        'whitespace-pre-wrap text-sm leading-6',
        tone === 'inherit' ? 'text-current' : 'text-text-primary',
        variant === 'h1' && 'text-xl font-semibold',
        variant === 'h2' && 'text-lg font-semibold',
        variant === 'h3' && 'text-base font-semibold',
        variant === 'caption' && (tone === 'inherit' ? 'text-xs' : 'text-xs text-text-secondary'),
        className,
      )}
    >
      {displayText}
    </p>
  )
}

export function XCardImage({
  description,
  fit = 'fill',
  url,
  variant,
}: {
  description?: unknown
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scaleDown'
  url?: unknown
  variant?: string
}) {
  const displayUrl = toDisplayString(url)
  if (!displayUrl) return null

  return (
    <img
      alt={toDisplayString(description)}
      className={cn(
        'w-full rounded-radius-md border border-border-subtle bg-surface-secondary',
        variant === 'icon' || variant === 'avatar' ? 'size-12' : 'max-h-64',
        fit === 'contain' && 'object-contain',
        fit === 'cover' && 'object-cover',
        fit === 'none' && 'object-none',
        fit === 'scaleDown' && 'object-scale-down',
        fit === 'fill' && 'object-fill',
      )}
      src={displayUrl}
    />
  )
}

export function XCardIcon({ name }: { name?: unknown }) {
  const iconName = toDisplayString(name)
  const Icon = iconMap[iconName] || Circle
  return <Icon aria-label={iconName} className="h-icon-md w-icon-md text-text-secondary" />
}

export function XCardVideo({ url }: { url?: unknown }) {
  const displayUrl = toDisplayString(url)
  if (!displayUrl) return null
  return <video className="w-full rounded-radius-md" controls src={displayUrl} />
}

export function XCardAudioPlayer({
  description,
  url,
}: {
  description?: unknown
  url?: unknown
}) {
  const displayUrl = toDisplayString(url)
  if (!displayUrl) return null
  return (
    <div className="space-y-space-xs">
      {description ? <p className="text-xs text-text-secondary">{toDisplayString(description)}</p> : null}
      <audio className="w-full" controls src={displayUrl} />
    </div>
  )
}
