import { CodeTemplateStrMap, ProgrammingLanguage } from '../constant'

export const CodeTemplateId = {
  StringResult: 'string_result',
  ObjectResult: 'object_result',
  CsvArtifact: 'csv_artifact',
} as const

export type CodeTemplateId =
  (typeof CodeTemplateId)[keyof typeof CodeTemplateId]

type ProgrammingLanguageValue =
  (typeof ProgrammingLanguage)[keyof typeof ProgrammingLanguage]

type CodeTemplatePreset = {
  outputType: 'string' | 'object'
  language?: ProgrammingLanguageValue
  scripts: Record<ProgrammingLanguageValue, string>
}

export const CodeTemplatePresetMap: Record<CodeTemplateId, CodeTemplatePreset> =
  {
    [CodeTemplateId.StringResult]: {
      outputType: 'string',
      scripts: {
        [ProgrammingLanguage.Python]:
          CodeTemplateStrMap[ProgrammingLanguage.Python],
        [ProgrammingLanguage.JavaScript]:
          CodeTemplateStrMap[ProgrammingLanguage.JavaScript],
      },
    },
    [CodeTemplateId.ObjectResult]: {
      outputType: 'object',
      scripts: {
        [ProgrammingLanguage.Python]: `def main(arg1, arg2):
    return {
        "status": "success",
        "arg1": arg1,
        "arg2": arg2,
    }`,
        [ProgrammingLanguage.JavaScript]: `function main(args) {
  const { arg1, arg2 } = args;
  return {
    status: "success",
    arg1,
    arg2,
  };
}

module.exports = { main };`,
      },
    },
    [CodeTemplateId.CsvArtifact]: {
      outputType: 'string',
      language: ProgrammingLanguage.Python,
      scripts: {
        [ProgrammingLanguage.Python]: `from pathlib import Path

def main(arg1, arg2):
    output_dir = Path("artifacts")
    output_dir.mkdir(exist_ok=True)
    (output_dir / "result.csv").write_text(
        f"name,value\\narg1,{arg1}\\narg2,{arg2}\\n",
        encoding="utf-8",
    )
    return "artifact ready"`,
        [ProgrammingLanguage.JavaScript]:
          CodeTemplateStrMap[ProgrammingLanguage.JavaScript],
      },
    },
  } as const
