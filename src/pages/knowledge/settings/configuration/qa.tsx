import PageRankFormField from '@/components/forms/PageRankFormField';
import { ConfigurationFormContainer } from '../configuration-form-container';
import { TagItems } from '../tag-item';
import { ChunkMethodItem, EmbeddingModelItem } from './common-item';

export function QAConfiguration() {
  return (
    <ConfigurationFormContainer>
      <ChunkMethodItem></ChunkMethodItem>
      <EmbeddingModelItem></EmbeddingModelItem>

      <PageRankFormField></PageRankFormField>

      <TagItems></TagItems>
    </ConfigurationFormContainer>
  );
}
