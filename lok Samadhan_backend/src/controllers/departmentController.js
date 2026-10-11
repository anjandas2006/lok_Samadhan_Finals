const { getDepartmentList, getDepartmentByCategory } = require('../constants/departments');
const { successResponse, errorResponse } = require('../utils/response');

class DepartmentController {
  /**
   * GET /api/departments
   */
  getDepartments(req, res) {
    try {
      const departments = getDepartmentList();
      return successResponse(res, departments, 'Departments retrieved successfully');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/departments/:category
   */
  getDepartmentByCategory(req, res) {
    try {
      const dept = getDepartmentByCategory(req.params.category);
      if (!dept) {
        return errorResponse(res, `Department ${req.params.category} not found`, 404);
      }
      return successResponse(res, dept, 'Department details retrieved');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }
}

module.exports = new DepartmentController();
