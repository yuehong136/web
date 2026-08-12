interface UnavailableCapability {
  enabled: false
  reason: string
}

const unavailable = (reason: string): UnavailableCapability => ({
  enabled: false,
  reason,
})

/**
 * API Key / OpenAPI 工作台当前真实可用能力。
 *
 * 未接后端的能力必须保持 disabled；开放时应先补 API 契约和行为测试，
 * 再把对应项改为可用，禁止用延时或随机响应模拟成功。
 */
export const apiKeysCapabilities = {
  edit: unavailable('后端暂未提供 API Key 更新接口'),
  liveRequest: unavailable('在线接口调试尚未开放'),
  saveCase: unavailable('保存为用例尚未开放'),
  saveEnvironment: unavailable('保存为环境尚未开放'),
} as const
