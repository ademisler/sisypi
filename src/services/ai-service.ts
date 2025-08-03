// AI Service for Sisypi Automation Assistant
// Integrates with Google Gemini API for intelligent element selection and automation

interface AIConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface ElementAnalysis {
  selector: string;
  confidence: number;
  description: string;
  alternatives: string[];
  suggestions: string[];
}

interface AutomationSuggestion {
  stepType: string;
  selector: string;
  text?: string;
  description: string;
  confidence: number;
}

export class AIService {
  private config: AIConfig;

  constructor() {
    this.config = {
      apiKey: '', // Will be set by user
      model: 'gemini-2.0-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
    };
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  async analyzeElement(elementData: {
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
    attributes: Record<string, string>;
    context: string; // Surrounding HTML context
  }): Promise<ElementAnalysis> {
    if (!this.config.apiKey) {
      throw new Error('AI API key not configured');
    }

    const prompt = `
Analyze this HTML element for web automation:

Element: <${elementData.tagName}${elementData.id ? ` id="${elementData.id}"` : ''}${elementData.className ? ` class="${elementData.className}"` : ''}>
Text Content: "${elementData.textContent || ''}"
Attributes: ${JSON.stringify(elementData.attributes)}

Context (surrounding HTML):
${elementData.context}

Please provide:
1. The most reliable CSS selector for this element
2. Confidence level (0-100)
3. Brief description of the element's purpose
4. Alternative selectors if the primary one fails
5. Suggestions for automation steps

Respond in JSON format:
{
  "selector": "most reliable CSS selector",
  "confidence": 95,
  "description": "Element purpose description",
  "alternatives": ["alternative selector 1", "alternative selector 2"],
  "suggestions": ["Click this button", "Type text here", etc.]
}
`;

    try {
      const response = await fetch(`${this.config.baseUrl}/${this.config.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.config.apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Invalid AI response format');
      }

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Fallback to basic analysis
      return this.fallbackAnalysis(elementData);
    }
  }

  async suggestAutomationSteps(pageContext: {
    url: string;
    title: string;
    elements: Array<{
      selector: string;
      type: string;
      text: string;
      purpose: string;
    }>;
    userGoal: string;
  }): Promise<AutomationSuggestion[]> {
    if (!this.config.apiKey) {
      throw new Error('AI API key not configured');
    }

    const prompt = `
Analyze this web page and suggest automation steps for the user goal:

Page URL: ${pageContext.url}
Page Title: ${pageContext.title}
User Goal: ${pageContext.userGoal}

Available Elements:
${pageContext.elements.map((el, i) => `${i + 1}. ${el.type} - "${el.text}" (${el.selector})`).join('\n')}

Please suggest a sequence of automation steps to achieve the user goal.
Use these step types: click, type, wait, hover, select_option, check_checkbox, assert_text

Respond in JSON format:
[
  {
    "stepType": "click",
    "selector": "#login-button",
    "description": "Click the login button",
    "confidence": 90
  },
  {
    "stepType": "type",
    "selector": "#username",
    "text": "{{username}}",
    "description": "Enter username",
    "confidence": 95
  }
]
`;

    try {
      const response = await fetch(`${this.config.baseUrl}/${this.config.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.config.apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Invalid AI response format');
      }

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      return [];
    }
  }

  private fallbackAnalysis(elementData: any): ElementAnalysis {
    // Basic fallback analysis without AI
    let selector = '';
    let confidence = 70;

    if (elementData.id) {
      selector = `#${elementData.id}`;
      confidence = 90;
    } else if (elementData.className) {
      const classes = elementData.className.split(' ').filter(c => c && !c.includes('sisypi'));
      if (classes.length > 0) {
        selector = `${elementData.tagName.toLowerCase()}.${classes.join('.')}`;
        confidence = 75;
      }
    } else {
      selector = elementData.tagName.toLowerCase();
      confidence = 50;
    }

    return {
      selector,
      confidence,
      description: `${elementData.tagName} element${elementData.textContent ? ` with text "${elementData.textContent}"` : ''}`,
      alternatives: [
        selector,
        `${elementData.tagName.toLowerCase()}:contains("${elementData.textContent}")`,
        `[data-testid="${elementData.attributes['data-testid'] || ''}"]`
      ].filter(Boolean),
      suggestions: [
        elementData.tagName === 'BUTTON' ? 'Click this button' : '',
        elementData.tagName === 'INPUT' ? 'Type text in this field' : '',
        elementData.tagName === 'A' ? 'Click this link' : ''
      ].filter(Boolean)
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/${this.config.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.config.apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Test connection. Respond with "OK".' }]
          }]
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const aiService = new AIService();