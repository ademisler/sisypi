import type { AutomationStep, Scenario } from '../types';
import { APP_CONFIG, STEP_CONFIGS, UI_TEXT } from '../constants';
import { isValidSelector } from '../utils';

// === VALIDATION RESULT TYPE ===
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// === ERROR CODES ===
export const ERROR_CODES = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  TOO_LONG: 'TOO_LONG',
  TOO_SHORT: 'TOO_SHORT',
  INVALID_NUMBER: 'INVALID_NUMBER',
  INVALID_SELECTOR: 'INVALID_SELECTOR',
  INVALID_URL: 'INVALID_URL',
  DUPLICATE_ID: 'DUPLICATE_ID',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  INVALID_CONTROL_FLOW: 'INVALID_CONTROL_FLOW',
} as const;

// === WARNING CODES ===
export const WARNING_CODES = {
  LONG_TITLE: 'LONG_TITLE',
  NO_URL_RESTRICTION: 'NO_URL_RESTRICTION',
  EMPTY_STEPS: 'EMPTY_STEPS',
  COMPLEX_SELECTOR: 'COMPLEX_SELECTOR',
  LONG_WAIT_TIME: 'LONG_WAIT_TIME',
} as const;

// === BASIC VALIDATORS ===
export const validators = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: ERROR_CODES.REQUIRED_FIELD,
      };
    }
    return null;
  },

  maxLength: (value: string, maxLen: number, fieldName: string): ValidationError | null => {
    if (value && value.length > maxLen) {
      return {
        field: fieldName,
        message: `${fieldName} must be ${maxLen} characters or less`,
        code: ERROR_CODES.TOO_LONG,
      };
    }
    return null;
  },

  minLength: (value: string, minLen: number, fieldName: string): ValidationError | null => {
    if (value && value.length < minLen) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${minLen} characters`,
        code: ERROR_CODES.TOO_SHORT,
      };
    }
    return null;
  },

  isNumber: (value: any, fieldName: string): ValidationError | null => {
    if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        code: ERROR_CODES.INVALID_NUMBER,
      };
    }
    return null;
  },

  isPositiveNumber: (value: any, fieldName: string): ValidationError | null => {
    const numberError = validators.isNumber(value, fieldName);
    if (numberError) return numberError;

    if (value !== null && value !== undefined && value !== '' && Number(value) <= 0) {
      return {
        field: fieldName,
        message: `${fieldName} must be a positive number`,
        code: ERROR_CODES.INVALID_NUMBER,
      };
    }
    return null;
  },

  isCssSelector: (value: string, fieldName: string): ValidationError | null => {
    if (value && !isValidSelector(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid CSS selector`,
        code: ERROR_CODES.INVALID_SELECTOR,
      };
    }
    return null;
  },

  isUrl: (value: string, fieldName: string): ValidationError | null => {
    if (value) {
      try {
        // Allow partial URLs for URL restrictions
        if (!value.includes('://')) {
          // Check if it looks like a domain or path
          const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.?[a-zA-Z]{0,}(\/.*)?$/;
          if (!domainPattern.test(value)) {
            return {
              field: fieldName,
              message: `${fieldName} must be a valid URL or domain`,
              code: ERROR_CODES.INVALID_URL,
            };
          }
        } else {
          new URL(value);
        }
      } catch {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid URL`,
          code: ERROR_CODES.INVALID_URL,
        };
      }
    }
    return null;
  },
};

// === STEP VALIDATION ===
export const validateStep = (step: AutomationStep, index?: number): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const fieldPrefix = index !== undefined ? `Step ${index + 1}` : 'Step';

  // Get step configuration
  const config = STEP_CONFIGS[step.type];
  if (!config) {
    errors.push({
      field: 'type',
      message: `Unknown step type: ${step.type}`,
      code: ERROR_CODES.INVALID_FORMAT,
    });
    return { isValid: false, errors, warnings };
  }

  // Validate selector if required
  if (config.hasSelector) {
    const requiredError = validators.required(step.selector, `${fieldPrefix} selector`);
    if (requiredError) {
      errors.push(requiredError);
    } else if (step.selector) {
      const selectorError = validators.isCssSelector(step.selector, `${fieldPrefix} selector`);
      if (selectorError) {
        errors.push(selectorError);
      }

      // Warning for complex selectors
      if (step.selector.length > 50 || step.selector.split(' ').length > 5) {
        warnings.push({
          field: 'selector',
          message: `${fieldPrefix} has a complex selector that might be fragile`,
          code: WARNING_CODES.COMPLEX_SELECTOR,
        });
      }
    }
  }

  // Validate text if required
  if (config.hasText) {
    const requiredError = validators.required(step.text, `${fieldPrefix} text`);
    if (requiredError) {
      errors.push(requiredError);
    }
  }

  // Validate variable name if required
  if (config.hasVariable) {
    const requiredError = validators.required(step.variable, `${fieldPrefix} variable name`);
    if (requiredError) {
      errors.push(requiredError);
    } else if (step.variable) {
      // Variable name should be a valid identifier
      const variablePattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
      if (!variablePattern.test(step.variable)) {
        errors.push({
          field: 'variable',
          message: `${fieldPrefix} variable name must be a valid identifier`,
          code: ERROR_CODES.INVALID_FORMAT,
        });
      }
    }
  }

  // Validate duration if required
  if (config.hasDuration) {
    const numberError = validators.isPositiveNumber(step.duration, `${fieldPrefix} duration`);
    if (numberError) {
      errors.push(numberError);
    } else if (step.duration && Number(step.duration) > 30000) {
      warnings.push({
        field: 'duration',
        message: `${fieldPrefix} has a very long wait time (${step.duration}ms)`,
        code: WARNING_CODES.LONG_WAIT_TIME,
      });
    }
  }

  // Validate repetitions if required
  if (config.hasRepetitions) {
    const numberError = validators.isPositiveNumber(step.repetitions, `${fieldPrefix} repetitions`);
    if (numberError) {
      errors.push(numberError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// === SCENARIO VALIDATION ===
export const validateScenario = (scenario: Scenario): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate title
  const titleRequiredError = validators.required(scenario.title, 'Scenario title');
  if (titleRequiredError) {
    errors.push(titleRequiredError);
  } else {
    const titleLengthError = validators.maxLength(
      scenario.title,
      APP_CONFIG.MAX_SCENARIO_NAME_LENGTH,
      'Scenario title'
    );
    if (titleLengthError) {
      errors.push(titleLengthError);
    }

    // Warning for long titles
    if (scenario.title.length > 50) {
      warnings.push({
        field: 'title',
        message: 'Scenario title is quite long',
        code: WARNING_CODES.LONG_TITLE,
      });
    }
  }

  // Validate URL restriction
  if (scenario.urlRestriction) {
    const urlError = validators.isUrl(scenario.urlRestriction, 'URL restriction');
    if (urlError) {
      errors.push(urlError);
    }
  } else {
    warnings.push({
      field: 'urlRestriction',
      message: 'No URL restriction set - scenario will run on any page',
      code: WARNING_CODES.NO_URL_RESTRICTION,
    });
  }

  // Validate steps
  if (scenario.steps.length === 0) {
    warnings.push({
      field: 'steps',
      message: 'Scenario has no steps',
      code: WARNING_CODES.EMPTY_STEPS,
    });
  } else {
    // Validate each step
    scenario.steps.forEach((step, index) => {
      const stepValidation = validateStep(step, index);
      errors.push(...stepValidation.errors);
      warnings.push(...stepValidation.warnings);
    });

    // Validate control flow structure
    const controlFlowValidation = validateControlFlow(scenario.steps);
    errors.push(...controlFlowValidation.errors);
    warnings.push(...controlFlowValidation.warnings);
  }

  // Check for too many steps
  if (scenario.steps.length > APP_CONFIG.MAX_STEPS_PER_SCENARIO) {
    errors.push({
      field: 'steps',
      message: `Scenario has too many steps (${scenario.steps.length}). Maximum is ${APP_CONFIG.MAX_STEPS_PER_SCENARIO}`,
      code: ERROR_CODES.TOO_LONG,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// === CONTROL FLOW VALIDATION ===
export const validateControlFlow = (steps: AutomationStep[]): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const stack: { type: 'if' | 'loop'; index: number }[] = [];

  steps.forEach((step, index) => {
    switch (step.type) {
      case 'if_start':
        stack.push({ type: 'if', index });
        break;

      case 'else_block':
        if (stack.length === 0 || stack[stack.length - 1].type !== 'if') {
          errors.push({
            field: 'steps',
            message: `ELSE at step ${index + 1} has no matching IF`,
            code: ERROR_CODES.INVALID_CONTROL_FLOW,
          });
        }
        break;

      case 'if_end':
        if (stack.length === 0 || stack[stack.length - 1].type !== 'if') {
          errors.push({
            field: 'steps',
            message: `END IF at step ${index + 1} has no matching IF`,
            code: ERROR_CODES.INVALID_CONTROL_FLOW,
          });
        } else {
          stack.pop();
        }
        break;

      case 'loop_start':
        stack.push({ type: 'loop', index });
        break;

      case 'loop_end':
        if (stack.length === 0 || stack[stack.length - 1].type !== 'loop') {
          errors.push({
            field: 'steps',
            message: `END LOOP at step ${index + 1} has no matching LOOP`,
            code: ERROR_CODES.INVALID_CONTROL_FLOW,
          });
        } else {
          stack.pop();
        }
        break;
    }
  });

  // Check for unclosed blocks
  stack.forEach((block) => {
    const blockType = block.type === 'if' ? 'IF' : 'LOOP';
    errors.push({
      field: 'steps',
      message: `${blockType} at step ${block.index + 1} is not closed`,
      code: ERROR_CODES.INVALID_CONTROL_FLOW,
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// === FORM VALIDATION ===
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Array<(value: any, fieldName: string) => ValidationError | null>>
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  Object.entries(rules).forEach(([fieldName, fieldRules]) => {
    const value = data[fieldName as keyof T];
    fieldRules.forEach((rule) => {
      const error = rule(value, fieldName);
      if (error) {
        errors.push(error);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// === VALIDATION HELPERS ===
export const getValidationSummary = (validation: ValidationResult): string => {
  if (validation.isValid) {
    return 'All validations passed';
  }

  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;

  let summary = `${errorCount} error${errorCount !== 1 ? 's' : ''}`;
  if (warningCount > 0) {
    summary += `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
  }

  return summary;
};

export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map((error) => `• ${error.message}`).join('\n');
};

export const formatValidationWarnings = (warnings: ValidationWarning[]): string => {
  return warnings.map((warning) => `• ${warning.message}`).join('\n');
};