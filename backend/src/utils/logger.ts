import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

// Current log level based on environment
const currentLogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG);

// Maps log levels to their priority (higher = more important)
const logLevelPriority: Record<LogLevel, number> = {
  [LogLevel.ERROR]: 4,
  [LogLevel.WARN]: 3,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 1,
};

// Check if a log should be shown based on level
function shouldLog(level: LogLevel): boolean {
  return logLevelPriority[level] >= logLevelPriority[currentLogLevel];
}

// Format date for logs
function formatDate(date: Date): string {
  return date.toISOString();
}

// Format log message
function formatLog(level: LogLevel, message: string, meta?: any): string {
  const timestamp = formatDate(new Date());
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (meta) {
    try {
      logMessage += ` ${JSON.stringify(meta)}`;
    } catch (e) {
      logMessage += ` [Non-serializable data]`;
    }
  }

  return logMessage;
}

// Log to console
function logToConsole(level: LogLevel, message: string, meta?: any): void {
  if (!shouldLog(level)) return;

  const logMessage = formatLog(level, message, meta);

  switch(level) {
    case LogLevel.ERROR:
      console.error(logMessage);
      break;
    case LogLevel.WARN:
      console.warn(logMessage);
      break;
    case LogLevel.INFO:
      console.info(logMessage);
      break;
    case LogLevel.DEBUG:
      console.debug(logMessage);
      break;
  }
}

// Log to file (for production environments)
function logToFile(level: LogLevel, message: string, meta?: any): void {
  if (process.env.NODE_ENV !== 'production' || !shouldLog(level)) return;
  
  try {
    const logsDir = path.join(__dirname, '../../logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logMessage = formatLog(level, message, meta) + '\n';
    
    // Append to log file
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Logger functions
export const logger = {
  error: (message: string, meta?: any) => {
    logToConsole(LogLevel.ERROR, message, meta);
    logToFile(LogLevel.ERROR, message, meta);
  },
  warn: (message: string, meta?: any) => {
    logToConsole(LogLevel.WARN, message, meta);
    logToFile(LogLevel.WARN, message, meta);
  },
  info: (message: string, meta?: any) => {
    logToConsole(LogLevel.INFO, message, meta);
    logToFile(LogLevel.INFO, message, meta);
  },
  debug: (message: string, meta?: any) => {
    logToConsole(LogLevel.DEBUG, message, meta);
    logToFile(LogLevel.DEBUG, message, meta);
  }
};