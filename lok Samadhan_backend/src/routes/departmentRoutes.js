const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// GET /api/departments - List all 8 civic departments
router.get('/', (req, res) => departmentController.getDepartments(req, res));

// GET /api/departments/:category - Get single department details
router.get('/:category', (req, res) => departmentController.getDepartmentByCategory(req, res));

module.exports = router;
