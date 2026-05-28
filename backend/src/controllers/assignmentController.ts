import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import Assignment from '../models/Assignment';
import { questionQueue } from '../queues/queue';
import { config } from '../config/env';

/**
 * Creates an assignment, saves config, and adds to queue.
 */
export const createAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      schoolName,
      subject,
      grade,
      dueDate,
      additionalInstructions
    } = req.body;

    let questionConfigsRaw = req.body.questionConfigs;

    // Parse questionConfigs if it was sent as a string (common in multipart forms)
    let questionConfigs: any[] = [];
    if (typeof questionConfigsRaw === 'string') {
      try {
        questionConfigs = JSON.parse(questionConfigsRaw);
      } catch (parseErr) {
        res.status(400).json({ success: false, message: 'Invalid format for questionConfigs' });
        return;
      }
    } else {
      questionConfigs = questionConfigsRaw;
    }

    // --- Validation ---
    if (!title || !schoolName || !subject || !grade || !dueDate) {
      res.status(400).json({ success: false, message: 'Missing required configuration fields' });
      return;
    }

    if (!Array.isArray(questionConfigs) || questionConfigs.length === 0) {
      res.status(400).json({ success: false, message: 'At least one question type configuration is required' });
      return;
    }

    // Validate count and marks
    for (const item of questionConfigs) {
      if (!item.type || typeof item.type !== 'string' || item.type.trim() === '') {
        res.status(400).json({ success: false, message: 'Each question type must have a valid name' });
        return;
      }
      
      const count = Number(item.count);
      const marks = Number(item.marks);
      
      if (isNaN(count) || count <= 0 || !Number.isInteger(count)) {
        res.status(400).json({ success: false, message: `Invalid question count for ${item.type}. Must be a positive integer.` });
        return;
      }
      
      if (isNaN(marks) || marks <= 0) {
        res.status(400).json({ success: false, message: `Invalid question marks for ${item.type}. Must be a positive value.` });
        return;
      }
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid due date format' });
      return;
    }

    // Handle File Path
    let uploadedFilePath: string | undefined;
    if (req.file) {
      uploadedFilePath = req.file.path;
    }

    // Save to Database
    const assignment = new Assignment({
      title,
      schoolName,
      subject,
      grade,
      dueDate: parsedDueDate,
      questionConfigs,
      additionalInstructions,
      uploadedFilePath,
      status: 'pending'
    });

    await assignment.save();

    console.log(`Saved assignment ${assignment._id} to DB. Adding to question generation queue.`);

    // Enqueue the generation task
    await questionQueue.add('generateQuestions', {
      assignmentId: assignment._id.toString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000 // wait 5s, then 10s, etc.
      }
    });

    res.status(201).json({
      success: true,
      message: 'Assignment creation initiated successfully.',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists all assignments, supporting optional filters.
 */
export const listAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, subject } = req.query;
    const filter: any = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    if (subject) {
      filter.subject = { $regex: subject, $options: 'i' };
    }

    const assignments = await Assignment.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns full details of an assignment by ID.
 */
export const getAssignmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    res.status(200).json({ success: true, assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes an assignment and cleans up generated files on disk.
 */
export const deleteAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    // Clean up uploaded file
    if (assignment.uploadedFilePath && fs.existsSync(assignment.uploadedFilePath)) {
      fs.unlinkSync(assignment.uploadedFilePath);
    }

    // Clean up generated PDFs
    const studentPdfPath = path.join(config.UPLOADS_DIR, `${assignment._id}-student.pdf`);
    const teacherPdfPath = path.join(config.UPLOADS_DIR, `${assignment._id}-teacher.pdf`);
    
    if (fs.existsSync(studentPdfPath)) {
      fs.unlinkSync(studentPdfPath);
    }
    if (fs.existsSync(teacherPdfPath)) {
      fs.unlinkSync(teacherPdfPath);
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Triggers paper regeneration.
 */
export const regenerateAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    // Reset fields
    assignment.status = 'pending';
    assignment.error = undefined;
    assignment.generatedPaper = undefined;
    assignment.pdfPath = undefined;
    
    await assignment.save();

    console.log(`Initiating regeneration for assignment: ${assignment._id}`);

    // Re-enqueue the generation job
    await questionQueue.add('generateQuestions', {
      assignmentId: assignment._id.toString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });

    res.status(200).json({
      success: true,
      message: 'Regeneration job queued successfully.',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Downloads the student or teacher PDF version.
 */
export const downloadPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    if (assignment.status !== 'completed') {
      res.status(400).json({ success: false, message: 'PDF has not been compiled yet. Status is: ' + assignment.status });
      return;
    }

    const { role } = req.query; // 'teacher' or 'student'
    
    let fileName = `${assignment._id}-student.pdf`;
    let displayName = `${assignment.title.replace(/\s+/g, '_')}_Question_Paper.pdf`;

    if (role === 'teacher') {
      fileName = `${assignment._id}-teacher.pdf`;
      displayName = `${assignment.title.replace(/\s+/g, '_')}_Teacher_Key.pdf`;
    }

    const filePath = path.join(config.UPLOADS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'PDF file was not found on the server' });
      return;
    }

    res.download(filePath, displayName);
  } catch (error) {
    next(error);
  }
};
