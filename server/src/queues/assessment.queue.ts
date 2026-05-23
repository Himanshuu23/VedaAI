import { Queue, QueueEvents } from "bullmq";
import { bullRedis } from "../config/redis";
import { AssessmentJobData } from "../types";

export const assessmentQueue = new Queue<AssessmentJobData>("assessment-generation", {
  connection: bullRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500, age: 86400 },
    removeOnFail: { count: 100, age: 604800 },
  },
});

export const assessmentQueueEvents = new QueueEvents("assessment-generation", {
  connection: bullRedis,
});

export const addAssessmentJob = async (
  data: AssessmentJobData,
  assignmentId: string
): Promise<string> => {
  const job = await assessmentQueue.add("generate", data, {
    jobId: `assessment:${assignmentId}`,
    priority: 1,
  });
  return job.id as string;
};
