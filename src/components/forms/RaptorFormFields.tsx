'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SliderInputFormField } from './SliderInputFormField'
import { RaptorScopeOptions, DefaultRaptorPrompt } from '@/types/knowledge-form'

interface RaptorFormFieldsProps {
  className?: string
}

export function RaptorFormFields({ className }: RaptorFormFieldsProps) {
  const form = useFormContext()

  const useRaptor = useWatch({
    control: form.control,
    name: 'parser_config.raptor.use_raptor',
    defaultValue: false,
  })

  // 生成随机种子
  const handleGenerateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 10000)
    form.setValue('parser_config.raptor.random_seed', randomSeed)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 启用 RAPTOR */}
      <FormField
        control={form.control}
        name="parser_config.raptor.use_raptor"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip="RAPTOR 常应用于复杂的多跳问答任务。如需打开，请跳转至知识库的文件页面，点击生成 > RAPTOR 开启。"
              className="text-sm text-text-secondary w-1/4 shrink-0"
            >
              使用召回增强 RAPTOR 策略
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
          </FormItem>
        )}
      />

      {/* 生成范围 */}
      <FormField
        control={form.control}
        name="parser_config.raptor.scope"
        render={({ field }) => (
          <FormItem className="flex items-start gap-1 space-y-0">
            <FormLabel
              tooltip="选择 RAPTOR 的生成范围：整个知识库或单个文件。"
              className="text-sm text-text-secondary w-1/4 shrink-0 pt-2"
            >
              生成范围
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  {RaptorScopeOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <RadioGroupItem value={opt.value} />
                      <span className="text-sm text-text-secondary">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </div>
          </FormItem>
        )}
      />

      {useRaptor && (
        <>
          {/* 提示词 */}
          <FormField
            control={form.control}
            name="parser_config.raptor.prompt"
            render={({ field }) => (
              <FormItem className="flex items-start gap-1 space-y-0">
                <FormLabel
                  tooltip="系统提示为大模型提供任务描述、规定回复方式，以及设置其他各种要求。系统提示通常与 key（变量）合用，通过变量设置大模型的输入数据。"
                  className="text-sm text-text-secondary w-1/4 shrink-0 pt-2"
                >
                  提示词
                </FormLabel>
                <div className="w-3/4">
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || DefaultRaptorPrompt}
                      placeholder="请输入摘要生成提示词"
                      rows={6}
                      className="resize-none font-mono text-xs"
                    />
                  </FormControl>
                  <FormMessage className="mt-1" />
                </div>
              </FormItem>
            )}
          />

          {/* 最大 Token */}
          <SliderInputFormField
            name="parser_config.raptor.max_token"
            label="最大 Token"
            tooltip="用于设定每个被总结的文本块的最大 token 数。"
            min={0}
            max={2048}
            step={1}
            defaultValue={256}
            layout="horizontal"
          />

          {/* 阈值 */}
          <SliderInputFormField
            name="parser_config.raptor.threshold"
            label="聚类阈值"
            tooltip="在 RAPTOR 中，数据块会根据它们的语义相似性进行聚类。阈值设定了数据块被分到同一组所需的最小相似度。阈值越高，每个聚类中的数据块越少；阈值越低，则每个聚类中的数据块越多。"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.1}
            layout="horizontal"
          />

          {/* 最大聚类数 */}
          <SliderInputFormField
            name="parser_config.raptor.max_cluster"
            label="最大聚类数"
            tooltip="最多可创建的聚类数。"
            min={1}
            max={1024}
            step={1}
            defaultValue={64}
            layout="horizontal"
          />

          {/* 随机种子 */}
          <FormField
            control={form.control}
            name="parser_config.raptor.random_seed"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormLabel className="text-sm text-text-secondary w-1/4 shrink-0">
                  随机种子
                </FormLabel>
                <div className="w-3/4 flex items-center gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className="h-9 flex-1"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRandomSeed}
                    className="h-9 px-3"
                    title="生成随机种子"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}

export default RaptorFormFields
