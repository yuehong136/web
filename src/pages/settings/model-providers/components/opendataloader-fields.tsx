import { Input } from '@/components/ui/input'

interface OpenDataLoaderFieldsProps {
  modelName: string
  apiServer: string
  apiKey: string
  timeout: number
  onModelNameChange: (value: string) => void
  onApiServerChange: (value: string) => void
  onApiKeyChange: (value: string) => void
  onTimeoutChange: (value: number) => void
}

export const OpenDataLoaderFields = ({
  modelName,
  apiServer,
  apiKey,
  timeout,
  onModelNameChange,
  onApiServerChange,
  onApiKeyChange,
  onTimeoutChange,
}: OpenDataLoaderFieldsProps) => (
  <>
    <div>
      <label
        htmlFor="opendataloader-model-type"
        className="mb-space-sm block text-sm font-medium text-text-primary"
      >
        模型类型
      </label>
      <Input
        id="opendataloader-model-type"
        value="OCR"
        disabled
        className="bg-surface-secondary cursor-not-allowed"
      />
    </div>
    <div>
      <label
        htmlFor="opendataloader-model-name"
        className="mb-space-sm block text-sm font-medium text-text-primary"
      >
        模型名称 <span className="text-status-error">*</span>
      </label>
      <Input
        id="opendataloader-model-name"
        value={modelName}
        onChange={(event) => onModelNameChange(event.target.value)}
        placeholder="opendataloader-from-env-1"
        required
      />
    </div>
    <div>
      <label
        htmlFor="opendataloader-api-server"
        className="mb-space-sm block text-sm font-medium text-text-primary"
      >
        API Server <span className="text-status-error">*</span>
      </label>
      <Input
        id="opendataloader-api-server"
        value={apiServer}
        onChange={(event) => onApiServerChange(event.target.value)}
        placeholder="http://host.docker.internal:9383"
        required
      />
    </div>
    <div>
      <label
        htmlFor="opendataloader-api-key"
        className="mb-space-sm block text-sm font-medium text-text-primary"
      >
        API Key{' '}
        <span className="ml-space-xs font-normal text-text-tertiary">
          (可选)
        </span>
      </label>
      <Input
        id="opendataloader-api-key"
        type="password"
        value={apiKey}
        onChange={(event) => onApiKeyChange(event.target.value)}
        placeholder="Bearer token"
      />
    </div>
    <div>
      <label
        htmlFor="opendataloader-timeout"
        className="mb-space-sm block text-sm font-medium text-text-primary"
      >
        请求超时（秒）
      </label>
      <Input
        id="opendataloader-timeout"
        type="number"
        min={1}
        value={timeout}
        onChange={(event) =>
          onTimeoutChange(Number.parseInt(event.target.value, 10) || 600)
        }
      />
    </div>
  </>
)
