import {
  XCardAudioPlayer,
  XCardIcon,
  XCardImage,
  XCardText,
  XCardVideo,
} from './media'
import {
  XCardCard,
  XCardColumn,
  XCardDivider,
  XCardList,
  XCardModal,
  XCardRow,
  XCardTabs,
} from './layout'
import {
  XCardButton,
  XCardCheckBox,
  XCardChoicePicker,
  XCardDateTimeInput,
  XCardSlider,
  XCardTextField,
} from './input'

export * from './media'
export * from './layout'
export * from './input'

export const agentXCardComponents = {
  AudioPlayer: XCardAudioPlayer,
  Button: XCardButton,
  Card: XCardCard,
  CheckBox: XCardCheckBox,
  ChoicePicker: XCardChoicePicker,
  Column: XCardColumn,
  DateTimeInput: XCardDateTimeInput,
  Divider: XCardDivider,
  Icon: XCardIcon,
  Image: XCardImage,
  List: XCardList,
  Modal: XCardModal,
  Row: XCardRow,
  Slider: XCardSlider,
  Tabs: XCardTabs,
  Text: XCardText,
  TextField: XCardTextField,
  Video: XCardVideo,
}
