"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  /** Switch 尺寸变体 */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    root: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'data-[state=checked]:translate-x-4',
  },
  md: {
    root: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'data-[state=checked]:translate-x-5',
  },
  lg: {
    root: 'h-7 w-[52px]',
    thumb: 'h-6 w-6',
    translate: 'data-[state=checked]:translate-x-[26px]',
  },
};

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size = 'md', ...props }, ref) => {
  const config = sizeConfig[size];
  
  return (
    <SwitchPrimitive.Root
      className={cn(
        // 基础样式
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full",
        // 边框和背景
        "border-2 border-transparent",
        // 过渡动画 - 更平滑的 200ms 过渡
        "transition-all duration-200 ease-out",
        // 焦点样式 - 现代化的 ring 效果
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background-body)]",
        // 禁用状态
        "disabled:cursor-not-allowed disabled:opacity-50",
        // 选中/未选中状态背景 - 添加微妙的内阴影
        "data-[state=checked]:bg-[var(--color-components-switch-bg-checked)]",
        "data-[state=unchecked]:bg-[var(--color-components-switch-bg)]",
        // 悬停效果 - 未选中时轻微变深
        "data-[state=unchecked]:hover:bg-[var(--color-border-default)]",
        // 选中时的悬停效果 - 轻微变亮
        "data-[state=checked]:hover:brightness-110",
        // 尺寸
        config.root,
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          // 基础样式
          "pointer-events-none block rounded-full",
          // 背景色
          "bg-[var(--color-components-switch-thumb)]",
          // 阴影 - 现代化的多层阴影效果
          "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]",
          // 过渡动画 - 弹性效果
          "transition-transform duration-200 ease-out",
          // 位置
          "data-[state=unchecked]:translate-x-0",
          // 尺寸
          config.thumb,
          config.translate
        )}
      />
    </SwitchPrimitive.Root>
  );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch }