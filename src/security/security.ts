// === SECURITY MODULE ===
// Comprehensive security utilities for the Sisypi extension

export class SecurityManager {
  private static instance: SecurityManager;
  private readonly DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  private readonly MAX_INPUT_LENGTH = 10000;
  private readonly MAX_SELECTOR_LENGTH = 1000;
  private readonly ALLOWED_TAGS = ['div', 'span', 'p', 'a', 'button', 'input', 'select', 'textarea', 'form', 'label'];

  private constructor() {}

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // === INPUT SANITIZATION ===
  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  public sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Length check
    if (input.length > this.MAX_INPUT_LENGTH) {
      throw new Error(`Input too long. Maximum ${this.MAX_INPUT_LENGTH} characters allowed.`);
    }

    // Remove dangerous characters and patterns
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/expression\s*\(/gi, '') // Remove CSS expressions
      .replace(/url\s*\(/gi, '') // Remove CSS url()
      .replace(/import\s+/gi, '') // Remove import statements
      .replace(/@import/gi, '') // Remove CSS @import
      .replace(/eval\s*\(/gi, '') // Remove eval calls
      .replace(/Function\s*\(/gi, '') // Remove Function constructor
      .replace(/setTimeout\s*\(/gi, '') // Remove setTimeout
      .replace(/setInterval\s*\(/gi, ''); // Remove setInterval

    // HTML encode remaining special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  }

  /**
   * Sanitize CSS selectors to prevent injection
   */
  public sanitizeSelector(selector: string): string {
    if (typeof selector !== 'string') {
      throw new Error('Selector must be a string');
    }

    if (selector.length > this.MAX_SELECTOR_LENGTH) {
      throw new Error(`Selector too long. Maximum ${this.MAX_SELECTOR_LENGTH} characters allowed.`);
    }

    // Remove dangerous patterns
    const sanitized = selector
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/url\s*\(/gi, '')
      .replace(/@import/gi, '')
      .replace(/<!--/g, '')
      .replace(/-->/g, '')
      .replace(/<script/gi, '')
      .replace(/<\/script>/gi, '');

    // Validate selector format
    if (!this.isValidSelector(sanitized)) {
      throw new Error('Invalid CSS selector format');
    }

    return sanitized.trim();
  }

  /**
   * Validate CSS selector format
   */
  private isValidSelector(selector: string): boolean {
    try {
      // Try to create a query selector to validate syntax
      document.createElement('div').querySelector(selector);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize URLs to prevent dangerous protocols
   */
  public sanitizeUrl(url: string): string {
    if (typeof url !== 'string') {
      return '';
    }

    const trimmedUrl = url.trim().toLowerCase();

    // Check for dangerous protocols
    for (const protocol of this.DANGEROUS_PROTOCOLS) {
      if (trimmedUrl.startsWith(protocol)) {
        throw new Error(`Dangerous protocol detected: ${protocol}`);
      }
    }

    // Allow relative URLs and common protocols
    if (trimmedUrl.startsWith('//') || 
        trimmedUrl.startsWith('http://') || 
        trimmedUrl.startsWith('https://') ||
        trimmedUrl.startsWith('/') ||
        !trimmedUrl.includes(':')) {
      return url.trim();
    }

    throw new Error('Invalid or dangerous URL format');
  }

  // === CONTENT SECURITY ===
  /**
   * Validate automation step data
   */
  public validateStepData(step: any): boolean {
    if (!step || typeof step !== 'object') {
      return false;
    }

    // Check required fields
    if (!step.type || typeof step.type !== 'string') {
      return false;
    }

    // Validate selector if present
    if (step.selector) {
      try {
        this.sanitizeSelector(step.selector);
      } catch {
        return false;
      }
    }

    // Validate text input if present
    if (step.text) {
      try {
        this.sanitizeInput(step.text);
      } catch {
        return false;
      }
    }

    // Validate variable names
    if (step.variable && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(step.variable)) {
      return false;
    }

    return true;
  }

  /**
   * Validate scenario data
   */
  public validateScenarioData(scenario: any): boolean {
    if (!scenario || typeof scenario !== 'object') {
      return false;
    }

    // Validate basic fields
    if (!scenario.id || !scenario.title || !Array.isArray(scenario.steps)) {
      return false;
    }

    // Validate title
    try {
      this.sanitizeInput(scenario.title);
    } catch {
      return false;
    }

    // Validate URL restriction if present
    if (scenario.urlRestriction) {
      try {
        this.sanitizeUrl(scenario.urlRestriction);
      } catch {
        return false;
      }
    }

    // Validate all steps
    for (const step of scenario.steps) {
      if (!this.validateStepData(step)) {
        return false;
      }
    }

    return true;
  }

  // === RUNTIME SECURITY ===
  /**
   * Validate message from content script
   */
  public validateMessage(message: any): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    // Check for required action field
    if (!message.action || typeof message.action !== 'string') {
      return false;
    }

    // Validate action name
    const allowedActions = [
      'getInitialData',
      'saveScenarios',
      'runScenario',
      'backupAll',
      'restoreFromBackup',
      'startSelection',
      'stopSelection',
      'selectElementByNumber',
      'updateRunStatus'
    ];

    if (!allowedActions.includes(message.action)) {
      return false;
    }

    return true;
  }

  /**
   * Rate limiting for API calls
   */
  private callCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly RATE_LIMIT = 100; // calls per minute
  private readonly RATE_WINDOW = 60000; // 1 minute

  public checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const record = this.callCounts.get(identifier);

    if (!record || now > record.resetTime) {
      this.callCounts.set(identifier, { count: 1, resetTime: now + this.RATE_WINDOW });
      return true;
    }

    if (record.count >= this.RATE_LIMIT) {
      return false;
    }

    record.count++;
    return true;
  }

  // === SECURE STORAGE ===
  /**
   * Encrypt sensitive data before storage
   */
  public encryptData(data: string, key?: string): string {
    // Simple XOR encryption for demonstration
    // In production, use proper encryption libraries
    const encryptionKey = key || 'sisypi-default-key-2024';
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ encryptionKey.charCodeAt(i % encryptionKey.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    return btoa(encrypted); // Base64 encode
  }

  /**
   * Decrypt sensitive data from storage
   */
  public decryptData(encryptedData: string, key?: string): string {
    try {
      const encryptionKey = key || 'sisypi-default-key-2024';
      const encrypted = atob(encryptedData); // Base64 decode
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ encryptionKey.charCodeAt(i % encryptionKey.length);
        decrypted += String.fromCharCode(charCode);
      }
      
      return decrypted;
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }

  // === SECURITY HEADERS ===
  /**
   * Generate secure Content Security Policy
   */
  public getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Needed for extension scripts
      "style-src 'self' 'unsafe-inline'", // Needed for dynamic styles
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ');
  }

  // === AUDIT LOGGING ===
  private auditLog: Array<{
    timestamp: number;
    action: string;
    details: any;
    risk: 'low' | 'medium' | 'high';
  }> = [];

  /**
   * Log security-relevant events
   */
  public logSecurityEvent(action: string, details: any, risk: 'low' | 'medium' | 'high' = 'low'): void {
    this.auditLog.push({
      timestamp: Date.now(),
      action,
      details: this.sanitizeInput(JSON.stringify(details)),
      risk
    });

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }

    // Log high-risk events to console
    if (risk === 'high') {
      console.warn(`[SECURITY] High-risk event: ${action}`, details);
    }
  }

  /**
   * Get security audit log
   */
  public getAuditLog(): typeof this.auditLog {
    return [...this.auditLog]; // Return copy
  }

  /**
   * Clear audit log
   */
  public clearAuditLog(): void {
    this.auditLog = [];
  }
}

// === SECURITY UTILITIES ===
export const security = SecurityManager.getInstance();

// === SECURE RANDOM GENERATORS ===
export class SecureRandom {
  /**
   * Generate cryptographically secure random string
   */
  static generateSecureId(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }

  /**
   * Generate secure random number
   */
  static generateSecureNumber(min: number = 0, max: number = 1000000): number {
    const range = max - min;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
  }
}

// === CONTENT SCRIPT SECURITY ===
export class ContentScriptSecurity {
  /**
   * Validate DOM manipulation is safe
   */
  static validateDOMOperation(element: Element, operation: string): boolean {
    // Check if element is in a safe context
    if (!element || !element.ownerDocument) {
      return false;
    }

    // Ensure we're not manipulating sensitive elements
    const sensitiveSelectors = [
      'script',
      'iframe',
      'embed',
      'object',
      'link[rel="stylesheet"]',
      'style'
    ];

    for (const selector of sensitiveSelectors) {
      if (element.matches(selector)) {
        security.logSecurityEvent('unsafe_dom_operation', {
          operation,
          element: element.tagName,
          selector
        }, 'high');
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize element attributes before interaction
   */
  static sanitizeElementInteraction(element: Element): boolean {
    // Check for dangerous attributes
    const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover'];
    
    for (const attr of dangerousAttrs) {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr);
        if (value && value.includes('javascript:')) {
          security.logSecurityEvent('dangerous_attribute_detected', {
            attribute: attr,
            value
          }, 'high');
          return false;
        }
      }
    }

    return true;
  }
}

// === EXPORT SECURITY INSTANCE ===
export default security;