package main

import (
	"time"
)

// QuestionType defines the type of question
type QuestionType string

const (
	MultipleChoice QuestionType = "multiple_choice"
	FreeText       QuestionType = "free_text"
	Rating         QuestionType = "rating"
	YesNo          QuestionType = "yes_no"
)

// Question represents a survey question
type Question struct {
	ID      string       `json:"id"`
	Text    string       `json:"text"`
	Type    QuestionType `json:"type"`
	Options []string     `json:"options,omitempty"` // For multiple choice questions
}

// Answer represents a single answer to a question
type Answer struct {
	QuestionID string `json:"question_id"`
	Value      string `json:"value"`
}

// Response represents a complete survey response from one respondent
type Response struct {
	ID           string    `json:"id"`
	SurveyID     string    `json:"survey_id"`
	RespondentID string    `json:"respondent_id"`
	Answers      []Answer  `json:"answers"`
	SubmittedAt  time.Time `json:"submitted_at"`
}

// Survey represents a survey with its questions
type Survey struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Questions   []Question `json:"questions"`
	CreatedAt   time.Time  `json:"created_at"`
}

// QuestionStats holds statistics for a single question
type QuestionStats struct {
	QuestionID   string            `json:"question_id"`
	QuestionText string            `json:"question_text"`
	TotalAnswers int               `json:"total_answers"`
	Breakdown    map[string]int    `json:"breakdown"`         // For multiple choice, yes/no, rating
	Responses    []string          `json:"responses,omitempty"` // For free text
}

// SurveyStats holds aggregate statistics for a survey
type SurveyStats struct {
	SurveyID       string          `json:"survey_id"`
	SurveyTitle    string          `json:"survey_title"`
	TotalResponses int             `json:"total_responses"`
	Questions      []QuestionStats `json:"questions"`
}
