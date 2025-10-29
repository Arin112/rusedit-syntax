const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const wordListPath = path.join(rootDir, 'syntaxes', 'marker-wordlists.json');
const templatePath = path.join(rootDir, 'syntaxes', 'rusedit.tmLanguage.template.json');
const outputPath = path.join(rootDir, 'syntaxes', 'rusedit.tmLanguage.json');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildMatch = ({ words, caseInsensitive }) => {
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error('Word list must be a non-empty array');
  }

  const escapedWords = words.map(escapeRegExp);
  const joined = escapedWords.length === 1 ? escapedWords[0] : `(?:${escapedWords.join('|')})`;

  return caseInsensitive ? `(?i)${joined}` : joined;
};

const main = () => {
  const wordLists = JSON.parse(fs.readFileSync(wordListPath, 'utf8'));
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  const markerPatterns = template?.repository?.marker?.patterns ?? [];

  template.repository.marker.patterns = markerPatterns.map((pattern) => {
    if (!pattern.placeholder) {
      return pattern;
    }

    const listKey = pattern.placeholder;
    const wordListConfig = wordLists[listKey];

    if (!wordListConfig) {
      throw new Error(`No word list configuration found for placeholder "${listKey}"`);
    }

    const { caseInsensitive = false } = wordListConfig;

    return {
      ...pattern,
      match: buildMatch({
        words: wordListConfig.words,
        caseInsensitive
      })
    };
  }).map(({ placeholder, ...rest }) => rest);

  fs.writeFileSync(outputPath, `${JSON.stringify(template, null, 2)}\n`);
};

main();
