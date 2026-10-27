import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';

import webPrefsReducer, { PutStatementLanguage } from '../../../../../../../../modules/webPrefs/webPrefsReducer';
import courseReducer, { PutCourse } from '../../../../../modules/courseReducer';
import courseChapterReducer, { PutCourseChapter } from '../../../modules/courseChapterReducer';
import ChapterResourcesPage from './ChapterResourcesPage';

import * as chapterResourceActions from '../modules/chapterResourceActions';

jest.mock('../modules/chapterResourceActions');

describe('ChapterResourcesPage', () => {
  let wrapper;
  let lessons;
  let problems;
  let problemSetProblemPathsMap = {};

  const render = async (
    resources = [
      ...lessons.map(lesson => ({ type: 'LESSON', resourceJid: lesson.lessonJid, section: 'MAIN' })),
      ...problems.map(problem => ({ type: 'PROBLEM', resourceJid: problem.problemJid, section: 'MAIN' })),
    ].map((item, index) => ({ ...item, displayAlias: String.fromCharCode(65 + index) }))
  ) => {
    wrapper?.unmount();
    chapterResourceActions.getResources.mockReturnValue(() =>
      Promise.resolve([
        {
          data: lessons,
          lessonsMap: {
            lessonJid1: {
              slug: 'lesson-x',
              titlesByLanguage: { en: 'Lesson X' },
              defaultLanguage: 'en',
            },
            lessonJid2: {
              slug: 'lesson-y',
              titlesByLanguage: { en: 'Lesson Y' },
              defaultLanguage: 'en',
            },
          },
        },
        {
          data: problems,
          problemsMap: {
            problemJid1: {
              slug: 'problem-a',
              titlesByLanguage: { en: 'Problem A' },
              defaultLanguage: 'en',
            },
            problemJid2: {
              slug: 'problem-b',
              titlesByLanguage: { en: 'Problem B' },
              defaultLanguage: 'en',
            },
          },
          problemSetProblemPathsMap,
          problemProgressesMap: {
            problemJid1: { verdict: 'AC', score: 100 },
          },
        },
        resources,
      ])
    );

    const store = createStore(
      combineReducers({
        webPrefs: webPrefsReducer,
        jerahmeel: combineReducers({ course: courseReducer, courseChapter: courseChapterReducer }),
      }),
      applyMiddleware(thunk)
    );
    store.dispatch(PutCourse({ jid: 'courseJid', slug: 'courseSlug' }));
    store.dispatch(
      PutCourseChapter({
        jid: 'chapterJid',
        name: 'Chapter 1',
        alias: 'chapter-1',
        courseSlug: 'courseSlug',
      })
    );
    store.dispatch(PutStatementLanguage('en'));

    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/courses/courseSlug/chapter/chapter-1']}>
          <Route path="/courses/courseSlug/chapter/chapter-1" component={ChapterResourcesPage} />
        </MemoryRouter>
      </Provider>
    );

    await new Promise(resolve => setImmediate(resolve));
    wrapper.update();
  };

  beforeEach(() => {
    problemSetProblemPathsMap = {};
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  describe('when there are no resources', () => {
    beforeEach(async () => {
      lessons = [];
      problems = [];
      await render();
    });

    it('shows placeholder text and no resources', () => {
      expect(wrapper.text()).toContain('No resources.');
      expect(wrapper.find('a.content-card-link')).toHaveLength(0);
    });
  });

  describe('when there are resources', () => {
    beforeEach(async () => {
      lessons = [
        { lessonJid: 'lessonJid1', alias: 'X' },
        { lessonJid: 'lessonJid2', alias: 'Y' },
      ];
      problems = [
        { problemJid: 'problemJid1', alias: 'A' },
        { problemJid: 'problemJid2', alias: 'B' },
      ];
      await render();
    });

    it('shows the resources', () => {
      const cards = wrapper.find('a.content-card-link');
      expect(cards.map(card => [card.text(), card.find('a').props().href])).toEqual([
        ['A. Lesson X', '/courses/courseSlug/chapters/chapter-1/lessons/X'],
        ['B. Lesson Y', '/courses/courseSlug/chapters/chapter-1/lessons/Y'],
        ['C. Problem Asolved  ', '/courses/courseSlug/chapters/chapter-1/problems/A'],
        ['D. Problem B', '/courses/courseSlug/chapters/chapter-1/problems/B'],
      ]);
    });

    it('interleaves lessons and problems without regrouping Problemset links, then restarts Challenge labels', async () => {
      problemSetProblemPathsMap = { problemJid1: [['operators', 'A']] };
      await render([
        { type: 'LESSON', resourceJid: 'lessonJid1', section: 'MAIN', displayAlias: 'A' },
        { type: 'PROBLEM', resourceJid: 'problemJid1', section: 'MAIN', displayAlias: 'B' },
        { type: 'LESSON', resourceJid: 'lessonJid2', section: 'CHALLENGE', displayAlias: 'A' },
        { type: 'PROBLEM', resourceJid: 'problemJid2', section: 'CHALLENGE', displayAlias: 'B' },
      ]);
      expect(wrapper.find('[data-key="name"]').map(node => node.text())).toEqual([
        'A. Lesson X',
        'B. Problem A',
        'A. Lesson Y',
        'B. Problem B',
      ]);
      expect(wrapper.text()).toContain('Challenges');
      expect(wrapper.text()).toContain('operators/A');
      expect(wrapper.text()).not.toContain('Practice Problems');
      expect(wrapper.find('div.chapter-problem-card').last().hasClass('chapter-problem-card--future')).toBe(false);
    });
  });
});
