import React from 'react'

/**
 * 波浪式文字动画组件
 * 文字逐字符渐隐浮起效果
 */
interface WaveTextProps {
  text: string
  className?: string
  charDelay?: number // 每个字符的延迟间隔(ms)
  duration?: number // 动画持续时间(ms)
}

export const WaveText: React.FC<WaveTextProps> = ({
  text,
  className = '',
  charDelay = 40,
  duration = 600,
}) => {
  const characters = text.split('')

  return (
    <>
      <style>
        {`
          @keyframes waveCharFadeUp {
            0% {
              opacity: 0;
              transform: translateY(12px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <span className={className}>
        {characters.map((char, index) => (
          <span
            key={index}
            className="inline-block"
            style={{
              opacity: 0,
              animation: `waveCharFadeUp ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              animationDelay: `${index * charDelay}ms`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </>
  )
}
