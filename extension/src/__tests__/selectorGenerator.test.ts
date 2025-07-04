import { getUniqueSelector } from '../content/selectorGenerator';

describe('getUniqueSelector', () => {
  test('returns id when element has unique id', () => {
    document.body.innerHTML = '<button id="btn1">Click</button>';
    const el = document.getElementById('btn1') as HTMLElement;
    expect(getUniqueSelector(el)).toBe('#btn1');
  });

  test('returns path when no id', () => {
    document.body.innerHTML = '<div><span></span><span class="target"></span></div>';
    const el = document.querySelector('.target') as HTMLElement;
    expect(getUniqueSelector(el)).toBe('span:nth-of-type(2)');
  });
});
