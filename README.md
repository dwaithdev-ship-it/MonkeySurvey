# MonkeySurvey

A Go-based survey management and analytics application with powerful drill-down capabilities for user insights.

## Features

- **Survey Management**: Create surveys with multiple question types
- **Response Collection**: Collect and validate survey responses
- **Drill-Down Analytics**: Analyze survey data at multiple levels
  - Aggregate statistics across all responses
  - Drill down by individual questions
  - Drill down by respondent
  - Filter responses by specific answers
- **Multiple Question Types**: Support for various question formats
  - Multiple Choice
  - Yes/No
  - Rating
  - Free Text

## Quick Start

### Installation

```bash
go get github.com/dwaithdev-ship-it/MonkeySurvey
```

### Building

```bash
go build -o monkeysurvey
```

### Running the Demo

```bash
./monkeysurvey
```

This will run a comprehensive demo showing all drill-down capabilities.

## Usage

### Creating a Survey

```go
manager := NewSurveyManager()

questions := []Question{
    {
        Text: "How satisfied are you with our product?",
        Type: Rating,
    },
    {
        Text: "Would you recommend us?",
        Type: YesNo,
    },
    {
        Text: "Which feature do you use most?",
        Type: MultipleChoice,
        Options: []string{"Dashboard", "Reports", "Analytics"},
    },
}

survey, err := manager.CreateSurvey(
    "Customer Satisfaction Survey",
    "Help us improve our product",
    questions,
)
```

### Collecting Responses

```go
answers := []Answer{
    {QuestionID: survey.Questions[0].ID, Value: "5"},
    {QuestionID: survey.Questions[1].ID, Value: "Yes"},
    {QuestionID: survey.Questions[2].ID, Value: "Dashboard"},
}

response, err := manager.SubmitResponse(survey.ID, "user123", answers)
```

### Drill-Down Analytics

#### Get Aggregate Statistics

```go
analytics := NewAnalytics(manager)
stats, err := analytics.GetSurveyStats(survey.ID)
// Returns: total responses, breakdown by question, percentages
```

#### Drill Down by Question

```go
questionStats := analytics.GetQuestionStats(survey.ID, questionID)
// Returns: answer distribution, counts, percentages
```

#### Drill Down by Respondent

```go
respondentData, err := analytics.DrillDownByRespondent(survey.ID, "user123")
// Returns: all answers from a specific respondent
```

#### Filter by Answer

```go
filtered, err := analytics.FilterResponsesByAnswer(survey.ID, questionID, "Dashboard")
// Returns: all responses that selected "Dashboard"
```

#### Get Top Answers

```go
topAnswers, err := analytics.GetTopAnswers(survey.ID, questionID, 3)
// Returns: top 3 most common answers with counts
```

## Question Types

### Multiple Choice
Questions with predefined options where respondents select one answer.

```go
Question{
    Text: "Select your favorite color",
    Type: MultipleChoice,
    Options: []string{"Red", "Blue", "Green"},
}
```

### Yes/No
Binary questions with yes or no answers.

```go
Question{
    Text: "Would you recommend our product?",
    Type: YesNo,
}
```

### Rating
Numeric rating questions (typically 1-5 scale).

```go
Question{
    Text: "How satisfied are you?",
    Type: Rating,
}
```

### Free Text
Open-ended questions allowing any text response.

```go
Question{
    Text: "What improvements would you suggest?",
    Type: FreeText,
}
```

## Testing

Run all tests:

```bash
go test -v ./...
```

Run tests with coverage:

```bash
go test -cover ./...
```

## Architecture

The application consists of four main components:

1. **Models** (`models.go`): Core data structures for surveys, questions, responses
2. **Survey Manager** (`survey_manager.go`): Survey creation and response management
3. **Analytics** (`analytics.go`): Drill-down and statistical analysis
4. **Main** (`main.go`): Demo application showcasing all features

## API Reference

### SurveyManager

- `NewSurveyManager()` - Creates a new survey manager
- `CreateSurvey(title, description, questions)` - Creates a new survey
- `GetSurvey(surveyID)` - Retrieves a survey by ID
- `ListSurveys()` - Returns all surveys
- `SubmitResponse(surveyID, respondentID, answers)` - Submits a survey response
- `GetResponses(surveyID)` - Gets all responses for a survey
- `GetResponsesByRespondent(surveyID, respondentID)` - Gets responses from a specific user

### Analytics

- `NewAnalytics(manager)` - Creates a new analytics instance
- `GetSurveyStats(surveyID)` - Gets aggregate statistics for a survey
- `GetQuestionStats(surveyID, questionID)` - Gets statistics for a specific question
- `DrillDownByQuestion(surveyID, questionID)` - Gets detailed responses for a question
- `DrillDownByRespondent(surveyID, respondentID)` - Gets all answers from a respondent
- `GetTopAnswers(surveyID, questionID, limit)` - Gets most common answers
- `FilterResponsesByAnswer(surveyID, questionID, answerValue)` - Filters responses by answer

## Example Output

The demo application produces output showing:

1. **Survey Creation**: Confirmation of survey creation with ID
2. **Response Collection**: Number of responses collected
3. **Aggregate Statistics**: JSON output with complete survey statistics
4. **Question Breakdown**: Detailed analysis of individual questions with percentages
5. **Top Answers**: Most popular responses for multiple choice questions
6. **Respondent Drill-Down**: Complete response history for specific users
7. **Filtered Results**: Responses matching specific criteria
8. **Free-Text Responses**: All open-ended feedback

## License

MIT
