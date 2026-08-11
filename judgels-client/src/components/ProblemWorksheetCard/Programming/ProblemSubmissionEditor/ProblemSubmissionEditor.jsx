import { Button, Callout, Intent } from '@blueprintjs/core';
import { BanCircle } from '@blueprintjs/icons';
import classNames from 'classnames';
import { Component } from 'react';
import { Field, Form } from 'react-final-form';

import {
  getAllowedGradingLanguages,
  getGradingLanguageEditorSubmissionFilename,
  getGradingLanguageEditorSubmissionHint,
  gradingLanguageNamesMap,
} from '../../../../modules/api/gabriel/language.js';
import { VerdictCode } from '../../../../modules/api/gabriel/verdict.js';
import { decodeBase64 } from '../../../../utils/base64';
import { ContentCard } from '../../../ContentCard/ContentCard';
import FormAceEditor from '../../../forms/FormAceEditor/FormAceEditor';
import { FormTableFileInput } from '../../../forms/FormTableFileInput/FormTableFileInput';
import { FormTableSelect2 } from '../../../forms/FormTableSelect2/FormTableSelect2';
import {
  CompatibleFilenameExtensionForGradingLanguage,
  MaxCodeLength50KB,
  MaxFileSize300KB,
  Required,
  composeValidators,
} from '../../../forms/validations';
import { ProblemSubmissionSummary } from '../ProblemSubmissionSummary/ProblemSubmissionSummary';

import './ProblemSubmissionEditor.scss';

export class ProblemSubmissionEditor extends Component {
  currentTimeout;

  state = {
    isResponsiveButtonClicked: false,
    lastSubmissionJid: null,
    submission: undefined,
    submissionUrl: undefined,
  };

  submit = async data => {
    const {
      config: { sourceKeys },
      onSubmit,
    } = this.props;

    const sourceFiles = {};
    Object.keys(sourceKeys).forEach(key => {
      const uploadedFile = data.sourceFiles && data.sourceFiles[key];

      sourceFiles[key] =
        uploadedFile ||
        new File([data.editor], getGradingLanguageEditorSubmissionFilename(data.gradingLanguage), {
          type: 'text/plain',
        });
    });

    const { submission, submissionUrl } = await onSubmit({
      gradingLanguage: data.gradingLanguage,
      sourceFiles,
    });

    this.setState(
      {
        lastSubmissionJid: submission.jid,
        submission: undefined,
        submissionUrl,
      },
      () => {
        this.currentTimeout = setTimeout(this.reloadSubmission, 0);
      }
    );
  };

  reloadSubmission = async () => {
    const submission = await this.props.onGetSubmission(this.state.lastSubmissionJid);

    this.setState({
      submission: submission,
    });

    const verdictCode = submission.latestGrading?.verdict.code || VerdictCode.PND;
    if (verdictCode === VerdictCode.PND) {
      this.currentTimeout = setTimeout(this.reloadSubmission, 1500);
    } else {
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = undefined;
        this.props.onReloadProblem();
      }
    }
  };

  closeSubmissionSummary = () => {
    this.setState({ lastSubmissionJid: null });
  };

  renderEditor = () => {
    const {
      shouldReset,
      onReset,
      skeletons,
      lastSubmissionSource,
      config: { gradingEngine, gradingLanguageRestriction, sourceKeys },
      reasonNotAllowedToSubmit,
      preferredGradingLanguage,
      renderNavigation,
    } = this.props;

    if (reasonNotAllowedToSubmit) {
      return (
        <Callout icon={<BanCircle />} className="secondary-info">
          <span data-key="reason-not-allowed-to-submit">{this.props.reasonNotAllowedToSubmit}</span>
        </Callout>
      );
    }

    const gradingLanguages = getAllowedGradingLanguages(gradingEngine, gradingLanguageRestriction);

    let defaultGradingLanguage = preferredGradingLanguage;
    if (gradingLanguages.indexOf(defaultGradingLanguage) === -1) {
      defaultGradingLanguage = gradingLanguages.length === 0 ? undefined : gradingLanguages[0];
    }

    const gradingLanguageField = {
      name: 'gradingLanguage',
      label: 'Language',
      validate: Required,
      optionValues: gradingLanguages,
      optionNamesMap: gradingLanguageNamesMap,
    };

    const validateEditor = (value, allValues) => {
      const sourceFiles = (allValues && allValues.sourceFiles) || {};
      const hasUploadedFile = Object.keys(sourceFiles).some(key => sourceFiles[key]);

      if (hasUploadedFile) {
        return undefined;
      }

      return composeValidators(Required, MaxCodeLength50KB)(value, allValues);
    };

    const editorField = {
      name: 'editor',
      validate: validateEditor,
      autoFocus: true,
    };

    const validateSourceFile = (value, allValues) => {
      if (!value) {
        return undefined;
      }

      return composeValidators(
        MaxFileSize300KB,
        CompatibleFilenameExtensionForGradingLanguage
      )(value, allValues);
    };

    const initialValues = {
      gradingLanguage: defaultGradingLanguage,
    };

    let canReset = false;

    (skeletons || []).forEach(skeleton => {
      if (skeleton.languages.indexOf(defaultGradingLanguage) >= 0) {
        initialValues.editor = decodeBase64(skeleton.content);
        canReset = true;
      }
    });

    if (!shouldReset && lastSubmissionSource) {
      Object.keys(lastSubmissionSource.submissionFiles).forEach(key => {
        initialValues.editor = decodeBase64(lastSubmissionSource.submissionFiles[key].content);
      });
    }

    return (
      <Form onSubmit={this.submit} initialValues={initialValues}>
        {({ values, handleSubmit, submitting, dirty }) => {
          const submissionHint = getGradingLanguageEditorSubmissionHint(values.gradingLanguage);

          return (
            <form onSubmit={handleSubmit} className={classNames({ show: this.state.isResponsiveButtonClicked })}>
              {canReset && (
                <div className="editor-header">
                  <Button className="reset-button" small text="Reset code" intent={Intent.NONE} onClick={onReset} />
                </div>
              )}

              {submissionHint && (
                <p>
                  <small>{submissionHint}</small>
                </p>
              )}

              <Field component={FormAceEditor} {...editorField} gradingLanguage={values.gradingLanguage} />

              <div className="editor-file-separator">
                <small>... or submit source code file</small>
              </div>

              <table className="editor-options-table">
                <tbody>
                  {Object.keys(sourceKeys)
                    .sort()
                    .map(key => {
                      const sourceFileField = {
                        name: 'sourceFiles.' + key,
                        label: sourceKeys[key],
                        validate: validateSourceFile,
                      };

                      return <Field key={key} component={FormTableFileInput} {...sourceFileField} />;
                    })}

                  <Field component={FormTableSelect2} {...gradingLanguageField} />
                </tbody>
              </table>

              <ProblemSubmissionSummary
                submissionJid={this.state.lastSubmissionJid}
                submission={this.state.submission}
                submissionUrl={this.state.submissionUrl}
                onClose={this.closeSubmissionSummary}
              />

              <div className="editor-buttons">
                <Button
                  type="submit"
                  text="Submit"
                  small
                  intent={Intent.PRIMARY}
                  loading={submitting}
                  disabled={!dirty || this.currentTimeout}
                />
                <div className="editor-navigation">{renderNavigation({ hidePrev: true })}</div>
              </div>
            </form>
          );
        }}
      </Form>
    );
  };

  clickResponsiveButton = () => {
    this.setState({ isResponsiveButtonClicked: true });
  };

  renderResponsiveButton = () => {
    if (this.state.isResponsiveButtonClicked) {
      return null;
    }
    return <Button className="responsive-button" text="Click to solve" small onClick={this.clickResponsiveButton} />;
  };

  render() {
    return (
      <ContentCard className="problem-submission-editor">
        <h4>Submit solution</h4>
        {this.renderResponsiveButton()}
        {this.renderEditor()}
      </ContentCard>
    );
  }
}
