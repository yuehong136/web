import upperFirst from 'lodash/upperFirst.js'

export const ExeSQLOptions = [
  'mysql',
  'postgres',
  'mariadb',
  'mssql',
  'IBM DB2',
  'trino',
  'oceanbase',
].map((x) => ({
  label: upperFirst(x),
  value: x,
}))
