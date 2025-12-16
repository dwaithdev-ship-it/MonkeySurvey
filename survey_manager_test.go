package main

import (
	"testing"
)

func TestCreateSurvey(t *testing.T) {
	manager := NewSurveyManager()

	questions := []Question{
		{Text: "Test question", Type: FreeText},
	}

	survey, err := manager.CreateSurvey("Test Survey", "Test Description", questions)
	if err != nil {
		t.Fatalf("Failed to create survey: %v", err)
	}

	if survey.Title != "Test Survey" {
		t.Errorf("Expected title 'Test Survey', got '%s'", survey.Title)
	}

	if len(survey.Questions) != 1 {
		t.Errorf("Expected 1 question, got %d", len(survey.Questions))
	}

	if survey.Questions[0].ID == "" {
		t.Error("Question ID should be auto-generated")
	}
}

func TestCreateSurveyValidation(t *testing.T) {
	manager := NewSurveyManager()

	// Test empty title
	_, err := manager.CreateSurvey("", "Description", []Question{{Text: "Q1", Type: FreeText}})
	if err == nil {
		t.Error("Expected error for empty title")
	}

	// Test no questions
	_, err = manager.CreateSurvey("Title", "Description", []Question{})
	if err == nil {
		t.Error("Expected error for no questions")
	}
}

func TestSubmitResponse(t *testing.T) {
	manager := NewSurveyManager()

	questions := []Question{
		{Text: "Question 1", Type: FreeText},
		{Text: "Question 2", Type: MultipleChoice, Options: []string{"A", "B", "C"}},
	}

	survey, _ := manager.CreateSurvey("Test Survey", "Description", questions)

	answers := []Answer{
		{QuestionID: survey.Questions[0].ID, Value: "My answer"},
		{QuestionID: survey.Questions[1].ID, Value: "A"},
	}

	response, err := manager.SubmitResponse(survey.ID, "user123", answers)
	if err != nil {
		t.Fatalf("Failed to submit response: %v", err)
	}

	if response.RespondentID != "user123" {
		t.Errorf("Expected respondent ID 'user123', got '%s'", response.RespondentID)
	}

	if len(response.Answers) != 2 {
		t.Errorf("Expected 2 answers, got %d", len(response.Answers))
	}
}

func TestSubmitResponseValidation(t *testing.T) {
	manager := NewSurveyManager()

	questions := []Question{
		{Text: "MC Question", Type: MultipleChoice, Options: []string{"A", "B"}},
	}

	survey, _ := manager.CreateSurvey("Test Survey", "Description", questions)

	// Test invalid multiple choice answer
	answers := []Answer{
		{QuestionID: survey.Questions[0].ID, Value: "C"}, // Invalid option
	}

	_, err := manager.SubmitResponse(survey.ID, "user123", answers)
	if err == nil {
		t.Error("Expected error for invalid multiple choice answer")
	}

	// Test invalid question ID
	answers = []Answer{
		{QuestionID: "invalid-id", Value: "A"},
	}

	_, err = manager.SubmitResponse(survey.ID, "user123", answers)
	if err == nil {
		t.Error("Expected error for invalid question ID")
	}
}

func TestGetResponses(t *testing.T) {
	manager := NewSurveyManager()

	questions := []Question{{Text: "Q1", Type: FreeText}}
	survey, _ := manager.CreateSurvey("Test Survey", "Description", questions)

	// Submit multiple responses
	for i := 1; i <= 3; i++ {
		answers := []Answer{{QuestionID: survey.Questions[0].ID, Value: "Answer"}}
		_, err := manager.SubmitResponse(survey.ID, "user", answers)
		if err != nil {
			t.Fatalf("Failed to submit response %d: %v", i, err)
		}
	}

	responses, err := manager.GetResponses(survey.ID)
	if err != nil {
		t.Fatalf("Failed to get responses: %v", err)
	}

	if len(responses) != 3 {
		t.Errorf("Expected 3 responses, got %d", len(responses))
	}
}

func TestGetResponsesByRespondent(t *testing.T) {
	manager := NewSurveyManager()

	questions := []Question{{Text: "Q1", Type: FreeText}}
	survey, _ := manager.CreateSurvey("Test Survey", "Description", questions)

	// Submit responses from different users
	answers := []Answer{{QuestionID: survey.Questions[0].ID, Value: "Answer"}}
	manager.SubmitResponse(survey.ID, "user001", answers)
	manager.SubmitResponse(survey.ID, "user002", answers)
	manager.SubmitResponse(survey.ID, "user001", answers)

	responses, err := manager.GetResponsesByRespondent(survey.ID, "user001")
	if err != nil {
		t.Fatalf("Failed to get responses by respondent: %v", err)
	}

	if len(responses) != 2 {
		t.Errorf("Expected 2 responses from user001, got %d", len(responses))
	}

	for _, resp := range responses {
		if resp.RespondentID != "user001" {
			t.Errorf("Expected respondent ID 'user001', got '%s'", resp.RespondentID)
		}
	}
}
