const { successResponse, errorResponse } = require('../utils/apiResponse');
const { rankFacultyForCourse } = require('../utils/recommendationEngine');

/**
 * Course Allocation Recommendation Controller
 */

// POST /api/v1/recommendations/course - Rank faculty for a course
const getFacultyRecommendations = async (req, res, next) => {
  try {
    const {
      course_id,
      session_id,
      component_type = 'theory',
      section_id = null,
      custom_weights = {},
    } = req.body;

    if (!course_id || !session_id) {
      return errorResponse(res, 'course_id and session_id are required.', null, 400);
    }

    const rankingResult = await rankFacultyForCourse({
      courseId: course_id,
      sessionId: session_id,
      componentType: component_type,
      sectionId: section_id,
      customWeights: custom_weights,
    });

    return successResponse(res, 'Faculty recommendations ranked successfully', rankingResult);
  } catch (err) {
    if (err.message.includes('not found')) {
      return errorResponse(res, err.message, null, 404);
    }
    next(err);
  }
};

module.exports = {
  getFacultyRecommendations,
};
