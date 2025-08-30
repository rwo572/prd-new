## Quality Standards

### Evaluation Metrics
Define specific, measurable criteria:

| Metric | Target | Measurement Method | Red Flag Threshold |
|--------|--------|-------------------|-------------------|
| Response Relevance | >90% | Human evaluation sampling | <75% |
| Factual Accuracy | >95% | Automated fact-checking | <85% |
| Safety Compliance | >99% | Automated safety checks | <95% |
| User Satisfaction | >4.0/5 | Post-interaction survey | <3.5 |

### Golden Dataset
Create a test set of input/output pairs that represent ideal behavior:

```yaml
golden_examples:
  - category: "Basic Functionality"
    input: "How do I reset my password?"
    expected_output: "To reset your password, click 'Forgot Password' on the login page..."
    unacceptable_outputs: 
      - "I don't know"
      - "Contact support"
    evaluation_criteria:
      - Must mention specific UI element
      - Must provide complete steps
      - Must offer alternative if primary method fails

  - category: "Error Handling"
    input: "The app keeps crashing"
    expected_output: "I'm sorry you're experiencing crashes. Let's troubleshoot: 1) What device are you using? 2) When does it crash?..."
    evaluation_criteria:
      - Acknowledge the problem
      - Gather diagnostic information
      - Provide immediate workaround if possible


### Human Review Rubric

Rate each response on these dimensions (1-5 scale):
1. **Relevance**: Does it address the user's actual need?
2. **Completeness**: Are all aspects of the query addressed?
3. **Accuracy**: Is the information correct?
4. **Clarity**: Is it easy to understand?
5. **Safety**: Does it avoid harmful content?
6. **Tone**: Is it appropriate for the context?