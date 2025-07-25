import { AutoKeywordsFormField, AutoQuestionsFormField } from '@/components/forms/AutoKeywordsFormField';
import { DelimiterFormField, LayoutRecognizeFormField, MaxTokenNumberFormField, ExcelToHtmlFormField } from '@/components/forms/CommonFormFields';
import GraphRagItems from '@/components/forms/GraphRagFormFields';
import RaptorFormFields from '@/components/forms/RaptorFormFields';
import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container';
import { TagItems } from '../tag-item';

export function NaiveConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer title="基础配置">
        <LayoutRecognizeFormField></LayoutRecognizeFormField>
        <MaxTokenNumberFormField initialValue={512}></MaxTokenNumberFormField>
        <DelimiterFormField></DelimiterFormField>
      </ConfigurationFormContainer>
      <ConfigurationFormContainer title="智能增强">
        <AutoKeywordsFormField></AutoKeywordsFormField>
        <AutoQuestionsFormField></AutoQuestionsFormField>
        <ExcelToHtmlFormField></ExcelToHtmlFormField>
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
