// Utilities for generating unique CSS selectors

// Build a simple unique selector for an element
function getUniqueSelector(el) {
  if (!el) return '';
  if (el.id) return `#${el.id}`;

  const parts = [];
  while (el && el.nodeType === 1 && el !== document.body) {
    let part = el.nodeName.toLowerCase();
    if (el.classList.length) {
      part += '.' + Array.from(el.classList).join('.');
    }
    const siblings = el.parentNode ? Array.from(el.parentNode.children)
      .filter((e) => e.nodeName === el.nodeName).length : 0;
    if (siblings > 1) {
      const index = Array.from(el.parentNode.children).indexOf(el) + 1;
      part += `:nth-child(${index})`;
    }
    parts.unshift(part);
    el = el.parentElement;
  }

  return parts.join(' > ');
}

self.getUniqueSelector = getUniqueSelector;
