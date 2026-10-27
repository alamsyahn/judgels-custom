import { mount } from 'enzyme';

import { ChapterResourceEditDialog } from './ChapterResourceEditDialog';

describe('ChapterResourceEditDialog', () => {
  it('reorders mixed content and changes sections while saving stable resource identifiers', async () => {
    const resources = [
      { type: 'LESSON', resourceJid: 'lesson', section: 'MAIN' },
      { type: 'PROBLEM', resourceJid: 'problem', section: 'MAIN' },
    ];
    const onSetResources = jest.fn().mockResolvedValue(undefined);
    const onCloseDialog = jest.fn();
    const wrapper = mount(
      <ChapterResourceEditDialog
        isOpen={false}
        chapter={{ jid: 'chapter' }}
        onSetResources={onSetResources}
        onCloseDialog={onCloseDialog}
      />
    );
    wrapper.setState({
      resources,
      lessonsMap: { lesson: { titlesByLanguage: { en: 'Lesson' }, defaultLanguage: 'en' } },
      problemsMap: { problem: { titlesByLanguage: { en: 'Problem' }, defaultLanguage: 'en' } },
    });
    wrapper.instance().move(resources[1], -1);
    wrapper.update();
    expect(wrapper.state('resources').map(item => item.resourceJid)).toEqual(['problem', 'lesson']);
    wrapper.instance().changeSection(resources[0], 'CHALLENGE');
    wrapper.update();
    await wrapper.instance().save();
    expect(onSetResources).toHaveBeenCalledWith('chapter', [
      { type: 'PROBLEM', resourceJid: 'problem', section: 'MAIN' },
      { type: 'LESSON', resourceJid: 'lesson', section: 'CHALLENGE' },
    ]);
    expect(onCloseDialog).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('keeps edits available when saving fails', async () => {
    const wrapper = mount(
      <ChapterResourceEditDialog
        isOpen={false}
        chapter={{ jid: 'chapter' }}
        onSetResources={jest.fn().mockRejectedValue(new Error('failed'))}
        onCloseDialog={jest.fn()}
      />
    );
    wrapper.setState({ resources: [], dirty: true });
    await wrapper.instance().save();
    expect(wrapper.state('error')).toContain('belum tersimpan');
    expect(wrapper.state('dirty')).toBe(true);
    expect(wrapper.state('saving')).toBe(false);
    wrapper.unmount();
  });
});
