import { Button, Callout, Classes, Dialog, HTMLSelect } from '@blueprintjs/core';
import { Component } from 'react';

import { LoadingState } from '../../../../components/LoadingState/LoadingState';
import { getResourceDisplayAlias } from '../../../../modules/api/jerahmeel/chapterResource';
import { getLessonName } from '../../../../modules/api/sandalphon/lesson';
import { getProblemName } from '../../../../modules/api/sandalphon/problem';

import './ChapterResourceEditDialog.scss';

export class ChapterResourceEditDialog extends Component {
  state = { resources: undefined, lessonsMap: {}, problemsMap: {}, saving: false, error: undefined, dirty: false };
  requestId = 0;

  componentDidMount() {
    this.refresh();
  }

  componentDidUpdate(prevProps) {
    if (this.props.isOpen !== prevProps.isOpen || this.props.chapter?.jid !== prevProps.chapter?.jid) {
      this.refresh();
    }
  }

  componentWillUnmount() {
    this.requestId++;
  }

  refresh = async () => {
    const requestId = ++this.requestId;
    if (!this.props.isOpen) {
      return;
    }
    this.setState({ resources: undefined, error: undefined, dirty: false });
    try {
      const [lessons, problems, resources] = await this.props.onGetResources(this.props.chapter.jid);
      if (requestId === this.requestId) {
        this.setState({ resources, lessonsMap: lessons.lessonsMap, problemsMap: problems.problemsMap });
      }
    } catch (error) {
      if (requestId === this.requestId) {
        this.setState({ error: 'Konten belum bisa dimuat. Tutup dan buka kembali untuk mencoba lagi.' });
      }
    }
  };

  move = (resource, direction) => {
    this.setState(({ resources }) => {
      const updated = [...resources];
      const sectionItems = resources.filter(item => item.section === resource.section);
      const other = sectionItems[sectionItems.indexOf(resource) + direction];
      if (!other) {
        return null;
      }
      const from = resources.indexOf(resource);
      const to = resources.indexOf(other);
      [updated[from], updated[to]] = [updated[to], updated[from]];
      return { resources: updated, dirty: true };
    });
  };

  changeSection = (resource, section) => {
    this.setState(({ resources }) => ({
      resources: [...resources.filter(item => item !== resource), { ...resource, section }],
      dirty: true,
    }));
  };

  save = async () => {
    this.setState({ saving: true, error: undefined });
    try {
      const data = ['MAIN', 'CHALLENGE'].flatMap(section =>
        this.state.resources
          .filter(item => item.section === section)
          .map(({ type, resourceJid, section }) => ({ type, resourceJid, section }))
      );
      await this.props.onSetResources(this.props.chapter.jid, data);
      this.props.onCloseDialog();
    } catch (error) {
      this.setState({ error: 'Urutan belum tersimpan. Coba lagi; jika isi chapter berubah, tutup dan buka kembali.' });
    } finally {
      this.setState({ saving: false });
    }
  };

  renderSection = section => {
    const { resources, lessonsMap, problemsMap, saving } = this.state;
    const items = resources.filter(item => item.section === section);
    return (
      <section key={section} className="chapter-resource-editor__section">
        <h4>{section === 'MAIN' ? 'Bagian utama' : 'Challenges'}</h4>
        {!items.length && <p>Belum ada konten di bagian ini.</p>}
        {items.map((resource, index) => {
          const isLesson = resource.type === 'LESSON';
          const name = isLesson
            ? getLessonName(lessonsMap[resource.resourceJid], undefined)
            : getProblemName(problemsMap[resource.resourceJid], undefined);
          return (
            <div className="chapter-resource-editor__item" key={`${resource.type}:${resource.resourceJid}`}>
              <div className="chapter-resource-editor__name">
                <strong>
                  {getResourceDisplayAlias(index)}. {name}
                </strong>
                <small>{isLesson ? 'Materi' : 'Problem'}</small>
              </div>
              <div className="chapter-resource-editor__controls">
                <Button
                  icon="arrow-up"
                  aria-label={`Naikkan ${name}`}
                  disabled={saving || index === 0}
                  onClick={() => this.move(resource, -1)}
                />
                <Button
                  icon="arrow-down"
                  aria-label={`Turunkan ${name}`}
                  disabled={saving || index === items.length - 1}
                  onClick={() => this.move(resource, 1)}
                />
                <HTMLSelect
                  aria-label={`Bagian untuk ${name}`}
                  value={section}
                  disabled={saving}
                  onChange={event => this.changeSection(resource, event.target.value)}
                >
                  <option value="MAIN">Bagian utama</option>
                  <option value="CHALLENGE">Challenges</option>
                </HTMLSelect>
              </div>
            </div>
          );
        })}
      </section>
    );
  };

  render() {
    const { resources, saving, error, dirty } = this.state;
    return (
      <Dialog
        className="chapter-resource-editor"
        isOpen={this.props.isOpen}
        title={`Atur konten: ${this.props.chapter?.name || ''}`}
        onClose={saving ? undefined : this.props.onCloseDialog}
        canOutsideClickClose={false}
        canEscapeKeyClose={!saving}
        isCloseButtonShown={!saving}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>Campur materi dan soal dengan tombol naik/turun. Penomoran otomatis dimulai dari A pada setiap bagian.</p>
          <p>
            Challenges bersifat opsional dan bisa langsung dibuka siswa. Tambahkan materi/soal melalui menu chapter yang
            sudah tersedia.
          </p>
          {error && <Callout intent="danger">{error}</Callout>}
          {resources ? ['MAIN', 'CHALLENGE'].map(this.renderSection) : !error && <LoadingState />}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button text="Batal" disabled={saving} onClick={this.props.onCloseDialog} />
            <Button
              text="Simpan urutan"
              intent="primary"
              loading={saving}
              disabled={!resources || !dirty}
              onClick={this.save}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}
