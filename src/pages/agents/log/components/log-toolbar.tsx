import { Clock, ListFilter, Search, UserRound } from 'lucide-react'
import { PageToolbar } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import type { AgentFlow } from '@/types/agent'
import { AGENT_LOG_STATUS_LABELS } from '../constants'
import {
  AgentLogStatus,
  type AgentLogParamPatch,
  type AgentLogParams,
} from '../types'
import { CanvasSelector } from './canvas-selector'

interface LogToolbarProps {
  agent?: AgentFlow
  params: AgentLogParams
  onChange: (patch: AgentLogParamPatch) => void
}

export function LogToolbar({ agent, params, onChange }: LogToolbarProps) {
  return (
    <PageToolbar
      left={
        <>
          <span className="shrink-0 text-xs text-text-tertiary">
            当前 Agent
          </span>
          <CanvasSelector
            selectedAgent={agent}
            selectedCanvasId={params.canvas}
            onSelect={(canvas) => onChange({ canvas, page: 1 })}
          />
          {params.canvas ? <div className="h-6 w-px bg-border-subtle" /> : null}
        </>
      }
      right={
        params.canvas ? (
          <>
            <CustomSelect
              size="sm"
              className="w-[120px]"
              value={params.status}
              onChange={(value) =>
                onChange({ status: value as AgentLogStatus })
              }
              options={Object.values(AgentLogStatus).map((status) => ({
                value: status,
                label: AGENT_LOG_STATUS_LABELS[status],
              }))}
            />
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4" />
              {params.from || params.to ? '自定义时间' : '近 24 小时'}
            </Button>
            <Button variant="outline" size="sm">
              <UserRound className="h-4 w-4" />
              {params.user ? params.user : '所有用户'}
            </Button>
            <Input
              type="search"
              inputSize="sm"
              className="w-[300px]"
              placeholder="搜索 session id / query / 用户"
              value={params.keywords || ''}
              onChange={(event) => onChange({ keywords: event.target.value })}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  status: AgentLogStatus.ALL,
                  source: undefined,
                  from: undefined,
                  to: undefined,
                  user: undefined,
                  keywords: undefined,
                  page: 1,
                })
              }
            >
              重置
            </Button>
            <Button variant="outline" size="sm">
              <ListFilter className="h-4 w-4" />
              更多筛选
            </Button>
          </>
        ) : null
      }
    />
  )
}
