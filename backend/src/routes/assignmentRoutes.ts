import { Router } from 'express';
import {
  createAssignment,
  listAssignments,
  getAssignmentById,
  deleteAssignment,
  regenerateAssignment,
  downloadPDF
} from '../controllers/assignmentController';
import { uploadMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

// Routes for '/api/assignments'
router.get('/', listAssignments);
router.post('/', uploadMiddleware.single('file'), createAssignment);
router.get('/:id', getAssignmentById);
router.delete('/:id', deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);
router.get('/:id/download', downloadPDF);

export default router;
