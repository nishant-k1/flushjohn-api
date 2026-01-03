/**
 * Cron Job Scheduler for Automated Blog Generation
 * Manages weekly blog post generation and publishing
 */
import cron from "node-cron";
/**
 * Initialize and start all cron jobs
 */
export declare function initializeCronJobs(): {
    weeklyJob: cron.ScheduledTask;
    midWeekJob: cron.ScheduledTask;
    problemSolvingJob: cron.ScheduledTask;
    dailyJob: cron.ScheduledTask;
    healthJob: cron.ScheduledTask;
};
/**
 * Stop all cron jobs
 */
export declare function stopCronJobs(jobs: any): void;
/**
 * Get cron job status
 */
export declare function getCronJobStatus(): {
    jobs: {
        weeklyBlogGeneration: {
            isRunning: boolean;
            lastRun: any;
            lastSuccess: any;
            lastError: any;
            totalRuns: number;
            successfulRuns: number;
            failedRuns: number;
        };
        midWeekBlogGeneration: {
            isRunning: boolean;
            lastRun: any;
            lastSuccess: any;
            lastError: any;
            totalRuns: number;
            successfulRuns: number;
            failedRuns: number;
        };
        weeklyProblemSolving: {
            isRunning: boolean;
            lastRun: any;
            lastSuccess: any;
            lastError: any;
            totalRuns: number;
            successfulRuns: number;
            failedRuns: number;
        };
        dailyStatusCheck: {
            isRunning: boolean;
            lastRun: any;
            lastSuccess: any;
            lastError: any;
            totalRuns: number;
            successfulRuns: number;
            failedRuns: number;
        };
        healthCheck: {
            isRunning: boolean;
            lastRun: any;
            lastSuccess: any;
            lastError: any;
            totalRuns: number;
            successfulRuns: number;
            failedRuns: number;
        };
    };
    config: {
        weeklyBlogGeneration: string;
        midWeekBlogGeneration: string;
        weeklyProblemSolving: string;
        dailyStatusCheck: string;
        healthCheck: string;
    };
    systemInfo: {
        nodeVersion: string;
        platform: NodeJS.Platform;
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
    };
};
/**
 * Manually trigger a job (for testing)
 */
export declare function triggerJob(jobName: any): Promise<void>;
/**
 * Test cron job system
 */
export declare function testCronSystem(): Promise<boolean>;
//# sourceMappingURL=cronScheduler.d.ts.map