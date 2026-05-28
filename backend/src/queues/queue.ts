import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';

// Create a queue for generating question papers via AI
export const questionQueue = new Queue('questionGeneration', {
  connection: redisConfig
});

// Create a queue for compiling PDF files from generated questions
export const pdfQueue = new Queue('pdfCompilation', {
  connection: redisConfig
});

console.log('BullMQ Queues initialized: questionGeneration, pdfCompilation');
