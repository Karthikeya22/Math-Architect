import { User, LogEntry, QuizResult, Quiz } from '../types';

// Constants for LocalStorage Keys
const DB_KEYS = {
  USERS: 'math_architect_users',
  LOGS: 'math_architect_logs',
  QUIZ_HISTORY: 'math_architect_quiz_history',
  SESSION: 'math_architect_session'
};

class DatabaseService {
  
  // --- AUTHENTICATION ---

  /**
   * Register a new user
   */
  register(username: string, fullName: string): User {
    const users = this.getUsers();
    
    if (users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      fullName,
      createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    
    // Auto login
    this.createSession(newUser);
    
    // Log creation
    this.logAction(newUser.id, 'USER_REGISTER', { username });

    return newUser;
  }

  /**
   * Login a user
   */
  login(username: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
      throw new Error('User not found');
    }

    this.createSession(user);
    this.logAction(user.id, 'USER_LOGIN', { timestamp: Date.now() });
    
    return user;
  }

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      this.logAction(user.id, 'USER_LOGOUT', {});
    }
    localStorage.removeItem(DB_KEYS.SESSION);
  }

  getCurrentUser(): User | null {
    const sessionStr = localStorage.getItem(DB_KEYS.SESSION);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  /** Persist session after server-backed login/register/guest. */
  setSessionFromUser(user: User) {
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
  }

  private createSession(user: User) {
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
  }

  private getUsers(): User[] {
    const usersStr = localStorage.getItem(DB_KEYS.USERS);
    return usersStr ? JSON.parse(usersStr) : [];
  }

  // --- LOGGING & TELEMETRY ---

  /**
   * Log any user action or click
   */
  logAction(userId: string, action: string, metadata?: any) {
    const logs = this.getLogs();
    
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      userId,
      action,
      timestamp: Date.now(),
      metadata
    };

    logs.push(newLog);
    
    // Safety cap: keep only last 1000 logs locally to prevent storage overflow
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));
    console.debug(`[DB] Logged: ${action}`, metadata);

    void (async () => {
      try {
        await fetch("/api/activity-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: [{ userId, action, metadata: metadata ?? {} }],
          }),
        });
      } catch {
        /* offline or server down */
      }
    })();
  }

  private getLogs(): LogEntry[] {
    const logsStr = localStorage.getItem(DB_KEYS.LOGS);
    return logsStr ? JSON.parse(logsStr) : [];
  }

  // --- DATA PERSISTENCE ---

  saveQuizAttempt(userId: string, quiz: Quiz, results: QuizResult[]) {
    const history = this.getQuizHistory();
    
    const record = {
      id: crypto.randomUUID(),
      userId,
      standardCode: quiz.standardCode,
      score: results.filter(r => r.isCorrect).length,
      total: results.length,
      timestamp: Date.now(),
      results
    };

    history.push(record);
    localStorage.setItem(DB_KEYS.QUIZ_HISTORY, JSON.stringify(history));
    
    this.logAction(userId, 'QUIZ_SAVED', { 
      standard: quiz.standardCode, 
      score: record.score 
    });
  }

  private getQuizHistory(): any[] {
    const str = localStorage.getItem(DB_KEYS.QUIZ_HISTORY);
    return str ? JSON.parse(str) : [];
  }

  /**
   * Admin helper to see what's happening
   */
  dumpDatabase() {
    return {
      users: this.getUsers(),
      logs: this.getLogs(),
      history: this.getQuizHistory()
    };
  }
}

export const dbService = new DatabaseService();