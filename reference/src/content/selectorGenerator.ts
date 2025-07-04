/**
 * Generates the most stable and unique selector for a given DOM element.
 * Prioritizes selectors in the order: id, data-testid, data-cy, other data-*, a unique class, tag + nth-of-type.
 * @param {HTMLElement} element The element to generate a selector for.
 * @returns {string} A CSS selector string.
 */
export function getUniqueSelector(element: HTMLElement): string {
  if (!element) return '';

  // 1. Use ID if it's unique
  if (element.id) {
    const idSelector = `#${element.id}`;
    if (document.querySelectorAll(idSelector).length === 1) {
      return idSelector;
    }
  }
  
  // 2. Use data-* attributes (common in testing frameworks)
  const dataAttributes = ['data-testid', 'data-cy', 'data-test'];
  for (const attr of dataAttributes) {
      if (element.hasAttribute(attr)) {
          const value = element.getAttribute(attr);
          const selector = `[${attr}="${value}"]`;
           if (document.querySelectorAll(selector).length === 1) {
              return selector;
           }
      }
  }

  // 3. Generate a path of tag:nth-of-type selectors
  let path = '';
  let currentElement: HTMLElement | null = element;

  while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
    let selector = currentElement.nodeName.toLowerCase();
    
    // Stop at the body or if an ID is found
    if (currentElement.id) {
        selector = `#${currentElement.id}`;
        path = selector + (path ? ` > ${path}` : '');
        break;
    }

    if (currentElement.parentElement) {
      const siblings = Array.from(currentElement.parentElement.children);
      const sameTagSiblings = siblings.filter(
        sibling => (sibling as HTMLElement).nodeName.toLowerCase() === selector
      );
      
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(currentElement);
        selector += `:nth-of-type(${index + 1})`;
      }
    }

    path = selector + (path ? ` > ${path}` : '');
    
    // If the path is now unique, we can stop.
    if (document.querySelectorAll(path).length === 1) {
        break;
    }

    currentElement = currentElement.parentElement;
  }

  return path;
}

