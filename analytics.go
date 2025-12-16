package main

import (
	"fmt"
	"sort"
)

// Analytics provides drill-down analysis capabilities
type Analytics struct {
	manager *SurveyManager
}

// NewAnalytics creates a new analytics instance
func NewAnalytics(manager *SurveyManager) *Analytics {
	return &Analytics{manager: manager}
}

// GetSurveyStats generates aggregate statistics for a survey
func (a *Analytics) GetSurveyStats(surveyID string) (*SurveyStats, error) {
	survey, err := a.manager.GetSurvey(surveyID)
	if err != nil {
		return nil, err
	}

	responses, err := a.manager.GetResponses(surveyID)
	if err != nil {
		return nil, err
	}

	stats := &SurveyStats{
		SurveyID:       surveyID,
		SurveyTitle:    survey.Title,
		TotalResponses: len(responses),
		Questions:      []QuestionStats{},
	}

	// Calculate statistics for each question
	for _, question := range survey.Questions {
		questionStats := a.GetQuestionStats(surveyID, question.ID)
		if questionStats != nil {
			stats.Questions = append(stats.Questions, *questionStats)
		}
	}

	return stats, nil
}

// GetQuestionStats generates statistics for a specific question
func (a *Analytics) GetQuestionStats(surveyID, questionID string) *QuestionStats {
	survey, err := a.manager.GetSurvey(surveyID)
	if err != nil {
		return nil
	}

	// Find the question
	var question *Question
	for i := range survey.Questions {
		if survey.Questions[i].ID == questionID {
			question = &survey.Questions[i]
			break
		}
	}
	if question == nil {
		return nil
	}

	responses, err := a.manager.GetResponses(surveyID)
	if err != nil {
		return nil
	}

	stats := &QuestionStats{
		QuestionID:   questionID,
		QuestionText: question.Text,
		TotalAnswers: 0,
		Breakdown:    make(map[string]int),
		Responses:    []string{},
	}

	// Collect all answers for this question
	for _, response := range responses {
		for _, answer := range response.Answers {
			if answer.QuestionID == questionID {
				stats.TotalAnswers++

				switch question.Type {
				case MultipleChoice, YesNo, Rating:
					stats.Breakdown[answer.Value]++
				case FreeText:
					stats.Responses = append(stats.Responses, answer.Value)
				}
			}
		}
	}

	return stats
}

// DrillDownByQuestion returns detailed responses for a specific question
func (a *Analytics) DrillDownByQuestion(surveyID, questionID string) ([]map[string]interface{}, error) {
	survey, err := a.manager.GetSurvey(surveyID)
	if err != nil {
		return nil, err
	}

	// Find the question
	var question *Question
	for i := range survey.Questions {
		if survey.Questions[i].ID == questionID {
			question = &survey.Questions[i]
			break
		}
	}
	if question == nil {
		return nil, fmt.Errorf("question not found: %s", questionID)
	}

	responses, err := a.manager.GetResponses(surveyID)
	if err != nil {
		return nil, err
	}

	results := []map[string]interface{}{}
	for _, response := range responses {
		for _, answer := range response.Answers {
			if answer.QuestionID == questionID {
				results = append(results, map[string]interface{}{
					"respondent_id": response.RespondentID,
					"answer":        answer.Value,
					"submitted_at":  response.SubmittedAt,
				})
			}
		}
	}

	return results, nil
}

// DrillDownByRespondent returns all answers from a specific respondent
func (a *Analytics) DrillDownByRespondent(surveyID, respondentID string) ([]map[string]interface{}, error) {
	survey, err := a.manager.GetSurvey(surveyID)
	if err != nil {
		return nil, err
	}

	responses, err := a.manager.GetResponsesByRespondent(surveyID, respondentID)
	if err != nil {
		return nil, err
	}

	// Create a question map for quick lookup
	questionMap := make(map[string]*Question)
	for i := range survey.Questions {
		questionMap[survey.Questions[i].ID] = &survey.Questions[i]
	}

	results := []map[string]interface{}{}
	for _, response := range responses {
		for _, answer := range response.Answers {
			question := questionMap[answer.QuestionID]
			results = append(results, map[string]interface{}{
				"question_id":   answer.QuestionID,
				"question_text": question.Text,
				"answer":        answer.Value,
				"submitted_at":  response.SubmittedAt,
			})
		}
	}

	return results, nil
}

// GetTopAnswers returns the most common answers for a question (useful for multiple choice)
func (a *Analytics) GetTopAnswers(surveyID, questionID string, limit int) ([]struct {
	Answer string
	Count  int
}, error) {
	stats := a.GetQuestionStats(surveyID, questionID)
	if stats == nil {
		return nil, fmt.Errorf("question stats not found")
	}

	type answerCount struct {
		Answer string
		Count  int
	}

	results := []answerCount{}
	for answer, count := range stats.Breakdown {
		results = append(results, answerCount{Answer: answer, Count: count})
	}

	// Sort by count descending
	sort.Slice(results, func(i, j int) bool {
		return results[i].Count > results[j].Count
	})

	// Limit results
	if limit > 0 && limit < len(results) {
		results = results[:limit]
	}

	// Convert to return type
	finalResults := make([]struct {
		Answer string
		Count  int
	}, len(results))
	for i, r := range results {
		finalResults[i].Answer = r.Answer
		finalResults[i].Count = r.Count
	}

	return finalResults, nil
}

// FilterResponsesByAnswer filters responses based on a specific answer to a question
func (a *Analytics) FilterResponsesByAnswer(surveyID, questionID, answerValue string) ([]*Response, error) {
	responses, err := a.manager.GetResponses(surveyID)
	if err != nil {
		return nil, err
	}

	filtered := []*Response{}
	for _, response := range responses {
		for _, answer := range response.Answers {
			if answer.QuestionID == questionID && answer.Value == answerValue {
				filtered = append(filtered, response)
				break
			}
		}
	}

	return filtered, nil
}
