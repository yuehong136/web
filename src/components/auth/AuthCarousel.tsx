import { useState, useEffect } from 'react'
import { ImageWithFallback } from './ImageWithFallback'
import platformAgentImage from '@/assets/images/auth/login-carousel-platform-agent.png'
import platformKnowledgeImage from '@/assets/images/auth/login-carousel-platform-knowledge.png'
import platformObservabilityImage from '@/assets/images/auth/login-carousel-platform-observability.png'

const carouselData = [
  {
    image: platformAgentImage,
    title: '开始您的旅程',
    subtitle: '加入我们的社区，与全球用户一起探索无限可能。',
  },
  {
    image: platformKnowledgeImage,
    title: '创新技术',
    subtitle: '体验最前沿的AI技术，让工作变得更加智能高效。',
  },
  {
    image: platformObservabilityImage,
    title: '快速上手',
    subtitle: '简单几步即可完成注册，立即体验我们的优质服务。',
  },
]

interface AuthCarouselProps {
  gradientFrom?: string
  gradientTo?: string
}

export function AuthCarousel({
  gradientFrom = 'from-components-button-primary-bg',
  gradientTo = 'to-state-focus',
}: AuthCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={`relative hidden min-h-screen overflow-hidden bg-gradient-to-br lg:flex lg:w-1/2 ${gradientFrom} ${gradientTo}`}
    >
      {/* Background Images */}
      {carouselData.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ImageWithFallback
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-contain"
            darkEnhance
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full flex-col justify-end p-12">
        <div className="max-w-md">
          {carouselData.map((slide, index) => (
            <div
              key={index}
              className={`transition-all duration-1000 ease-in-out ${
                index === currentSlide
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              }`}
              style={{
                display: index === currentSlide ? 'block' : 'none',
              }}
            >
              <h2 className="mb-4 text-3xl font-bold text-white">
                {slide.title}
              </h2>
              <p className="text-lg leading-relaxed text-white/90">
                {slide.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Dots Indicator */}
        <div className="mt-8 flex space-x-2">
          {carouselData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-background-surface'
                  : 'bg-background-surface/50 hover:bg-background-surface/70'
              }`}
              aria-label={`转到幻灯片 ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
