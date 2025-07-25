import { DelimiterFormField, EntityTypesFormField, MaxTokenNumberFormField } from '@/components/forms/CommonFormFields';
import PageRankFormField from '@/components/forms/PageRankFormField';
import { ConfigurationFormContainer } from '../configuration-form-container';
import { TagItems } from '../tag-item';
import { ChunkMethodItem, EmbeddingModelItem } from './common-item';

export function KnowledgeGraphConfiguration() {
  return (
    <ConfigurationFormContainer>
      <ChunkMethodItem></ChunkMethodItem>
      <EmbeddingModelItem></EmbeddingModelItem>

      <PageRankFormField></PageRankFormField>

      <EntityTypesFormField></EntityTypesFormField>
      <MaxTokenNumberFormField max={8192 * 2}></MaxTokenNumberFormField>
      <DelimiterFormField></DelimiterFormField>

      <TagItems></TagItems>
    </ConfigurationFormContainer>
  );
}
