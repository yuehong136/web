import { memo, useRef, useState, type ChangeEvent, type FC } from 'react'
import { Pause, Play, Video, Volume2, VolumeX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { formatMediaTime } from '../utils'
import { ErrorState } from './preview-state'

const VideoPreviewInner: FC<{
  objectUrl?: string
  sourceUrl: string
}> = ({ objectUrl, sourceUrl }) => {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      void videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current || !videoRef.current.duration) return
    setProgress(
      (videoRef.current.currentTime / videoRef.current.duration) * 100,
    )
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || !videoRef.current.duration) return
    const nextProgress = parseFloat(event.target.value)
    const time = (nextProgress / 100) * videoRef.current.duration
    videoRef.current.currentTime = time
    setProgress(nextProgress)
  }

  if (!objectUrl) {
    return (
      <ErrorState
        icon={<Video className="h-16 w-16" />}
        title={t('knowledge.preview.videoLoadFailed')}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {/* User-uploaded preview files do not expose caption tracks. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={objectUrl}
          className="max-h-full max-w-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
      <div className="bg-background-overlay px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            className="hover:bg-background-surface/20 text-white"
            aria-label={
              isPlaying
                ? t('knowledge.preview.pause')
                : t('knowledge.preview.play')
            }
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <span className="min-w-[40px] text-xs text-white/80">
            {formatMediaTime((progress / 100) * duration)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            aria-label={t('knowledge.preview.videoProgress')}
            className="bg-background-surface/30 h-1 flex-1 cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background-surface"
          />
          <span className="min-w-[40px] text-xs text-white/80">
            {formatMediaTime(duration)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="hover:bg-background-surface/20 text-white"
            aria-label={
              isMuted
                ? t('knowledge.preview.unmute')
                : t('knowledge.preview.mute')
            }
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const VideoPreview = memo(VideoPreviewInner)
