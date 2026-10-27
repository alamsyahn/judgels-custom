import { get, put } from '../http';
import { baseChapterURL } from './chapter';

export const chapterResourceAPI = {
  getResources: (token, chapterJid) => get(`${baseChapterURL(chapterJid)}/resources`, token),
  setResources: (token, chapterJid, data) => put(`${baseChapterURL(chapterJid)}/resources`, token, data),
};

export function getResourceDisplayAlias(index) {
  let alias = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    alias = String.fromCharCode(65 + ((n - 1) % 26)) + alias;
  }
  return alias;
}
