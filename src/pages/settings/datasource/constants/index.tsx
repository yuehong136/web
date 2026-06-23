import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Github, Mail, Server } from 'lucide-react'
import SvgIcon from '@/components/ui/svg-icon'
import { DataSourceKey, type IDataSourceInfoMap } from '../types'
import { getBaseFormFields, getDataSourceFormFields } from './form-fields'

// 导入数据源 SVG 图标
import s3Icon from '@/assets/svg/data-source/s3.svg'
import r2Icon from '@/assets/svg/data-source/r2.svg'
import googleCloudStorageIcon from '@/assets/svg/data-source/google-cloud-storage.svg'
import oracleStorageIcon from '@/assets/svg/data-source/oracle-storage.svg'
import dropboxIcon from '@/assets/svg/data-source/dropbox.svg'
import boxIcon from '@/assets/svg/data-source/box.svg'
import webdavIcon from '@/assets/svg/data-source/webdav.svg'
import notionIcon from '@/assets/svg/data-source/notion.svg'
import confluenceIcon from '@/assets/svg/data-source/confluence.svg'
import jiraIcon from '@/assets/svg/data-source/jira.svg'
import asanaIcon from '@/assets/svg/data-source/asana.svg'
import airtableIcon from '@/assets/svg/data-source/airtable.svg'
import zendeskIcon from '@/assets/svg/data-source/zendesk.svg'
import gitlabIcon from '@/assets/svg/data-source/gitlab.svg'
import bitbucketIcon from '@/assets/svg/data-source/bitbucket.svg'
import googleDriveIcon from '@/assets/svg/data-source/google-drive.svg'
import gmailIcon from '@/assets/svg/data-source/gmail.svg'
import discordIcon from '@/assets/svg/data-source/discord.svg'
import moodleIcon from '@/assets/svg/data-source/moodle.svg'

export { DataSourceFormDefaultValues } from './default-values'
export { getBaseFormFields, getDataSourceFormFields } from './form-fields'

const ICON_SIZE = 28

/**
 * 生成数据源元信息（名称、描述、图标）
 */
export const generateDataSourceInfo = (
  t: (key: string) => string,
): IDataSourceInfoMap => ({
  [DataSourceKey.S3]: {
    name: 'S3',
    description: t('datasource.s3Description'),
    icon: (
      <SvgIcon src={s3Icon} width={ICON_SIZE} height={ICON_SIZE} alt="S3" />
    ),
  },
  [DataSourceKey.R2]: {
    name: 'R2',
    description: t('datasource.r2Description'),
    icon: (
      <SvgIcon src={r2Icon} width={ICON_SIZE} height={ICON_SIZE} alt="R2" />
    ),
  },
  [DataSourceKey.GOOGLE_CLOUD_STORAGE]: {
    name: 'Google Cloud Storage',
    description: t('datasource.googleCloudStorageDescription'),
    icon: (
      <SvgIcon
        src={googleCloudStorageIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Google Cloud Storage"
      />
    ),
  },
  [DataSourceKey.OCI_STORAGE]: {
    name: 'Oracle Storage',
    description: t('datasource.ociStorageDescription'),
    icon: (
      <SvgIcon
        src={oracleStorageIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Oracle Storage"
      />
    ),
  },
  [DataSourceKey.DROPBOX]: {
    name: 'Dropbox',
    description: t('datasource.dropboxDescription'),
    icon: (
      <SvgIcon
        src={dropboxIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Dropbox"
      />
    ),
  },
  [DataSourceKey.BOX]: {
    name: 'Box',
    description: t('datasource.boxDescription'),
    icon: (
      <SvgIcon src={boxIcon} width={ICON_SIZE} height={ICON_SIZE} alt="Box" />
    ),
  },
  [DataSourceKey.WEBDAV]: {
    name: 'WebDAV',
    description: t('datasource.webdavDescription'),
    icon: (
      <SvgIcon
        src={webdavIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="WebDAV"
      />
    ),
  },
  [DataSourceKey.NOTION]: {
    name: 'Notion',
    description: t('datasource.notionDescription'),
    icon: (
      <SvgIcon
        src={notionIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Notion"
      />
    ),
  },
  [DataSourceKey.CONFLUENCE]: {
    name: 'Confluence',
    description: t('datasource.confluenceDescription'),
    icon: (
      <SvgIcon
        src={confluenceIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Confluence"
      />
    ),
  },
  [DataSourceKey.JIRA]: {
    name: 'Jira',
    description: t('datasource.jiraDescription'),
    icon: (
      <SvgIcon src={jiraIcon} width={ICON_SIZE} height={ICON_SIZE} alt="Jira" />
    ),
  },
  [DataSourceKey.ASANA]: {
    name: 'Asana',
    description: t('datasource.asanaDescription'),
    icon: (
      <SvgIcon
        src={asanaIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Asana"
      />
    ),
  },
  [DataSourceKey.AIRTABLE]: {
    name: 'Airtable',
    description: t('datasource.airtableDescription'),
    icon: (
      <SvgIcon
        src={airtableIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Airtable"
      />
    ),
  },
  [DataSourceKey.ZENDESK]: {
    name: 'Zendesk',
    description: t('datasource.zendeskDescription'),
    icon: (
      <SvgIcon
        src={zendeskIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Zendesk"
      />
    ),
  },
  [DataSourceKey.GITHUB]: {
    name: 'GitHub',
    description: t('datasource.githubDescription'),
    icon: <Github className="h-7 w-7 text-text-primary" />,
  },
  [DataSourceKey.GITLAB]: {
    name: 'GitLab',
    description: t('datasource.gitlabDescription'),
    icon: (
      <SvgIcon
        src={gitlabIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="GitLab"
      />
    ),
  },
  [DataSourceKey.BITBUCKET]: {
    name: 'Bitbucket',
    description: t('datasource.bitbucketDescription'),
    icon: (
      <SvgIcon
        src={bitbucketIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Bitbucket"
      />
    ),
  },
  [DataSourceKey.MYSQL]: {
    name: 'MySQL',
    description: t('datasource.mysqlDescription'),
    icon: <Database className="size-icon-lg text-text-primary" />,
  },
  [DataSourceKey.POSTGRESQL]: {
    name: 'PostgreSQL',
    description: t('datasource.postgresqlDescription'),
    icon: <Server className="size-icon-lg text-text-primary" />,
  },
  [DataSourceKey.GOOGLE_DRIVE]: {
    name: 'Google Drive',
    description: t('datasource.googleDriveDescription'),
    icon: (
      <SvgIcon
        src={googleDriveIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Google Drive"
      />
    ),
  },
  [DataSourceKey.GMAIL]: {
    name: 'Gmail',
    description: t('datasource.gmailDescription'),
    icon: (
      <SvgIcon
        src={gmailIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Gmail"
      />
    ),
  },
  [DataSourceKey.DISCORD]: {
    name: 'Discord',
    description: t('datasource.discordDescription'),
    icon: (
      <SvgIcon
        src={discordIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Discord"
      />
    ),
  },
  [DataSourceKey.MOODLE]: {
    name: 'Moodle',
    description: t('datasource.moodleDescription'),
    icon: (
      <SvgIcon
        src={moodleIcon}
        width={ICON_SIZE}
        height={ICON_SIZE}
        alt="Moodle"
      />
    ),
  },
  [DataSourceKey.IMAP]: {
    name: 'IMAP',
    description: t('datasource.imapDescription'),
    icon: <Mail className="h-7 w-7 text-text-secondary" />,
  },
})

/**
 * Hook: 获取数据源信息
 */
export const useDataSourceInfo = () => {
  const { t } = useTranslation()

  const dataSourceInfo = useMemo(() => generateDataSourceInfo(t), [t])

  return { dataSourceInfo }
}

/**
 * Hook: 获取表单字段配置
 */
export const useDataSourceFormFields = () => {
  const { t } = useTranslation()

  const formFields = useMemo(() => getDataSourceFormFields(t), [t])
  const baseFields = useMemo(() => getBaseFormFields(), [])

  return { formFields, baseFields }
}

/**
 * 数据源类型分组
 */
export const DataSourceGroups = {
  storage: [
    DataSourceKey.S3,
    DataSourceKey.R2,
    DataSourceKey.GOOGLE_CLOUD_STORAGE,
    DataSourceKey.OCI_STORAGE,
    DataSourceKey.DROPBOX,
    DataSourceKey.BOX,
    DataSourceKey.WEBDAV,
  ],
  collaboration: [
    DataSourceKey.NOTION,
    DataSourceKey.CONFLUENCE,
    DataSourceKey.JIRA,
    DataSourceKey.ASANA,
    DataSourceKey.AIRTABLE,
    DataSourceKey.ZENDESK,
  ],
  codeRepository: [
    DataSourceKey.GITHUB,
    DataSourceKey.GITLAB,
    DataSourceKey.BITBUCKET,
  ],
  database: [DataSourceKey.MYSQL, DataSourceKey.POSTGRESQL],
  communication: [
    DataSourceKey.GOOGLE_DRIVE,
    DataSourceKey.GMAIL,
    DataSourceKey.DISCORD,
    DataSourceKey.MOODLE,
    DataSourceKey.IMAP,
  ],
}

export { DataSourceKey } from '../types'
