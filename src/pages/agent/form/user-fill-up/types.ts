export interface UserFillUpInputItem {
  name?: string
  type?: string
  value?: string
  optional?: boolean
}

export interface UserFillUpFormValues {
  enable_tips?: boolean
  tips?: string
  inputs?: UserFillUpInputItem[]
}
