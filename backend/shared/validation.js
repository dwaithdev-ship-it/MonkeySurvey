const Joi = require('joi');

/**
 * User registration validation schema
 */
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  district: Joi.string().optional().allow(''),
  municipality: Joi.string().optional().allow('')
});

/**
 * User login validation schema
 */
const loginSchema = Joi.object({
  email: Joi.string().email(),
  phoneNumber: Joi.string(),
  password: Joi.string().required()
}).or('email', 'phoneNumber');

/**
 * Survey creation validation schema
 */
const surveySchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().allow(''),
  tags: Joi.array().items(Joi.string()),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  settings: Joi.object({
    anonymous: Joi.boolean(),
    multipleSubmissions: Joi.boolean(),
    showResults: Joi.boolean(),
    requireLogin: Joi.boolean(),
    randomizeQuestions: Joi.boolean(),
    maxResponses: Joi.number().integer().min(1)
  }),
  branding: Joi.object({
    logo: Joi.string().uri(),
    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    backgroundColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)
  }),
  questions: Joi.array().items(Joi.object({
    type: Joi.string().valid('multiple_choice', 'checkbox', 'text', 'textarea', 'rating', 'scale', 'date', 'dropdown', 'matrix').required(),
    question: Joi.string().min(3).max(500).required(),
    description: Joi.string().max(500).allow(''),
    required: Joi.boolean(),
    order: Joi.number().integer().min(0),
    options: Joi.array().items(Joi.object({
      value: Joi.string().required(),
      label: Joi.string().required(),
      order: Joi.number().integer()
    })),
    validation: Joi.object({
      minLength: Joi.number().integer().min(0),
      maxLength: Joi.number().integer().min(1),
      pattern: Joi.string(),
      min: Joi.number(),
      max: Joi.number()
    })
  })).min(1)
});

/**
 * Response submission validation schema
 */
const responseSchema = Joi.object({
  surveyId: Joi.string().required(),
  answers: Joi.array().items(Joi.object({
    questionId: Joi.string().required(),
    value: Joi.any().required()
  })).min(1).required()
});

/**
 * Validate request body against schema
 */
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details
        }
      });
    }

    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  surveySchema,
  responseSchema,
  validate
};
