import { ChevronRight } from '@blueprintjs/icons';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import { LoadingContentCard } from '../../../../../../../../components/LoadingContentCard/LoadingContentCard';
import { VerdictCode } from '../../../../../../../../modules/api/gabriel/verdict';
import { getLessonName } from '../../../../../../../../modules/api/sandalphon/lesson';
import { getProblemName } from '../../../../../../../../modules/api/sandalphon/problem';
import { selectCourse } from '../../../../../modules/courseSelectors';
import { selectCourseChapter } from '../../../modules/courseChapterSelectors';
import { ChapterLessonCard } from '../ChapterLessonCard/ChapterLessonCard';
import { ChapterProblemCard } from '../ChapterProblemCard/ChapterProblemCard';

import * as chapterResourcesActions from '../modules/chapterResourceActions';

import './ChapterResourcesPage.scss';

export class ChapterResourcesPage extends Component {
  state = {
    response: undefined,
  };

  componentDidMount() {
    this.refreshResources();
  }

  componentDidUpdate(prevProps) {
    if (this.props.chapter.jid !== prevProps.chapter.jid) {
      this.refreshResources();
    }
  }

  refreshResources = async () => {
    this.setState({
      response: undefined,
    });

    const response = await this.props.onGetResources(this.props.chapter.jid);
    const [lessonsResponse, problemsResponse, resources] = response;
    const { data: lessons, lessonsMap } = lessonsResponse;
    const { data: problems, problemsMap, problemSetProblemPathsMap, problemProgressesMap } = problemsResponse;

    const orderedProblems = resources
      .filter(item => item.type === 'PROBLEM' && item.section === 'MAIN')
      .map(item => problems.find(problem => problem.problemJid === item.resourceJid));
    const firstUnsolvedProblemIndex = this.getFirstUnsolvedProblemIndex(orderedProblems, problemProgressesMap);

    this.setState({
      response,
      lessons,
      lessonsMap,
      problems,
      problemsMap,
      problemSetProblemPathsMap,
      problemProgressesMap,
      firstUnsolvedProblemIndex,
      resources,
    });
  };

  render() {
    return (
      <div className="chapter-resources-page">
        {this.renderHeader()}
        {this.renderResources()}
      </div>
    );
  }

  renderHeader = () => {
    const { course, chapter } = this.props;

    return (
      <h3 className="chapter-resources-page__title">
        <Link className="chapter-resources-page__title--link" to={`/courses/${course.slug}`}>
          {course.name}
        </Link>
        &nbsp;
        <ChevronRight className="chapter-resources-page__title--chevron" size={20} />
        &nbsp;
        {chapter.alias}. {chapter.name}
      </h3>
    );
  };

  renderResources = () => {
    const { response, lessons, problems, resources } = this.state;
    if (!response) {
      return <LoadingContentCard />;
    }

    if (lessons.length === 0 && problems.length === 0) {
      return (
        <p>
          <small>No resources.</small>
        </p>
      );
    }

    return (
      <div className="chapter-resources-page__sections">
        {['MAIN', 'CHALLENGE'].map(section => {
          const items = resources.filter(resource => resource.section === section);
          if (!items.length) {
            return null;
          }
          return (
            <div key={section}>
              {section === 'CHALLENGE' && (
                <>
                  <h4>Challenges</h4>
                  <p>Tantangan opsional. Bisa langsung dibuka tanpa menyelesaikan bagian utama.</p>
                </>
              )}
              <div className="chapter-resources-page__resources">{items.map(this.renderResource)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  renderResource = resource => {
    const { lessons, problems, resources } = this.state;
    if (resource.type === 'LESSON') {
      const lesson = lessons.find(item => item.lessonJid === resource.resourceJid);
      return lesson ? this.renderLesson(lesson, resource.displayAlias) : null;
    }
    const orderedProblems = resources.filter(item => item.type === 'PROBLEM' && item.section === 'MAIN');
    const problem = problems.find(item => item.problemJid === resource.resourceJid);
    return problem
      ? this.renderProblem(problem, orderedProblems.indexOf(resource), resource.displayAlias, resource.section)
      : null;
  };

  renderLesson = (lesson, displayAlias) => {
    const { lessonsMap } = this.state;

    const props = {
      course: this.props.course,
      chapter: this.props.chapter,
      lesson,
      displayAlias,
      lessonName: getLessonName(lessonsMap[lesson.lessonJid], undefined),
    };
    return <ChapterLessonCard key={lesson.lessonJid} {...props} />;
  };

  renderProblem = (problem, idx, displayAlias, section) => {
    const { problemsMap, problemSetProblemPathsMap, problemProgressesMap, firstUnsolvedProblemIndex } = this.state;

    const props = {
      course: this.props.course,
      chapter: this.props.chapter,
      problem,
      displayAlias,
      problemName: getProblemName(problemsMap[problem.problemJid], undefined),
      problemSetProblemPaths: problemSetProblemPathsMap[problem.problemJid],
      progress: problemProgressesMap[problem.problemJid],
      isFuture: section !== 'CHALLENGE' && idx > firstUnsolvedProblemIndex,
    };
    return <ChapterProblemCard key={problem.problemJid} {...props} />;
  };

  getFirstUnsolvedProblemIndex = (problems, problemProgressesMap) => {
    for (let i = problems.length - 1; i >= 0; i--) {
      const progress = problemProgressesMap[problems[i].problemJid];
      if (!progress) {
        continue;
      }
      if (progress.verdict !== VerdictCode.PND) {
        return i + 1;
      }
    }
    return 0;
  };
}

const mapStateToProps = state => ({
  course: selectCourse(state),
  chapter: selectCourseChapter(state),
});

const mapDispatchToProps = {
  onGetResources: chapterResourcesActions.getResources,
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ChapterResourcesPage));
