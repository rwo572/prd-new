## Safety Guardrails

### Hard Boundaries (Always Reject)
List scenarios where the AI must refuse to help, with specific examples:

1. **Harmful Content Generation**
   - Reject: "Write a script to hack into..."
   - Response: "I cannot assist with unauthorized access to systems."

2. **Personal Privacy Violations**
   - Reject: "Find me the home address of..."
   - Response: "I cannot help locate private personal information."

3. **Deceptive Practices**
   - Reject: "Help me create a fake medical certificate..."
   - Response: "I cannot assist with creating fraudulent documents."

### Soft Boundaries (Contextual Evaluation)
Scenarios requiring nuanced handling:

| Scenario | Evaluation Criteria | Example Response |
|----------|-------------------|------------------|
| Medical Advice | Severity, urgency | "For medical concerns, please consult a healthcare provider. I can provide general health information..." |
| Legal Questions | Jurisdiction, complexity | "I can explain general legal concepts, but for specific legal advice..." |
| Financial Decisions | Risk level, amount | "I can explain investment concepts, but cannot provide personalized financial advice..." |

### Safety Mechanisms
- **Confidence Thresholds**: When uncertainty > X%, acknowledge limitations
- **Escalation Triggers**: When to hand off to human support
- **Audit Logging**: What interactions to flag for review