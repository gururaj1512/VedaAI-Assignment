import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis';
import Assignment from '../models/Assignment';
import { generateQuestionPaper } from '../services/aiService';
import { pdfQueue } from './queue';
import { emitAssignmentUpdate } from '../services/websocketService';

export const questionWorker = new Worker(
  'questionGeneration',
  async (job: Job) => {
    const { assignmentId } = job.data;
    console.log(`Processing AI Generation Job ${job.id} for assignment ${assignmentId}`);

    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        console.error(`Worker: Assignment ${assignmentId} not found`);
        return;
      }

      // Update DB to generating
      assignment.status = 'generating';
      assignment.error = undefined;
      await assignment.save();

      // Emit status to frontend
      emitAssignmentUpdate(assignmentId, 'assignment:status', {
        status: 'generating',
        progress: 'Formulating structured prompt & generating question paper...'
      });

      // Call the AI Service
      const paperResult = await generateQuestionPaper(assignment);

      // Save output
      assignment.generatedPaper = paperResult;
      await assignment.save();

      console.log(`AI Generation completed for ${assignmentId}. Adding PDF Compile job to queue.`);

      emitAssignmentUpdate(assignmentId, 'assignment:status', {
        status: 'generating',
        progress: 'Questions successfully generated! Starting PDF compilation...'
      });

      // Hand off to PDF compiling queue
      await pdfQueue.add('compilePdf', { assignmentId });
    } catch (error: any) {
      console.error(`AI Question Generation Worker error:`, error);

      let errorMessage = error.message || 'Unknown AI generation error';
      try {
        // Parse stringified JSON errors (e.g. Gemini 503 unavailable status)
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        } else if (parsed.message) {
          errorMessage = parsed.message;
        }
      } catch (e) {
        // Not a JSON string
      }

      const attemptsMade = job.attemptsMade + 1;
      const maxAttempts = job.opts.attempts || 1;

      if (attemptsMade >= maxAttempts) {
        // Final failure: Update DB & notify frontend of error
        try {
          const assignment = await Assignment.findById(assignmentId);
          if (assignment) {
            assignment.status = 'failed';
            assignment.error = errorMessage;
            await assignment.save();

            emitAssignmentUpdate(assignmentId, 'assignment:status', {
              status: 'failed',
              error: assignment.error
            });
          }
        } catch (dbErr) {
          console.error('Failed to save worker error status to DB:', dbErr);
        }
      } else {
        // Attempt failed, but retrying: notify frontend of the retry attempt
        try {
          emitAssignmentUpdate(assignmentId, 'assignment:status', {
            status: 'generating',
            progress: `API busy (503). Retrying paper generation (Attempt ${attemptsMade + 1} of ${maxAttempts})...`
          });
        } catch (wsErr) {
          console.error('Failed to emit WebSocket retry status:', wsErr);
        }
      }

      throw error; // rethrow to trigger BullMQ retry / backoff schedule
    }
  },
  { connection: redisConfig }
);

questionWorker.on('completed', (job) => {
  console.log(`Question Worker: Job ${job.id} has completed!`);
});

questionWorker.on('failed', (job, err) => {
  console.error(`Question Worker: Job ${job?.id} failed with ${err.message}`);
});
