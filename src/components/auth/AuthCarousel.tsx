import { useState, useEffect } from "react";
import { ImageWithFallback } from "./ImageWithFallback";

const carouselData = [
  {
    image: "https://images.unsplash.com/photo-1740933084056-078fac872bff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc1NDQ0MjE0N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "开始您的旅程",
    subtitle: "加入我们的社区，与全球用户一起探索无限可能。",
  },
  {
    image: "/src/assets/images/auth-carousel-2.png",
    title: "创新技术",
    subtitle: "体验最前沿的AI技术，让工作变得更加智能高效。",
  },
  {
    image: "https://images.unsplash.com/photo-1515355252367-42ae86cb92f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW5ub3ZhdGlvbiUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzU0NTIxNjAzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "快速上手",
    subtitle: "简单几步即可完成注册，立即体验我们的优质服务。",
  },
];

interface AuthCarouselProps {
  gradientFrom?: string;
  gradientTo?: string;
}

export function AuthCarousel({ 
  gradientFrom = "from-primary-600", 
  gradientTo = "to-primary-800" 
}: AuthCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      {/* Background Images */}
      {carouselData.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <ImageWithFallback
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col justify-end p-12 h-full">
        <div className="max-w-md">
          {carouselData.map((slide, index) => (
            <div
              key={index}
              className={`transition-all duration-1000 ease-in-out ${
                index === currentSlide 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                display: index === currentSlide ? "block" : "none",
              }}
            >
              <h2 className="text-white mb-4 text-3xl font-bold">{slide.title}</h2>
              <p className="text-white/90 text-lg leading-relaxed">
                {slide.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Dots Indicator */}
        <div className="flex space-x-2 mt-8">
          {carouselData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "bg-white w-8" 
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`转到幻灯片 ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}