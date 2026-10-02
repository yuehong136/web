import type { Catalog } from '@ant-design/x-card'
import type { AgentXCardCommand } from '../types'

export const upgradeCardCatalog: Catalog = {
  $id: 'local://stack-upgrade',
  components: {
    Column: { type: 'object' },
    Button: { type: 'object' },
    Text: { type: 'object' },
  },
}

export const actionCardCommands: AgentXCardCommand[] = [
  {
    version: 'v0.9',
    createSurface: {
      surfaceId: 'upgrade-card',
      catalogId: 'local://stack-upgrade',
    },
  },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId: 'upgrade-card',
      components: [
        { id: 'root', component: 'Column', children: ['submit'] },
        {
          id: 'submit',
          component: 'Button',
          child: 'label',
          action: {
            event: {
              name: 'confirm',
              context: { choice: { path: '/choice' } },
            },
          },
        },
        { id: 'label', component: 'Text', text: 'Confirm fixture' },
      ],
    },
  },
  {
    version: 'v0.9',
    updateDataModel: {
      surfaceId: 'upgrade-card',
      path: '/choice',
      value: 'test',
    },
  },
]
