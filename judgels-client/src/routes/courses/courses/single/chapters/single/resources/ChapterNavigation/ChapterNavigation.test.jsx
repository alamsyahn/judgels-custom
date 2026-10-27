import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router';

import { ChapterNavigation } from './ChapterNavigation';

describe('ChapterNavigation challenge access', () => {
  const render = navigation =>
    mount(
      <MemoryRouter>
        <ChapterNavigation
          courseSlug="course"
          chapterAlias="C"
          nextResourcePath="/lessons/B"
          disableNext
          navigation={navigation}
        />
      </MemoryRouter>
    );

  it('allows an unsolved main problem to enter Challenges with an explicit transition label', () => {
    const wrapper = render({ current: { section: 'MAIN' }, next: { section: 'CHALLENGE' } });
    expect(wrapper.find('a').text()).toContain('Lanjut ke Challenges');
    expect(wrapper.find('a').prop('href')).toBe('/courses/course/chapters/C/lessons/B');
    wrapper.unmount();
  });

  it('allows navigation inside Challenges without solving the previous problem', () => {
    const wrapper = render({ current: { section: 'CHALLENGE' }, next: { section: 'CHALLENGE' } });
    expect(wrapper.find('a')).toHaveLength(1);
    wrapper.unmount();
  });

  it('preserves the existing main-section completion rule', () => {
    const wrapper = render({ current: { section: 'MAIN' }, next: { section: 'MAIN' } });
    expect(wrapper.find('a')).toHaveLength(0);
    expect(wrapper.find('button').prop('disabled')).toBe(true);
    wrapper.unmount();
  });
});
