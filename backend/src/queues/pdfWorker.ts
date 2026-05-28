import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis';
import Assignment from '../models/Assignment';
import { generateAssignmentPDFs } from '../services/pdfService';
import { emitAssignmentUpdate } from '../services/websocketService';

export const pdfWorker = new Worker(
  'pdfCompilation',
  async (job: Job) => {
    const { assignmentId } = job.data;
    console.log(`Processing PDF Compile Job ${job.id} for assignment ${assignmentId}`);

    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        console.error(`Worker: Assignment ${assignmentId} not found`);
        return;
      }

      // Call the PDF Service
      const pdfPaths = await generateAssignmentPDFs(assignment);

      // Save PDF location in database
      assignment.status = 'completed';
      assignment.pdfPath = pdfPaths.studentPdfPath;
      await assignment.save();

      console.log(`PDF compilation completed for ${assignmentId}. File path: ${pdfPaths.studentPdfPath}`);

      // Notify the frontend with the completed assignment data
      emitAssignmentUpdate(assignmentId, 'assignment:status', {
        status: 'completed',
        pdfPath: pdfPaths.studentPdfPath,
        teacherPdfPath: pdfPaths.teacherPdfPath,
        assignment: assignment.toJSON()
      });
    } catch (error: any) {
      console.error(`PDF Compiler Worker error:`, error);

      // Update DB and broadcast failure
      try {
        const assignment = await Assignment.findById(assignmentId);
        if (assignment) {
          assignment.status = 'failed';
          assignment.error = error.message || 'Unknown PDF compilation error';
          await assignment.save();

          emitAssignmentUpdate(assignmentId, 'assignment:status', {
            status: 'failed',
            error: assignment.error
          });
        }
      } catch (dbErr) {
        console.error('Failed to save PDF worker error status to DB:', dbErr);
      }

      throw error;
    }
  },
  { connection: redisConfig }
);

pdfWorker.on('completed', (job) => {
  console.log(`PDF Worker: Job ${job.id} has completed!`);
});

pdfWorker.on('failed', (job, err) => {
  console.error(`PDF Worker: Job ${job?.id} failed with ${err.message}`);
});
