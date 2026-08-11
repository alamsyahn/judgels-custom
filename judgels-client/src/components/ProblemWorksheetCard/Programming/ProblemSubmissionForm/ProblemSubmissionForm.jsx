import { Button, Callout, Intent } from '@blueprintjs/core';
import { WarningSign } from '@blueprintjs/icons';
import { Field, Form } from 'react-final-form';

import { isOutputOnly } from '../../../../modules/api/gabriel/engine';
import {
  getGradingLanguageEditorSubmissionFilename,
  gradingLanguageNamesMap,
} from '../../../../modules/api/gabriel/language.js';
import FormAceEditor from '../../../forms/FormAceEditor/FormAceEditor';
import { FormTableFileInput } from '../../../forms/FormTableFileInput/FormTableFileInput';
import { FormTableSelect2 } from '../../../forms/FormTableSelect2/FormTableSelect2';
import {
  CompatibleFilenameExtensionForGradingLanguage,
  MaxCodeLength50KB,
  MaxFileSize10MB,
  MaxFileSize300KB,
  Required,
  composeValidators,
} from '../../../forms/validations';

import './ProblemSubmissionForm.scss';

export default function ProblemSubmissionForm({
  onSubmit,
  initialValues,
  sourceKeys,
  gradingEngine,
  gradingLanguages,
  submissionWarning,
}) {
  const renderWarning = () => {
    return (
      submissionWarning && (
        <Callout
          icon={<WarningSign />}
          className="programming-problem-submission-form__warning"
          data-key="submission-warning"
        >
          {submissionWarning}
        </Callout>
      )
    );
  };

  const sourceKeyNames = Object.keys(sourceKeys).sort();
  const isSingleSourceCode =
    !isOutputOnly(gradingEngine) &&
    sourceKeyNames.length === 1 &&
    sourceKeys[sourceKeyNames[0]] === 'Source code';

  const renderSourceEditor = gradingLanguage => {
    if (!isSingleSourceCode) {
      return null;
    }

    const field = {
      name: 'editor',
      validate: (value, allValues) => {
        const key = sourceKeyNames[0];
        const uploadedFile =
          allValues &&
          allValues.sourceFiles &&
          allValues.sourceFiles[key];

        if (uploadedFile) {
          return undefined;
        }

        return composeValidators(Required, MaxCodeLength50KB)(
          value,
          allValues
        );
      },
    };

    return (
      <div className="programming-problem-submission-form__editor">
        <Field
          component={FormAceEditor}
          gradingLanguage={gradingLanguage}
          {...field}
        />

        <div className="programming-problem-submission-form__separator">
          <small>... or submit source code file</small>
        </div>
      </div>
    );
  };

  const renderSourceFields = () => {
    let maxFileSize;
    if (isOutputOnly(gradingEngine)) {
      maxFileSize = MaxFileSize10MB;
    } else {
      maxFileSize = MaxFileSize300KB;
    }

    return Object.keys(sourceKeys)
      .sort()
      .map(key => {
        const validateSourceFile = (value, allValues) => {
          if (isSingleSourceCode && !value) {
            return undefined;
          }

          return composeValidators(
            Required,
            maxFileSize,
            CompatibleFilenameExtensionForGradingLanguage
          )(value, allValues);
        };

        const field = {
          name: 'sourceFiles.' + key,
          label: sourceKeys[key],
          validate: validateSourceFile,
        };
        return <Field key={key} component={FormTableFileInput} {...field} />;
      });
  };

  const renderGradingLanguageFields = () => {
    if (isOutputOnly(gradingEngine)) {
      return null;
    }

    const field = {
      name: 'gradingLanguage',
      label: 'Language',
      validate: Required,
      optionValues: gradingLanguages,
      optionNamesMap: gradingLanguageNamesMap,
    };

    return <Field component={FormTableSelect2} {...field} />;
  };

  return (
    <Form
      onSubmit={data => {
        if (isSingleSourceCode) {
          const key = sourceKeyNames[0];

          if (!data.sourceFiles || !data.sourceFiles[key]) {
            data = {
              ...data,
              sourceFiles: {
                ...(data.sourceFiles || {}),
                [key]: new File(
                  [data.editor],
                  getGradingLanguageEditorSubmissionFilename(data.gradingLanguage),
                  { type: 'text/plain' }
                ),
              },
            };
          }
        }

        return onSubmit(data);
      }}
      initialValues={initialValues}
    >
      {({ values, handleSubmit, submitting }) => (
        <form onSubmit={handleSubmit}>
          {renderWarning()}

          {renderSourceEditor(values.gradingLanguage)}

          <table className="programming-problem-submission-form__table">
            <tbody>
              {renderSourceFields()}
              {renderGradingLanguageFields()}
            </tbody>
          </table>

          <Button
            type="submit"
            text="Submit"
            intent={Intent.PRIMARY}
            loading={submitting}
          />
        </form>
      )}
    </Form>
  );
}
