
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveys as surveysAPI } from '../../services/api';

const questionTypes = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'dropdown', label: 'Dropdown' }
];

function SurveyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadSurvey();
    }
  }, [id]);

  const loadSurvey = async () => {
    try {
      const response = await surveysAPI.get(id);
      const survey = response.data.data;
      setTitle(survey.title);
      setDescription(survey.description || '');
      setQuestions(survey.questions || []);
    } catch (err) {
      setError('Failed to load survey');
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        question: '',
        required: false,
        options: []
      }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex) => {
    const updated = [...questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    updated[questionIndex].options.push({
      value: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      order: updated[questionIndex].options.length
    });
    setQuestions(updated);
  };

  const updateOption = (questionIndex, optionIndex, label) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex].label = label;
    setQuestions(updated);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const surveyData = {
        title,
        description,
        questions: questions.map((q, index) => ({
          ...q,
          order: index
        }))
      };

      if (id) {
        await surveysAPI.update(id, surveyData);
      } else {
        await surveysAPI.create(surveyData);
      }

      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save survey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>{id ? 'Edit Survey' : 'Create Survey'}</h1>
        <button onClick={() => navigate('/admin')} className="btn btn-secondary">
          Back to Admin
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>Survey Details</h2>
          
          <div className="form-group">
            <label className="form-label">Survey Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Questions</h2>
          <button type="button" onClick={addQuestion} className="btn btn-primary">
            Add Question
          </button>
        </div>

        {questions.map((question, qIndex) => (
          <div key={question._id} className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3>Question {qIndex + 1}</h3>
              <button
                type="button"
                onClick={() => removeQuestion(qIndex)}
                className="btn btn-secondary"
                style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
              >
                Remove
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Question Type</label>
              <select
                className="form-input"
                value={question.type}
                onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
              >
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <input
                type="text"
                className="form-input"
                value={question.question}
                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => updateQuestion(qIndex, 'required', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Required
              </label>
            </div>

            {(question.type === 'multiple_choice' || question.type === 'checkbox' || question.type === 'dropdown') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label">Options</label>
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Add Option
                  </button>
                </div>
                {question.options?.map((option, oIndex) => (
                  <div key={oIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Option ${oIndex + 1}`}
                      value={option.label}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="btn btn-secondary"
                      style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (id ? 'Update Survey' : 'Create Survey')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SurveyBuilder;
