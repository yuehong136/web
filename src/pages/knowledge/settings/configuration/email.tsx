import { AutoKeywordsFormField, AutoQuestionsFormField } from '@/components/forms/AutoKeywordsFormField';
import PageRankFormField from '@/components/forms/PageRankFormField';
import GraphRagItems from '@/components/forms/GraphRagFormFields';
import RaptorFormFields from '@/components/forms/RaptorFormFields';
import { ConfigurationFormContainer } from '../configuration-form-container';
import { TagItems } from '../tag-item';
import { ChunkMethodItem, EmbeddingModelItem } from './common-item';

export function EmailConfiguration() {
  return (
    <ConfigurationFormContainer>
      <ChunkMethodItem></ChunkMethodItem>
      <EmbeddingModelItem></EmbeddingModelItem>

      <PageRankFormField></PageRankFormField>

      <>
        <AutoKeywordsFormField></AutoKeywordsFormField>
        <AutoQuestionsFormField></AutoQuestionsFormField>
      </>

      <RaptorFormFields></RaptorFormFields>

      <GraphRagItems marginBottom></GraphRagItems>

      <TagItems></TagItems>
    </ConfigurationFormContainer>
  );
}
