import { AutoKeywordsFormField, AutoQuestionsFormField } from '@/components/forms/AutoKeywordsFormField';
import { LayoutRecognizeFormField } from '@/components/forms/CommonFormFields';
import PageRankFormField from '@/components/forms/PageRankFormField';
import GraphRagItems from '@/components/forms/GraphRagFormFields';
import RaptorFormFields from '@/components/forms/RaptorFormFields';
import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container';
import { TagItems } from '../tag-item';
import { ChunkMethodItem, EmbeddingModelItem } from './common-item';

export function BookConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <ChunkMethodItem></ChunkMethodItem>
        <LayoutRecognizeFormField></LayoutRecognizeFormField>
        <EmbeddingModelItem></EmbeddingModelItem>

        <PageRankFormField></PageRankFormField>
      </ConfigurationFormContainer>

      <ConfigurationFormContainer>
        <AutoKeywordsFormField></AutoKeywordsFormField>
        <AutoQuestionsFormField></AutoQuestionsFormField>
      </ConfigurationFormContainer>

      <ConfigurationFormContainer>
        <RaptorFormFields></RaptorFormFields>
      </ConfigurationFormContainer>

      <GraphRagItems marginBottom className="p-10"></GraphRagItems>

      <ConfigurationFormContainer>
        <TagItems></TagItems>
      </ConfigurationFormContainer>
    </MainContainer>
  );
}
