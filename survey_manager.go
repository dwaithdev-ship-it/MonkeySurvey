package main

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// SurveyManager manages surveys and responses
type SurveyManager struct {
	surveys   map[string]*Survey
	responses map[string][]*Response // Key: surveyID, Value: list of responses
}

// NewSurveyManager creates a new survey manager
func NewSurveyManager() *SurveyManager {
	return &SurveyManager{
		surveys:   make(map[string]*Survey),
		responses: make(map[string][]*Response),
	}
}

// CreateSurvey creates a new survey
func (sm *SurveyManager) CreateSurvey(title, description string, questions []Question) (*Survey, error) {
	if title == "" {
		return nil, fmt.Errorf("survey title cannot be empty")
	}
	if len(questions) == 0 {
		return nil, fmt.Errorf("survey must have at least one question")
	}

	survey := &Survey{
		ID:          uuid.New().String(),
		Title:       title,
		Description: description,
		Questions:   questions,
		CreatedAt:   time.Now(),
	}

	// Assign IDs to questions if not already set
	for i := range survey.Questions {
		if survey.Questions[i].ID == "" {
			survey.Questions[i].ID = uuid.New().String()
		}
	}

	sm.surveys[survey.ID] = survey
	sm.responses[survey.ID] = []*Response{}

	return survey, nil
}

// GetSurvey retrieves a survey by ID
func (sm *SurveyManager) GetSurvey(surveyID string) (*Survey, error) {
	survey, exists := sm.surveys[surveyID]
	if !exists {
		return nil, fmt.Errorf("survey not found: %s", surveyID)
	}
	return survey, nil
}

// ListSurveys returns all surveys
func (sm *SurveyManager) ListSurveys() []*Survey {
	surveys := make([]*Survey, 0, len(sm.surveys))
	for _, survey := range sm.surveys {
		surveys = append(surveys, survey)
	}
	return surveys
}

// SubmitResponse submits a response to a survey
func (sm *SurveyManager) SubmitResponse(surveyID, respondentID string, answers []Answer) (*Response, error) {
	survey, err := sm.GetSurvey(surveyID)
	if err != nil {
		return nil, err
	}

	// Validate answers
	if len(answers) == 0 {
		return nil, fmt.Errorf("response must contain at least one answer")
	}

	// Create question map for validation
	questionMap := make(map[string]*Question)
	for i := range survey.Questions {
		questionMap[survey.Questions[i].ID] = &survey.Questions[i]
	}

	// Validate each answer
	for _, answer := range answers {
		question, exists := questionMap[answer.QuestionID]
		if !exists {
			return nil, fmt.Errorf("invalid question ID: %s", answer.QuestionID)
		}

		// Validate multiple choice answers
		if question.Type == MultipleChoice {
			valid := false
			for _, option := range question.Options {
				if answer.Value == option {
					valid = true
					break
				}
			}
			if !valid {
				return nil, fmt.Errorf("invalid answer for question %s: %s not in options", answer.QuestionID, answer.Value)
			}
		}
	}

	response := &Response{
		ID:           uuid.New().String(),
		SurveyID:     surveyID,
		RespondentID: respondentID,
		Answers:      answers,
		SubmittedAt:  time.Now(),
	}

	sm.responses[surveyID] = append(sm.responses[surveyID], response)
	return response, nil
}

// GetResponses retrieves all responses for a survey
func (sm *SurveyManager) GetResponses(surveyID string) ([]*Response, error) {
	if _, err := sm.GetSurvey(surveyID); err != nil {
		return nil, err
	}

	responses, exists := sm.responses[surveyID]
	if !exists {
		return []*Response{}, nil
	}

	return responses, nil
}

// GetResponsesByRespondent retrieves responses from a specific respondent
func (sm *SurveyManager) GetResponsesByRespondent(surveyID, respondentID string) ([]*Response, error) {
	allResponses, err := sm.GetResponses(surveyID)
	if err != nil {
		return nil, err
	}

	filtered := []*Response{}
	for _, response := range allResponses {
		if response.RespondentID == respondentID {
			filtered = append(filtered, response)
		}
	}

	return filtered, nil
}
