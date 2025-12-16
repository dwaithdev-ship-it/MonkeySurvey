package main

import (
	"encoding/json"
	"fmt"
	"os"
)

func main() {
	// Initialize the survey manager and analytics
	manager := NewSurveyManager()
	analytics := NewAnalytics(manager)

	// Create a sample survey
	fmt.Println("=== MonkeySurvey: Survey Drill-Down Demo ===")
	fmt.Println()

	// Create sample survey
	questions := []Question{
		{
			Text: "How satisfied are you with our product?",
			Type: Rating,
		},
		{
			Text: "Would you recommend our product to others?",
			Type: YesNo,
		},
		{
			Text: "Which feature do you use most?",
			Type: MultipleChoice,
			Options: []string{"Dashboard", "Reports", "Analytics", "Integration"},
		},
		{
			Text: "What improvements would you suggest?",
			Type: FreeText,
		},
	}

	survey, err := manager.CreateSurvey(
		"Product Feedback Survey",
		"Help us improve our product by sharing your feedback",
		questions,
	)
	if err != nil {
		fmt.Printf("Error creating survey: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Created Survey: %s\n", survey.Title)
	fmt.Printf("Survey ID: %s\n\n", survey.ID)

	// Simulate some responses
	sampleResponses := []struct {
		respondentID string
		answers      []Answer
	}{
		{
			respondentID: "user001",
			answers: []Answer{
				{QuestionID: survey.Questions[0].ID, Value: "5"},
				{QuestionID: survey.Questions[1].ID, Value: "Yes"},
				{QuestionID: survey.Questions[2].ID, Value: "Dashboard"},
				{QuestionID: survey.Questions[3].ID, Value: "More customization options"},
			},
		},
		{
			respondentID: "user002",
			answers: []Answer{
				{QuestionID: survey.Questions[0].ID, Value: "4"},
				{QuestionID: survey.Questions[1].ID, Value: "Yes"},
				{QuestionID: survey.Questions[2].ID, Value: "Reports"},
				{QuestionID: survey.Questions[3].ID, Value: "Better mobile support"},
			},
		},
		{
			respondentID: "user003",
			answers: []Answer{
				{QuestionID: survey.Questions[0].ID, Value: "5"},
				{QuestionID: survey.Questions[1].ID, Value: "Yes"},
				{QuestionID: survey.Questions[2].ID, Value: "Analytics"},
				{QuestionID: survey.Questions[3].ID, Value: "More integrations with third-party tools"},
			},
		},
		{
			respondentID: "user004",
			answers: []Answer{
				{QuestionID: survey.Questions[0].ID, Value: "3"},
				{QuestionID: survey.Questions[1].ID, Value: "No"},
				{QuestionID: survey.Questions[2].ID, Value: "Dashboard"},
				{QuestionID: survey.Questions[3].ID, Value: "Performance improvements needed"},
			},
		},
		{
			respondentID: "user005",
			answers: []Answer{
				{QuestionID: survey.Questions[0].ID, Value: "5"},
				{QuestionID: survey.Questions[1].ID, Value: "Yes"},
				{QuestionID: survey.Questions[2].ID, Value: "Analytics"},
				{QuestionID: survey.Questions[3].ID, Value: "Great product, keep it up!"},
			},
		},
	}

	fmt.Println("Collecting responses...")
	for _, sr := range sampleResponses {
		_, err := manager.SubmitResponse(survey.ID, sr.respondentID, sr.answers)
		if err != nil {
			fmt.Printf("Error submitting response: %v\n", err)
			continue
		}
	}
	fmt.Printf("Collected %d responses\n\n", len(sampleResponses))

	// Demonstrate drill-down capabilities
	fmt.Println("=== Aggregate Survey Statistics ===")
	stats, err := analytics.GetSurveyStats(survey.ID)
	if err != nil {
		fmt.Printf("Error getting stats: %v\n", err)
		os.Exit(1)
	}

	statsJSON, _ := json.MarshalIndent(stats, "", "  ")
	fmt.Println(string(statsJSON))

	// Drill down by specific question
	fmt.Println("\n=== Drill Down: Feature Usage (Question 3) ===")
	featureQuestion := survey.Questions[2]
	questionStats := analytics.GetQuestionStats(survey.ID, featureQuestion.ID)
	fmt.Printf("Question: %s\n", questionStats.QuestionText)
	fmt.Printf("Total Answers: %d\n", questionStats.TotalAnswers)
	fmt.Println("Breakdown:")
	for answer, count := range questionStats.Breakdown {
		percentage := float64(count) / float64(questionStats.TotalAnswers) * 100
		fmt.Printf("  %s: %d (%.1f%%)\n", answer, count, percentage)
	}

	// Get top answers
	fmt.Println("\n=== Top Answers for Feature Usage ===")
	topAnswers, _ := analytics.GetTopAnswers(survey.ID, featureQuestion.ID, 3)
	for i, ta := range topAnswers {
		fmt.Printf("%d. %s: %d responses\n", i+1, ta.Answer, ta.Count)
	}

	// Drill down by respondent
	fmt.Println("\n=== Drill Down: Responses from user001 ===")
	respondentData, err := analytics.DrillDownByRespondent(survey.ID, "user001")
	if err != nil {
		fmt.Printf("Error getting respondent data: %v\n", err)
	} else {
		respondentJSON, _ := json.MarshalIndent(respondentData, "", "  ")
		fmt.Println(string(respondentJSON))
	}

	// Filter responses by specific answer
	fmt.Println("\n=== Filter: Respondents who selected 'Dashboard' ===")
	dashboardUsers, err := analytics.FilterResponsesByAnswer(survey.ID, featureQuestion.ID, "Dashboard")
	if err != nil {
		fmt.Printf("Error filtering: %v\n", err)
	} else {
		fmt.Printf("Found %d respondents who selected Dashboard:\n", len(dashboardUsers))
		for _, resp := range dashboardUsers {
			fmt.Printf("  - %s (submitted at %s)\n", resp.RespondentID, resp.SubmittedAt.Format("2006-01-02 15:04:05"))
		}
	}

	// Show free-text responses
	fmt.Println("\n=== Drill Down: Free-Text Suggestions ===")
	suggestionQuestion := survey.Questions[3]
	suggestionStats := analytics.GetQuestionStats(survey.ID, suggestionQuestion.ID)
	fmt.Printf("Question: %s\n", suggestionStats.QuestionText)
	fmt.Printf("Total Responses: %d\n", len(suggestionStats.Responses))
	fmt.Println("Suggestions:")
	for i, suggestion := range suggestionStats.Responses {
		fmt.Printf("  %d. %s\n", i+1, suggestion)
	}

	fmt.Println("\n=== Demo Complete ===")
}
