/**
 * Retrieves a localized message for the given key.
 * This is a simple wrapper around the chrome.i18n API.
 * @param key The key of the message to retrieve from messages.json.
 * @param substitutions Optional substitutions for placeholders in the message.
 * @returns The localized message string.
 */
export const getMessage = (key: string, substitutions?: string | string[]): string => {
  if (chrome && chrome.i18n && chrome.i18n.getMessage) {
    return chrome.i18n.getMessage(key, substitutions);
  }
  // Fallback for environments where chrome API is not available (e.g., unit tests)
  return key;
};
