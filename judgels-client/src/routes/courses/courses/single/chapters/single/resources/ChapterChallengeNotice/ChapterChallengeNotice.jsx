import { Callout, Tag } from '@blueprintjs/core';

import './ChapterChallengeNotice.scss';

export function ChapterChallengeTag({ resource }) {
  return resource?.section === 'CHALLENGE' ? (
    <Tag minimal intent="warning" icon="star" className="chapter-challenge-tag">
      Challenge
    </Tag>
  ) : null;
}

export function ChapterChallengeNotice({ resource }) {
  return resource?.section === 'CHALLENGE' ? (
    <Callout intent="warning" icon="star" className="chapter-challenge-notice">
      Tantangan opsional untuk memperdalam pemahaman. Bisa dibuka tanpa menyelesaikan bagian utama.
    </Callout>
  ) : null;
}
