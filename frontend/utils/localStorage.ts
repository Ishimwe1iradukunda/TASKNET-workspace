import type { Note } from '~backend/workspace/notes/create';
import type { Task } from '~backend/workspace/tasks/create';

interface Wiki {
  id: string;
  title: string;
  content: string;
  tags: string[];
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "completed" | "archived";
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LocalStorageManager {
  private static readonly NOTES_KEY = 'workspace_notes';
  private static readonly TASKS_KEY = 'workspace_tasks';
  private static readonly WIKIS_KEY = 'workspace_wikis';
  private static readonly PROJECTS_KEY = 'workspace_projects';

  static init() {
    // Initialize storage if not exists
    if (!localStorage.getItem(this.NOTES_KEY)) {
      localStorage.setItem(this.NOTES_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.TASKS_KEY)) {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.WIKIS_KEY)) {
      localStorage.setItem(this.WIKIS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.PROJECTS_KEY)) {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify([]));
    }
  }

  // Notes management
  static getNotes(): Note[] {
    try {
      const data = localStorage.getItem(this.NOTES_KEY);
      const notes = data ? JSON.parse(data) : [];
      // Convert date strings back to Date objects
      return notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load notes from localStorage:', error);
      return [];
    }
  }

  static saveNotes(notes: Note[]) {
    try {
      localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Failed to save notes to localStorage:', error);
    }
  }

  static createNote(data: { title: string; content: string; tags: string[] }): Note {
    const notes = this.getNotes();
    const note: Note = {
      id: crypto.randomUUID(),
      title: data.title,
      content: data.content,
      tags: data.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    notes.unshift(note);
    this.saveNotes(notes);
    return note;
  }

  static updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Note {
    const notes = this.getNotes();
    const index = notes.findIndex(note => note.id === id);
    
    if (index === -1) {
      throw new Error('Note not found');
    }
    
    const updatedNote = {
      ...notes[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    notes[index] = updatedNote;
    this.saveNotes(notes);
    return updatedNote;
  }

  static deleteNote(id: string) {
    const notes = this.getNotes();
    const filtered = notes.filter(note => note.id !== id);
    this.saveNotes(filtered);
  }

  static importNotes(newNotes: any[]) {
    try {
      const processedNotes = newNotes.map(note => ({
        ...note,
        createdAt: new Date(note.createdAt || note.created_at),
        updatedAt: new Date(note.updatedAt || note.updated_at),
      }));
      this.saveNotes(processedNotes);
    } catch (error) {
      console.error('Failed to import notes:', error);
      throw error;
    }
  }

  // Tasks management
  static getTasks(): Task[] {
    try {
      const data = localStorage.getItem(this.TASKS_KEY);
      const tasks = data ? JSON.parse(data) : [];
      // Convert date strings back to Date objects
      return tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
      return [];
    }
  }

  static saveTasks(tasks: Task[]) {
    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }

  static createTask(data: {
    title: string;
    description?: string;
    tags: string[];
    status?: 'todo' | 'in-progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }): Task {
    const tasks = this.getTasks();
    const task: Task = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      tags: data.tags,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    tasks.unshift(task);
    this.saveTasks(tasks);
    return task;
  }

  static updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task {
    const tasks = this.getTasks();
    const index = tasks.findIndex(task => task.id === id);
    
    if (index === -1) {
      throw new Error('Task not found');
    }
    
    const updatedTask = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  static deleteTask(id: string) {
    const tasks = this.getTasks();
    const filtered = tasks.filter(task => task.id !== id);
    this.saveTasks(filtered);
  }

  static importTasks(newTasks: any[]) {
    try {
      const processedTasks = newTasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt || task.created_at),
        updatedAt: new Date(task.updatedAt || task.updated_at),
        dueDate: task.dueDate || task.due_date ? new Date(task.dueDate || task.due_date) : undefined,
      }));
      this.saveTasks(processedTasks);
    } catch (error) {
      console.error('Failed to import tasks:', error);
      throw error;
    }
  }

  // Wikis management
  static getWikis(): Wiki[] {
    try {
      const data = localStorage.getItem(this.WIKIS_KEY);
      const wikis = data ? JSON.parse(data) : [];
      return wikis.map((wiki: any) => ({
        ...wiki,
        createdAt: new Date(wiki.createdAt),
        updatedAt: new Date(wiki.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load wikis from localStorage:', error);
      return [];
    }
  }

  static saveWikis(wikis: Wiki[]) {
    try {
      localStorage.setItem(this.WIKIS_KEY, JSON.stringify(wikis));
    } catch (error) {
      console.error('Failed to save wikis to localStorage:', error);
    }
  }

  static createWiki(data: { title: string; content: string; tags: string[]; parentId?: string }): Wiki {
    const wikis = this.getWikis();
    const wiki: Wiki = {
      id: crypto.randomUUID(),
      title: data.title,
      content: data.content,
      tags: data.tags,
      parentId: data.parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    wikis.unshift(wiki);
    this.saveWikis(wikis);
    return wiki;
  }

  static updateWiki(id: string, updates: Partial<Omit<Wiki, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>>): Wiki {
    const wikis = this.getWikis();
    const index = wikis.findIndex(wiki => wiki.id === id);
    
    if (index === -1) {
      throw new Error('Wiki not found');
    }
    
    const updatedWiki = {
      ...wikis[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    wikis[index] = updatedWiki;
    this.saveWikis(wikis);
    return updatedWiki;
  }

  static deleteWiki(id: string) {
    const wikis = this.getWikis();
    const filtered = wikis.filter(wiki => wiki.id !== id);
    this.saveWikis(filtered);
  }

  // Projects management
  static getProjects(): Project[] {
    try {
      const data = localStorage.getItem(this.PROJECTS_KEY);
      const projects = data ? JSON.parse(data) : [];
      return projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
      }));
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error);
      return [];
    }
  }

  static saveProjects(projects: Project[]) {
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects to localStorage:', error);
    }
  }

  static createProject(data: {
    name: string;
    description?: string;
    status?: "active" | "paused" | "completed" | "archived";
    startDate?: Date;
    endDate?: Date;
  }): Project {
    const projects = this.getProjects();
    const project: Project = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      status: data.status || "active",
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    projects.unshift(project);
    this.saveProjects(projects);
    return project;
  }

  static updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project {
    const projects = this.getProjects();
    const index = projects.findIndex(project => project.id === id);
    
    if (index === -1) {
      throw new Error('Project not found');
    }
    
    const updatedProject = {
      ...projects[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    projects[index] = updatedProject;
    this.saveProjects(projects);
    return updatedProject;
  }

  static deleteProject(id: string) {
    const projects = this.getProjects();
    const filtered = projects.filter(project => project.id !== id);
    this.saveProjects(filtered);
  }

  // General utilities
  static clearAll() {
    localStorage.removeItem(this.NOTES_KEY);
    localStorage.removeItem(this.TASKS_KEY);
    localStorage.removeItem(this.WIKIS_KEY);
    localStorage.removeItem(this.PROJECTS_KEY);
    this.init();
  }

  static getStorageSize(): number {
    const notes = localStorage.getItem(this.NOTES_KEY) || '';
    const tasks = localStorage.getItem(this.TASKS_KEY) || '';
    const wikis = localStorage.getItem(this.WIKIS_KEY) || '';
    const projects = localStorage.getItem(this.PROJECTS_KEY) || '';
    return new Blob([notes + tasks + wikis + projects]).size;
  }
}
