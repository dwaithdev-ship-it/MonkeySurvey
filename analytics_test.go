package main

import (
	"testing"
)

func setupTestSurvey() (*SurveyManager, *Analytics, *Survey) {
	manager := NewSurveyManager()
	analytics := NewAnalytics(manager)

	questions := []Question{
		{Text: "Rating", Type: Rating},
		{Text: "Yes/No", Type: YesNo},
		{Text: "Choice", Type: MultipleChoice, Options: []string{"A", "B", "C"}},
		{Text: "Comments", Type: FreeText},
	}

	survey, _ := manager.CreateSurvey("Test Survey", "Description", questions)

	// Add sample responses
	responses := []struct {
		respondentID string
		answers      []Answer
	}{
		{
			respondentID: "user001",
			answers: []Answer{
				{QuestionID: survey.Questions[0].ID, Value: "5"},
				{QuestionID: survey.Questions[1].ID, Value: "Yes"},
				{QuestionID: survey.Questions[2].ID, Value: "A"},
				{QuestionID: survey.Questions[3].ID, Value: "Great!"},
			},
		},
		{
			respondentID: "user002",
			answers: []Answer{
				{QuestionID: survey.Questions[0].ID, Value: "4"},
				{QuestionID: survey.Questions[1].ID, Value: "Yes"},
				{QuestionID: survey.Questions[2].ID, Value: "B"},
				{QuestionID: survey.Questions[3].ID, Value: "Good"},
			},
		},
		{
			respondentID: "user003",
			answers: []Answer{
				{QuestionID: survey.Questions[0].ID, Value: "5"},
				{QuestionID: survey.Questions[1].ID, Value: "No"},
				{QuestionID: survey.Questions[2].ID, Value: "A"},
				{QuestionID: survey.Questions[3].ID, Value: "Excellent"},
			},
		},
	}

	for _, r := range responses {
		manager.SubmitResponse(survey.ID, r.respondentID, r.answers)
	}

	return manager, analytics, survey
}

func TestGetSurveyStats(t *testing.T) {
	_, analytics, survey := setupTestSurvey()

	stats, err := analytics.GetSurveyStats(survey.ID)
	if err != nil {
		t.Fatalf("Failed to get survey stats: %v", err)
	}

	if stats.TotalResponses != 3 {
		t.Errorf("Expected 3 responses, got %d", stats.TotalResponses)
	}

	if len(stats.Questions) != 4 {
		t.Errorf("Expected 4 question stats, got %d", len(stats.Questions))
	}
}

func TestGetQuestionStats(t *testing.T) {
	_, analytics, survey := setupTestSurvey()

	// Test multiple choice question
	mcQuestion := survey.Questions[2]
	stats := analytics.GetQuestionStats(survey.ID, mcQuestion.ID)

	if stats == nil {
		t.Fatal("Expected stats, got nil")
	}

	if stats.TotalAnswers != 3 {
		t.Errorf("Expected 3 answers, got %d", stats.TotalAnswers)
	}

	if stats.Breakdown["A"] != 2 {
		t.Errorf("Expected 2 'A' answers, got %d", stats.Breakdown["A"])
	}

	if stats.Breakdown["B"] != 1 {
		t.Errorf("Expected 1 'B' answer, got %d", stats.Breakdown["B"])
	}

	// Test free text question
	ftQuestion := survey.Questions[3]
	ftStats := analytics.GetQuestionStats(survey.ID, ftQuestion.ID)

	if len(ftStats.Responses) != 3 {
		t.Errorf("Expected 3 free text responses, got %d", len(ftStats.Responses))
	}
}

func TestDrillDownByQuestion(t *testing.T) {
	_, analytics, survey := setupTestSurvey()

	results, err := analytics.DrillDownByQuestion(survey.ID, survey.Questions[0].ID)
	if err != nil {
		t.Fatalf("Failed to drill down by question: %v", err)
	}

	if len(results) != 3 {
		t.Errorf("Expected 3 results, got %d", len(results))
	}

	// Verify each result has required fields
	for _, result := range results {
		if result["respondent_id"] == nil {
			t.Error("Result missing respondent_id")
		}
		if result["answer"] == nil {
			t.Error("Result missing answer")
		}
		if result["submitted_at"] == nil {
			t.Error("Result missing submitted_at")
		}
	}
}

func TestDrillDownByRespondent(t *testing.T) {
	_, analytics, survey := setupTestSurvey()

	results, err := analytics.DrillDownByRespondent(survey.ID, "user001")
	if err != nil {
		t.Fatalf("Failed to drill down by respondent: %v", err)
	}

	if len(results) != 4 {
		t.Errorf("Expected 4 answers from user001, got %d", len(results))
	}

	// Verify all results are from the correct respondent
	for _, result := range results {
		if result["question_id"] == nil {
			t.Error("Result missing question_id")
		}
		if result["question_text"] == nil {
			t.Error("Result missing question_text")
		}
		if result["answer"] == nil {
			t.Error("Result missing answer")
		}
	}
}

func TestGetTopAnswers(t *testing.T) {
	_, analytics, survey := setupTestSurvey()

	topAnswers, err := analytics.GetTopAnswers(survey.ID, survey.Questions[2].ID, 2)
	if err != nil {
		t.Fatalf("Failed to get top answers: %v", err)
	}

	if len(topAnswers) != 2 {
		t.Errorf("Expected 2 top answers, got %d", len(topAnswers))
	}

	// First answer should be "A" with count 2
	if topAnswers[0].Answer != "A" {
		t.Errorf("Expected first answer to be 'A', got '%s'", topAnswers[0].Answer)
	}

	if topAnswers[0].Count != 2 {
		t.Errorf("Expected first answer count to be 2, got %d", topAnswers[0].Count)
	}
}

func TestFilterResponsesByAnswer(t *testing.T) {
	_, analytics, survey := setupTestSurvey()

	filtered, err := analytics.FilterResponsesByAnswer(survey.ID, survey.Questions[2].ID, "A")
	if err != nil {
		t.Fatalf("Failed to filter responses: %v", err)
	}

	if len(filtered) != 2 {
		t.Errorf("Expected 2 filtered responses, got %d", len(filtered))
	}

	// Verify each response has answer "A" for the specified question
	for _, response := range filtered {
		found := false
		for _, answer := range response.Answers {
			if answer.QuestionID == survey.Questions[2].ID && answer.Value == "A" {
				found = true
				break
			}
		}
		if !found {
			t.Error("Filtered response doesn't contain the expected answer")
		}
	}
}
