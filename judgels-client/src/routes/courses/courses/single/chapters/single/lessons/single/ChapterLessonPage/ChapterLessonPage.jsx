import { ChevronRight } from '@blueprintjs/icons';
import { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { ContentCard } from '../../../../../../../../../components/ContentCard/ContentCard';
import StatementLanguageWidget from '../../../../../../../../../components/LanguageWidget/StatementLanguageWidget';
import { LessonStatementCard } from '../../../../../../../../../components/LessonStatementCard/LessonStatementCard';
import { LoadingState } from '../../../../../../../../../components/LoadingState/LoadingState';
import { selectCourse } from '../../../../../../modules/courseSelectors';
import { selectCourseChapter } from '../../../../modules/courseChapterSelectors';
import { selectCourseChapters } from '../../../../modules/courseChaptersSelectors';
import {
  ChapterChallengeNotice,
  ChapterChallengeTag,
} from '../../../resources/ChapterChallengeNotice/ChapterChallengeNotice';
import { ChapterNavigation } from '../../../resources/ChapterNavigation/ChapterNavigation';

import * as breadcrumbsActions from '../../../../../../../../../modules/breadcrumbs/breadcrumbsActions';
import * as chapterLessonActions from '../modules/chapterLessonActions';

import './ChapterLessonPage.scss';

export class ChapterLessonPage extends Component {
  state = {
    response: undefined,
  };

  async componentDidMount() {
    const response = await this.props.onGetLessonStatement(
      this.props.chapter.jid,
      this.props.match.params.lessonAlias,
      this.props.statementLanguage
    );

    this.setState({
      response,
    });

    const resource = response.navigation?.current;
    this.props.onPushBreadcrumb(
      this.props.match.url,
      (resource?.section === 'CHALLENGE' ? 'Challenge ' : '') + (resource?.displayAlias || response.lesson.alias)
    );
  }

  async componentDidUpdate(prevProps) {
    if (this.props.statementLanguage !== prevProps.statementLanguage) {
      await this.componentDidMount();
    } else if (this.props.match.params.lessonAlias !== prevProps.match.params.lessonAlias) {
      await this.componentDidMount();
    }
  }

  async componentWillUnmount() {
    this.props.onPopBreadcrumb(this.props.match.url);
  }

  render() {
    return (
      <div className="chapter-lesson-page">
        {this.renderHeader()}
        <ChapterChallengeNotice resource={this.state.response?.navigation?.current} />
        <ContentCard>
          {this.renderStatementLanguageWidget()}
          {this.renderStatement()}
        </ContentCard>
      </div>
    );
  }

  renderHeader = () => {
    const { course, chapter, match } = this.props;

    return (
      <div className="chapter-lesson-page__title">
        <h3>
          <Link className="chapter-lesson-page__title--link" to={`/courses/${course.slug}`}>
            {course.name}
          </Link>
          &nbsp;
          <ChevronRight className="chapter-lesson-page__title--chevron" size={20} />
          &nbsp;
          <Link className="chapter-lesson-page__title--link" to={`/courses/${course.slug}/chapters/${chapter.alias}`}>
            {chapter.alias}. {chapter.name}
          </Link>
          &nbsp;
          <ChevronRight className="chapter-lesson-page__title--chevron" size={20} />
          &nbsp;
          {this.state.response?.navigation?.current?.displayAlias || match.params.lessonAlias}
          <ChapterChallengeTag resource={this.state.response?.navigation?.current} />
        </h3>

        {this.renderPrevAndNextResourcePaths()}
      </div>
    );
  };

  renderStatementLanguageWidget = () => {
    const { response } = this.state;
    if (!response) {
      return null;
    }
    const { defaultLanguage, languages } = response;
    const props = {
      defaultLanguage: defaultLanguage,
      statementLanguages: languages,
    };
    return (
      <div className="language-widget-wrapper">
        <StatementLanguageWidget {...props} />
      </div>
    );
  };

  renderStatement = () => {
    const { response } = this.state;
    if (!response) {
      return <LoadingState />;
    }

    return (
      <LessonStatementCard
        alias={response.navigation?.current?.displayAlias || response.lesson.alias}
        statement={response.statement}
      />
    );
  };

  renderPrevAndNextResourcePaths = () => {
    const { course, chapter, chapters } = this.props;
    const { response } = this.state;
    if (!response) {
      return null;
    }

    const { previousResourcePath, nextResourcePath } = response;
    return (
      <ChapterNavigation
        courseSlug={course.slug}
        chapterAlias={chapter.alias}
        previousResourcePath={previousResourcePath}
        nextResourcePath={nextResourcePath}
        chapters={chapters}
        navigation={response.navigation}
      />
    );
  };
}

const mapStateToProps = state => ({
  course: selectCourse(state),
  chapter: selectCourseChapter(state),
  chapters: selectCourseChapters(state),
});

const mapDispatchToProps = {
  onGetLessonStatement: chapterLessonActions.getLessonStatement,
  onPushBreadcrumb: breadcrumbsActions.pushBreadcrumb,
  onPopBreadcrumb: breadcrumbsActions.popBreadcrumb,
};

export default connect(mapStateToProps, mapDispatchToProps)(ChapterLessonPage);
