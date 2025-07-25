import { AutoKeywordsFormField, AutoQuestionsFormField } from '@/components/forms/AutoKeywordsFormField';
import GraphRagItems from '@/components/forms/GraphRagFormFields';
import RaptorFormFields from '@/components/forms/RaptorFormFields';
import { ConfigurationFormContainer, MainContainer } from '../configuration-form-container';
import { TagItems } from '../tag-item';

export function AudioConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer title="智能增强">
        <AutoKeywordsFormField></AutoKeywordsFormField>
        <AutoQuestionsFormField></AutoQuestionsFormField>
      </ConfigurationFormContainer>
      <ConfigurationFormContainer title="高级配置">
        <RaptorFormFields></RaptorFormFields>
        <GraphRagItems></GraphRagItems>
      </ConfigurationFormContainer>
      <ConfigurationFormContainer title="标签管理">
        <TagItems></TagItems>
      </ConfigurationFormContainer>
    </MainContainer>
  );
}
