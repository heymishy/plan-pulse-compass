/**
 * Enhanced import progress hook with better UX and error recovery
 */

import { useState, useCallback, useRef } from 'react';

export interface ImportProgress {
  stage:
    | 'idle'
    | 'uploading'
    | 'parsing'
    | 'validating'
    | 'mapping'
    | 'processing'
    | 'completed'
    | 'error';
  progress: number; // 0-100
  message: string;
  errors: ImportError[];
  warnings: ImportWarning[];
  canCancel: boolean;
  canRetry: boolean;
  estimatedTimeRemaining?: number;
  rowsProcessed?: number;
  totalRows?: number;
}

export interface ImportError {
  id: string;
  row?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
  autoFixable?: boolean;
}

export interface ImportWarning extends ImportError {
  severity: 'warning';
}

export interface ImportStageConfig {
  name: string;
  description: string;
  estimatedDuration: number; // in ms
  skippable: boolean;
  retryable: boolean;
}

const IMPORT_STAGES: Record<ImportProgress['stage'], ImportStageConfig> = {
  idle: {
    name: 'Ready',
    description: 'Ready to import',
    estimatedDuration: 0,
    skippable: false,
    retryable: false,
  },
  uploading: {
    name: 'Uploading',
    description: 'Uploading file...',
    estimatedDuration: 2000,
    skippable: false,
    retryable: true,
  },
  parsing: {
    name: 'Parsing',
    description: 'Reading CSV data...',
    estimatedDuration: 3000,
    skippable: false,
    retryable: true,
  },
  validating: {
    name: 'Validating',
    description: 'Checking data quality...',
    estimatedDuration: 5000,
    skippable: true,
    retryable: true,
  },
  mapping: {
    name: 'Mapping',
    description: 'Mapping fields...',
    estimatedDuration: 1000,
    skippable: false,
    retryable: false,
  },
  processing: {
    name: 'Processing',
    description: 'Importing data...',
    estimatedDuration: 10000,
    skippable: false,
    retryable: true,
  },
  completed: {
    name: 'Completed',
    description: 'Import successful',
    estimatedDuration: 0,
    skippable: false,
    retryable: false,
  },
  error: {
    name: 'Error',
    description: 'Import failed',
    estimatedDuration: 0,
    skippable: false,
    retryable: true,
  },
};

export function useImportProgress() {
  const [progress, setProgress] = useState<ImportProgress>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to import',
    errors: [],
    warnings: [],
    canCancel: false,
    canRetry: false,
  });

  const cancelRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const stageStartTimeRef = useRef<number>(0);

  const updateProgress = useCallback((updates: Partial<ImportProgress>) => {
    setProgress(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const startStage = useCallback(
    (
      stage: ImportProgress['stage'],
      options?: {
        totalRows?: number;
        message?: string;
      }
    ) => {
      const stageConfig = IMPORT_STAGES[stage];
      const now = Date.now();

      if (stage === 'uploading') {
        startTimeRef.current = now;
        cancelRef.current = new AbortController();
      }

      stageStartTimeRef.current = now;

      updateProgress({
        stage,
        message: options?.message || stageConfig.description,
        canCancel:
          stageConfig.skippable ||
          ['uploading', 'parsing', 'validating'].includes(stage),
        canRetry: false,
        totalRows: options?.totalRows,
        rowsProcessed: stage === 'processing' ? 0 : undefined,
        estimatedTimeRemaining: stageConfig.estimatedDuration,
      });
    },
    [updateProgress]
  );

  const updateStageProgress = useCallback(
    (
      stageProgress: number,
      options?: {
        message?: string;
        rowsProcessed?: number;
        errors?: ImportError[];
        warnings?: ImportWarning[];
      }
    ) => {
      const now = Date.now();
      const elapsed = now - stageStartTimeRef.current;
      const estimatedTotal = elapsed / (stageProgress / 100);
      const remaining = Math.max(0, estimatedTotal - elapsed);

      updateProgress({
        progress: Math.min(100, Math.max(0, stageProgress)),
        message: options?.message,
        rowsProcessed: options?.rowsProcessed,
        estimatedTimeRemaining: remaining,
        errors: options?.errors || progress.errors,
        warnings: options?.warnings || progress.warnings,
      });
    },
    [updateProgress, progress.errors, progress.warnings]
  );

  const completeStage = useCallback(
    (result?: {
      errors?: ImportError[];
      warnings?: ImportWarning[];
      message?: string;
    }) => {
      updateProgress({
        progress: 100,
        errors: result?.errors || progress.errors,
        warnings: result?.warnings || progress.warnings,
        message: result?.message,
        estimatedTimeRemaining: 0,
      });
    },
    [updateProgress, progress.errors, progress.warnings]
  );

  const setError = useCallback(
    (error: string | ImportError[], canRetry = true) => {
      const errors =
        typeof error === 'string'
          ? [
              {
                id: Date.now().toString(),
                message: error,
                severity: 'error' as const,
              },
            ]
          : error;

      updateProgress({
        stage: 'error',
        message: 'Import failed',
        errors,
        canRetry,
        canCancel: false,
        estimatedTimeRemaining: 0,
      });
    },
    [updateProgress]
  );

  const reset = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.abort();
      cancelRef.current = null;
    }

    setProgress({
      stage: 'idle',
      progress: 0,
      message: 'Ready to import',
      errors: [],
      warnings: [],
      canCancel: false,
      canRetry: false,
    });
  }, []);

  const cancel = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.abort();
    }

    updateProgress({
      stage: 'idle',
      progress: 0,
      message: 'Import cancelled',
      canCancel: false,
      canRetry: true,
    });
  }, [updateProgress]);

  const retry = useCallback(() => {
    updateProgress({
      stage: 'idle',
      progress: 0,
      message: 'Ready to retry',
      errors: [],
      warnings: [],
      canCancel: false,
      canRetry: false,
    });
  }, [updateProgress]);

  const getElapsedTime = useCallback(() => {
    if (startTimeRef.current === 0) return 0;
    return Date.now() - startTimeRef.current;
  }, []);

  const getStageConfig = useCallback((stage: ImportProgress['stage']) => {
    return IMPORT_STAGES[stage];
  }, []);

  // Auto-update estimated time remaining
  const updateEstimatedTime = useCallback(() => {
    if (
      progress.stage === 'idle' ||
      progress.stage === 'completed' ||
      progress.stage === 'error'
    ) {
      return;
    }

    const stageConfig = IMPORT_STAGES[progress.stage];
    const elapsed = Date.now() - stageStartTimeRef.current;

    if (progress.progress > 0) {
      const estimatedTotal = elapsed / (progress.progress / 100);
      const remaining = Math.max(0, estimatedTotal - elapsed);

      updateProgress({
        estimatedTimeRemaining: remaining,
      });
    } else {
      updateProgress({
        estimatedTimeRemaining: stageConfig.estimatedDuration,
      });
    }
  }, [progress.stage, progress.progress, updateProgress]);

  return {
    progress,
    actions: {
      startStage,
      updateStageProgress,
      completeStage,
      setError,
      reset,
      cancel,
      retry,
      updateEstimatedTime,
    },
    utils: {
      getElapsedTime,
      getStageConfig,
      formatTimeRemaining: (ms: number) => {
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
      },
    },
    abortController: cancelRef.current,
  };
}
