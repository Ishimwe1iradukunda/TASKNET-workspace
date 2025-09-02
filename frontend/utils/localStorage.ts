import type { Note } from '~backend/workspace/notes/create';
import type { Task } from '~backend/workspace/tasks/create';
import type { Wiki } from '~backend/workspace/wikis/create';
import type { Project } from '~backend/workspace/projects/create';
import type { Email } from '~backend/workspace/emails/list';
import type { Document } from '~backend/workspace/documents/list';

export class LocalStorageManager {
  private static readonly NOTES_KEY = 'tasknetworkspace_notes';
  private static readonly TASKS_KEY = 'tasknetworkspace_tasks';
  private static readonly WIKIS_KEY = 'tasknetworkspace_wikis';
  private static readonly PROJECTS_KEY = 'tasknetworkspace_projects';
  private static readonly EMAILS_KEY = 'tasknetworkspace_emails';
  private static readonly DOCUMENTS_KEY = 'tasknetworkspace_documents';

  static init() {
    const keys = [this.NOTES_KEY, this.TASKS_KEY, this.WIKIS_KEY, this.PROJECTS_KEY, this.EMAILS_KEY, this.DOCUMENTS_KEY];
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  }

  // Generic getter/setter
  private static getItems<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Failed to load from localStorage key "${key}":`, error);
      return [];
    }
  }

  private static saveItems<T>(key: string, items: T[]) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error(`Failed to save to localStorage key "${key}":`, error);
    }
  }

  // Notes management
  static getNotes(): Note[] {
    return this.getItems<Note>(this.NOTES_KEY).map(note => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  }
  static saveNotes = (notes: Note[]) => this.saveItems(this.NOTES_KEY, notes);
  static createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
    const notes = this.getNotes();
    const note: Note = { ...data, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    notes.unshift(note);
    this.saveNotes(notes);
    return note;
  }
  static updateNote(id: string, updates: Partial<Note>): Note {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Note not found');
    const updatedNote = { ...notes[index], ...updates, updatedAt: new Date() };
    notes[index] = updatedNote;
    this.saveNotes(notes);
    return updatedNote;
  }
  static deleteNote = (id: string) => this.saveNotes(this.getNotes().filter(n => n.id !== id));
  static importNotes = (newNotes: any[]) => this.saveNotes(newNotes.map(n => ({ ...n, createdAt: new Date(n.createdAt || n.created_at), updatedAt: new Date(n.updatedAt || n.updated_at) })));

  // Tasks management
  static getTasks(): Task[] {
    return this.getItems<Task>(this.TASKS_KEY).map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    }));
  }
  static saveTasks = (tasks: Task[]) => this.saveItems(this.TASKS_KEY, tasks);
  static createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const tasks = this.getTasks();
    const task: Task = { ...data, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    tasks.unshift(task);
    this.saveTasks(tasks);
    return task;
  }
  static updateTask(id: string, updates: Partial<Task>): Task {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    const updatedTask = { ...tasks[index], ...updates, updatedAt: new Date() };
    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }
  static deleteTask = (id: string) => this.saveTasks(this.getTasks().filter(t => t.id !== id));
  static importTasks = (newTasks: any[]) => this.saveTasks(newTasks.map(t => ({ ...t, createdAt: new Date(t.createdAt || t.created_at), updatedAt: new Date(t.updatedAt || t.updated_at), dueDate: t.dueDate || t.due_date ? new Date(t.dueDate || t.due_date) : undefined })));

  // Wikis management
  static getWikis(): Wiki[] {
    return this.getItems<Wiki>(this.WIKIS_KEY).map(wiki => ({
      ...wiki,
      createdAt: new Date(wiki.createdAt),
      updatedAt: new Date(wiki.updatedAt),
    }));
  }
  static saveWikis = (wikis: Wiki[]) => this.saveItems(this.WIKIS_KEY, wikis);
  static createWiki(data: Omit<Wiki, 'id' | 'createdAt' | 'updatedAt'>): Wiki {
    const wikis = this.getWikis();
    const wiki: Wiki = { ...data, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    wikis.unshift(wiki);
    this.saveWikis(wikis);
    return wiki;
  }
  static updateWiki(id: string, updates: Partial<Wiki>): Wiki {
    const wikis = this.getWikis();
    const index = wikis.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Wiki not found');
    const updatedWiki = { ...wikis[index], ...updates, updatedAt: new Date() };
    wikis[index] = updatedWiki;
    this.saveWikis(wikis);
    return updatedWiki;
  }
  static deleteWiki = (id: string) => this.saveWikis(this.getWikis().filter(w => w.id !== id));

  // Projects management
  static getProjects(): Project[] {
    return this.getItems<Project>(this.PROJECTS_KEY).map(project => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      startDate: project.startDate ? new Date(project.startDate) : undefined,
      endDate: project.endDate ? new Date(project.endDate) : undefined,
    }));
  }
  static saveProjects = (projects: Project[]) => this.saveItems(this.PROJECTS_KEY, projects);
  static createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const projects = this.getProjects();
    const project: Project = { ...data, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    projects.unshift(project);
    this.saveProjects(projects);
    return project;
  }
  static updateProject(id: string, updates: Partial<Project>): Project {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    const updatedProject = { ...projects[index], ...updates, updatedAt: new Date() };
    projects[index] = updatedProject;
    this.saveProjects(projects);
    return updatedProject;
  }
  static deleteProject = (id: string) => this.saveProjects(this.getProjects().filter(p => p.id !== id));

  // Email management
  static getEmails(): Email[] {
    return this.getItems<Email>(this.EMAILS_KEY).map(email => ({
      ...email,
      receivedAt: new Date(email.receivedAt),
    }));
  }
  static saveEmails = (emails: Email[]) => this.saveItems(this.EMAILS_KEY, emails);
  static updateEmail(id: string, updates: Partial<Email>): Email {
    const emails = this.getEmails();
    const index = emails.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Email not found');
    const updatedEmail = { ...emails[index], ...updates };
    emails[index] = updatedEmail;
    this.saveEmails(emails);
    return updatedEmail;
  }
  static deleteEmail = (id: string) => this.saveEmails(this.getEmails().filter(e => e.id !== id));

  // Document management (metadata only)
  static getDocuments(): Document[] {
    return this.getItems<Document>(this.DOCUMENTS_KEY).map(doc => ({
      ...doc,
      createdAt: new Date(doc.createdAt),
    }));
  }
  static saveDocuments = (docs: Document[]) => this.saveItems(this.DOCUMENTS_KEY, docs);
  static deleteDocument = (id: string) => this.saveDocuments(this.getDocuments().filter(d => d.id !== id));

  // General utilities
  static clearAll() {
    [this.NOTES_KEY, this.TASKS_KEY, this.WIKIS_KEY, this.PROJECTS_KEY, this.EMAILS_KEY, this.DOCUMENTS_KEY].forEach(key => {
      localStorage.removeItem(key);
    });
    this.init();
  }
}
