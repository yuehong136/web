export interface ReferenceMetadataConfig {
  include?: boolean
  /** Missing/null selects all fields; [] explicitly selects none. */
  fields?: string[] | null
}
