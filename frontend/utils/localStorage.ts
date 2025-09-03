import type { Note } from '~backend/workspace/notes/create';
import type { Task } from '~backend/workspace/tasks/create';
import type { Wiki } from '~backend/workspace/wikis/create';
import type { Project } from '~backend/workspace/projects/create';
import type { Email } from '~backend/workspace/emails/list';
import type { Document } from '~backend/workspace/documents/list';
import type { Reminder } from '~backend/reminders/create';

interface Form {
  id: string;
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
  }>;
  submitAction: string;
  submissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "multi_select";
  options?: string[];
  entityType: "task" | "project" | "note";
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    conditions: Record<string, any>;
  };
  action: {
    type: string;
    parameters: Record<string, any>;
  };
  isActive: boolean;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class LocalStorageManager {
  private static readonly NOTES_KEY = 'tasknetworkspace_notes';
  private static readonly TASKS_KEY = 'tasknetworkspace_tasks';
  private static readonly WIKIS_KEY = 'tasknetworkspace_wikis';
  private static readonly PROJECTS_KEY = 'tasknetworkspace_projects';
  private static readonly EMAILS_KEY = 'tasknetworkspace_emails';
  private static readonly DOCUMENTS_KEY = 'tasknetworkspace_documents';
  private static readonly FORMS_KEY = 'tasknetworkspace_forms';
  private static readonly CUSTOM_FIELDS_KEY = 'tasknetworkspace_custom_fields';
  private static readonly AUTOMATIONS_KEY = 'tasknetworkspace_automations';
  private static readonly REMINDERS_KEY = 'tasknetworkspace_reminders';

  static init() {
    const keys = [this.NOTES_KEY, this.TASKS_KEY, this.WIKIS_KEY, this.PROJECTS_KEY, this.EMAILS_KEY, this.DOCUMENTS_KEY, this.FORMS_KEY, this.CUSTOM_FIELDS_KEY, this.AUTOMATIONS_KEY, this.REMINDERS_KEY];
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
    
    // Initialize with sample data if empty
    this.initializeSampleData();
  }

  private static initializeSampleData() {
    const hasData = this.getNotes().length > 0 || this.getTasks().length > 0 || this.getProjects().length > 0;
    
    if (!hasData) {
      // Add sample projects first
      const sampleProjects = [
        {
          id: crypto.randomUUID(),
          name: "TaskNet Onboarding",
          description: "Getting familiar with TaskNet workspace and its features",
          status: "active" as const,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: "Personal Productivity System",
          description: "Setting up and maintaining a personal productivity workflow",
          status: "active" as const,
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: "Q4 Planning",
          description: "Strategic planning and goal setting for Q4",
          status: "completed" as const,
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Team Collaboration Tools",
          description: "Evaluating and implementing new collaboration tools for the team",
          status: "paused" as const,
          startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        }
      ];
      this.saveProjects(sampleProjects);

      // Add comprehensive sample tasks with various dates and priorities
      const sampleTasks = [
        // Urgent tasks due today/soon
        {
          id: crypto.randomUUID(),
          title: "Review quarterly budget report",
          description: "Analyze Q3 spending and prepare recommendations for Q4 budget adjustments",
          tags: ["finance", "quarterly", "urgent"],
          status: "todo" as const,
          priority: "high" as const,
          dueDate: new Date(), // Due today
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Prepare presentation for client meeting",
          description: "Create slides for tomorrow's client presentation including project timeline and deliverables",
          tags: ["presentation", "client", "meeting"],
          status: "in-progress" as const,
          priority: "high" as const,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Due tomorrow
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Submit expense reports",
          description: "Compile and submit all expense reports for the past month",
          tags: ["expenses", "finance", "monthly"],
          status: "todo" as const,
          priority: "medium" as const,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        
        // This week tasks
        {
          id: crypto.randomUUID(),
          title: "Explore TaskNet features",
          description: "Take a comprehensive tour of all available features in TaskNet workspace including time tracking, wikis, and automations",
          tags: ["onboarding", "features"],
          status: "in-progress" as const,
          priority: "medium" as const,
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Due in 4 days
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Update team wiki documentation",
          description: "Add new processes and update existing documentation in the team wiki",
          tags: ["documentation", "wiki", "team"],
          status: "todo" as const,
          priority: "medium" as const,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Schedule one-on-one meetings",
          description: "Set up quarterly one-on-one meetings with all team members",
          tags: ["meetings", "team", "quarterly"],
          status: "todo" as const,
          priority: "low" as const,
          dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Due in 6 days
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },

        // Next week tasks
        {
          id: crypto.randomUUID(),
          title: "Create your first project",
          description: "Set up a project to organize related tasks and documents effectively",
          tags: ["setup", "project"],
          status: "todo" as const,
          priority: "high" as const,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Due in 10 days
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Research competitive analysis",
          description: "Conduct thorough research on competitor products and market positioning",
          tags: ["research", "competitive", "analysis"],
          status: "todo" as const,
          priority: "medium" as const,
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // Due in 12 days
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Plan team building event",
          description: "Organize and plan the quarterly team building event including venue, activities, and catering",
          tags: ["team", "event", "planning"],
          status: "todo" as const,
          priority: "low" as const,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 2 weeks
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },

        // Completed tasks
        {
          id: crypto.randomUUID(),
          title: "Set up development environment",
          description: "Install and configure all necessary development tools and dependencies",
          tags: ["development", "setup", "tools"],
          status: "done" as const,
          priority: "high" as const,
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Was due yesterday
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Complete onboarding checklist",
          description: "Finish all items on the new employee onboarding checklist",
          tags: ["onboarding", "checklist", "hr"],
          status: "done" as const,
          priority: "medium" as const,
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Was due 3 days ago
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Review and approve design mockups",
          description: "Review the latest design mockups and provide feedback to the design team",
          tags: ["design", "review", "approval"],
          status: "done" as const,
          priority: "medium" as const,
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Was due a week ago
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },

        // Long-term tasks
        {
          id: crypto.randomUUID(),
          title: "Develop Q1 marketing strategy",
          description: "Create comprehensive marketing strategy for Q1 including campaigns, budget allocation, and success metrics",
          tags: ["marketing", "strategy", "quarterly"],
          status: "todo" as const,
          priority: "medium" as const,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in a month
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Annual performance review preparation",
          description: "Prepare materials and documentation for annual performance reviews",
          tags: ["hr", "performance", "annual"],
          status: "todo" as const,
          priority: "low" as const,
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Due in 45 days
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },

        // Overdue tasks
        {
          id: crypto.randomUUID(),
          title: "Update security certificates",
          description: "Renew and update all security certificates before they expire",
          tags: ["security", "certificates", "maintenance"],
          status: "todo" as const,
          priority: "high" as const,
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue by 2 days
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Archive old project files",
          description: "Clean up and archive files from completed projects to free up storage space",
          tags: ["cleanup", "archive", "maintenance"],
          status: "todo" as const,
          priority: "low" as const,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue by 5 days
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        }
      ];
      this.saveTasks(sampleTasks);

      // Add sample notes with rich content
      const sampleNotes = [
        {
          id: crypto.randomUUID(),
          title: "Welcome to TaskNet",
          content: "# Welcome to TaskNet Workspace\n\nThis is your personal productivity workspace. You can:\n\n- Create and organize notes with **Markdown** support\n- Manage tasks and projects with priorities and due dates\n- Build a knowledge base with interconnected wikis\n- Track time and monitor goals\n- Automate workflows and processes\n- Search across all content types\n\n## Getting Started\n\n1. Explore the **Dashboard** for an overview of your work\n2. Check out the **Tasks** section to see your todo list\n3. Visit **Projects** to organize your work\n4. Use **Notes** for capturing thoughts and information\n5. Build your knowledge base with **Wikis**\n\n## Tips\n\n- Use the **Quick Capture** button (+ icon) for fast content creation\n- Try the **Kanban** view for visual task management\n- Use `markdown` formatting in notes and wikis\n- Set up **automations** to streamline your workflow\n- Export your data anytime for backup\n\nStart by exploring the different sections or creating your first note!",
          tags: ["welcome", "getting-started", "productivity"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Markdown Support",
          content: "# Markdown Support in TaskNet\n\nTaskNet supports **rich Markdown** formatting throughout the application!\n\n## Text Formatting\n\n- **Bold text** with double asterisks\n- *Italic text* with single asterisks\n- `Inline code` with backticks\n- ~~Strikethrough~~ with double tildes\n\n## Headers\n\n# H1 Header\n## H2 Header\n### H3 Header\n\n## Lists\n\n### Unordered Lists\n- First item\n- Second item\n  - Nested item\n  - Another nested item\n- Third item\n\n### Ordered Lists\n1. First step\n2. Second step\n3. Third step\n\n## Code Blocks\n\n```javascript\nfunction greetUser(name) {\n  return `Hello, ${name}! Welcome to TaskNet.`;\n}\n\nconsole.log(greetUser('User'));\n```\n\n```python\ndef calculate_productivity_score(tasks_completed, time_spent):\n    return (tasks_completed / time_spent) * 100\n\nscore = calculate_productivity_score(5, 8)\nprint(f'Productivity score: {score}%')\n```\n\n## Links and References\n\n- [TaskNet Documentation](https://docs.tasknet.app)\n- [Markdown Guide](https://www.markdownguide.org)\n\nTry creating a note with Markdown to see it in action!",
          tags: ["documentation", "markdown", "formatting"],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Meeting Notes - Q4 Planning Session",
          content: "# Q4 Planning Session\n\n**Date:** October 15, 2024\n**Attendees:** Sarah, Mike, Jennifer, Alex\n**Duration:** 2 hours\n\n## Agenda Items\n\n### 1. Q3 Review\n- Successfully completed 85% of planned initiatives\n- Revenue target exceeded by 12%\n- Customer satisfaction score: 4.6/5.0\n\n### 2. Q4 Objectives\n\n#### Primary Goals\n1. **Product Launch** - New feature set release\n2. **Market Expansion** - Enter European market\n3. **Team Growth** - Hire 5 new team members\n4. **Customer Retention** - Achieve 95% retention rate\n\n#### Key Performance Indicators\n- Monthly recurring revenue (MRR) growth: +20%\n- Customer acquisition cost (CAC) reduction: -15%\n- Net promoter score (NPS): >70\n\n### 3. Resource Allocation\n\n| Department | Budget | Headcount |\n|------------|--------|-----------|\n| Engineering | $500K | +3 |\n| Marketing | $200K | +1 |\n| Sales | $150K | +1 |\n\n### 4. Action Items\n\n- [ ] **Sarah**: Finalize product roadmap by Oct 20\n- [ ] **Mike**: Prepare market entry strategy by Oct 25\n- [ ] **Jennifer**: Draft job descriptions for new positions\n- [ ] **Alex**: Set up performance tracking dashboard\n\n### 5. Next Steps\n\n1. Weekly check-ins every Tuesday at 10 AM\n2. Monthly progress reviews\n3. Quarterly board presentation in December\n\n## Notes\n\n- Consider implementing OKRs (Objectives and Key Results) framework\n- Need to evaluate current project management tools\n- Plan team retreat for January 2025",
          tags: ["meeting", "planning", "quarterly", "q4"],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Productivity Tips and Tricks",
          content: "# Productivity Tips and Tricks\n\n## Time Management\n\n### The Pomodoro Technique\n1. Work for 25 minutes focused on a single task\n2. Take a 5-minute break\n3. Repeat for 4 cycles\n4. Take a longer 15-30 minute break\n\n### Time Blocking\n- **9:00-10:30 AM**: Deep work (most important task)\n- **10:30-11:00 AM**: Email and communication\n- **11:00-12:30 PM**: Meetings and collaboration\n- **1:30-3:00 PM**: Creative work\n- **3:00-4:00 PM**: Administrative tasks\n- **4:00-5:00 PM**: Planning for next day\n\n## Task Prioritization\n\n### The Eisenhower Matrix\n\n| Urgent | Not Urgent |\n|--------|------------|\n| **Important**: Do First | **Important**: Schedule |\n| **Not Important**: Delegate | **Not Important**: Eliminate |\n\n### Getting Things Done (GTD)\n1. **Capture** everything in a trusted system\n2. **Clarify** what each item means\n3. **Organize** by context and priority\n4. **Reflect** through regular reviews\n5. **Engage** with confidence\n\n## Digital Organization\n\n### File Naming Convention\n```\nYYYY-MM-DD_Category_Description\n2024-10-15_Meeting_Q4-Planning\n2024-10-16_Report_Financial-Summary\n```\n\n### Email Management\n- **Inbox Zero**: Process all emails daily\n- **2-minute rule**: If it takes less than 2 minutes, do it now\n- **Folders**: Action required, Waiting for, Reference\n\n## Focus Techniques\n\n### Deep Work Strategies\n- **Monastic**: Eliminate all distractions for extended periods\n- **Bimodal**: Alternate between deep work and collaboration\n- **Rhythmic**: Set consistent daily deep work schedule\n- **Journalistic**: Switch into deep work mode whenever possible\n\n### Environment Optimization\n- Use noise-cancelling headphones\n- Keep phone in another room\n- Use website blockers during focus time\n- Maintain a clean, organized workspace\n\n## Review and Reflection\n\n### Daily Review (5 minutes)\n- What did I accomplish today?\n- What challenges did I face?\n- What are tomorrow's priorities?\n\n### Weekly Review (30 minutes)\n- Review completed tasks and projects\n- Assess progress toward goals\n- Plan upcoming week\n- Identify areas for improvement\n\n### Monthly Review (1 hour)\n- Analyze productivity patterns\n- Adjust systems and processes\n- Set goals for next month\n- Celebrate achievements",
          tags: ["productivity", "tips", "time-management", "focus"],
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Project Ideas and Brainstorming",
          content: "# Project Ideas and Brainstorming\n\n## Product Development Ideas\n\n### Mobile App Enhancement\n- **Voice Notes Integration**: Allow users to record voice memos that automatically convert to text\n- **Offline Sync**: Robust offline functionality with smart sync when online\n- **Smart Notifications**: AI-powered notification timing based on user behavior\n- **Collaborative Workspaces**: Real-time collaboration features\n\n### New Feature Concepts\n- **Habit Tracking**: Daily habit monitoring with streak tracking\n- **Mind Mapping**: Visual brainstorming and idea organization\n- **Template Library**: Pre-built templates for common workflows\n- **Integration Hub**: Connect with popular tools (Slack, GitHub, etc.)\n\n## Business Opportunities\n\n### Market Segments\n1. **Small Teams (2-10 people)**\n   - Focus on simplicity and ease of use\n   - Affordable pricing tiers\n   - Quick setup and onboarding\n\n2. **Enterprise (100+ employees)**\n   - Advanced security features\n   - SSO integration\n   - Custom branding options\n   - Dedicated support\n\n3. **Education Sector**\n   - Student-friendly interface\n   - Assignment tracking\n   - Grade book integration\n   - Bulk user management\n\n### Revenue Streams\n- **Freemium Model**: Basic features free, premium features paid\n- **Subscription Tiers**: Individual, Team, Enterprise\n- **Marketplace**: Third-party integrations and plugins\n- **Professional Services**: Custom implementations and training\n\n## Technical Improvements\n\n### Performance Optimization\n- **Database Indexing**: Optimize search performance\n- **Caching Strategy**: Implement Redis for frequently accessed data\n- **CDN Integration**: Faster asset delivery worldwide\n- **Bundle Optimization**: Reduce JavaScript bundle sizes\n\n### Security Enhancements\n- **End-to-End Encryption**: Protect user data in transit and at rest\n- **Two-Factor Authentication**: Additional security layer\n- **Audit Logging**: Track all user actions for compliance\n- **GDPR Compliance**: Ensure data protection regulations\n\n## User Experience Ideas\n\n### Accessibility\n- **Keyboard Navigation**: Full keyboard support for power users\n- **Screen Reader Support**: Proper ARIA labels and descriptions\n- **High Contrast Mode**: Better visibility for visually impaired users\n- **Font Size Controls**: Adjustable text size preferences\n\n### Personalization\n- **Custom Themes**: User-created color schemes\n- **Layout Options**: Flexible workspace arrangements\n- **Widget Dashboard**: Customizable information widgets\n- **Shortcut Keys**: User-defined keyboard shortcuts\n\n## Innovation Areas\n\n### AI Integration\n- **Smart Scheduling**: AI-powered optimal meeting times\n- **Content Suggestions**: Automated task and note recommendations\n- **Predictive Analytics**: Forecast project completion times\n- **Natural Language Processing**: Better search and categorization\n\n### Emerging Technologies\n- **Voice Interface**: Hands-free task management\n- **AR/VR Support**: Immersive workspace experiences\n- **Blockchain**: Decentralized data storage options\n- **IoT Integration**: Connect with smart home/office devices\n\n## Next Steps\n\n1. **User Research**: Survey current users for feature priorities\n2. **Prototype Development**: Create MVPs for top 3 ideas\n3. **Market Analysis**: Research competitor offerings\n4. **Technical Feasibility**: Assess development complexity\n5. **Business Case**: Calculate potential ROI for each idea",
          tags: ["ideas", "brainstorming", "product", "innovation"],
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        }
      ];
      this.saveNotes(sampleNotes);

      // Add sample emails with variety
      const sampleEmails = [
        {
          id: crypto.randomUUID(),
          sender: "welcome@tasknet.app",
          recipient: "you@example.com",
          subject: "Welcome to TaskNet!",
          body: "Welcome to TaskNet! We're excited to have you on board. This workspace will help you stay organized and productive.\n\nHere are some quick tips to get started:\n\n1. Create your first task or note using the Quick Capture button\n2. Explore the different views (Grid, List, Kanban)\n3. Set up your first project to organize related work\n4. Try the search functionality to find content quickly\n5. Check out the wiki section for building your knowledge base\n\nIf you have any questions, feel free to reach out to our support team. We're here to help you make the most of TaskNet!\n\nBest regards,\nThe TaskNet Team",
          isRead: false,
          receivedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          sender: "notifications@tasknet.app",
          recipient: "you@example.com",
          subject: "Daily Digest - 3 tasks due today",
          body: "Good morning! Here's your daily digest:\n\n📅 TASKS DUE TODAY:\n• Review quarterly budget report (High priority)\n• Update team wiki documentation\n• Submit expense reports\n\n⏰ UPCOMING THIS WEEK:\n• Prepare presentation for client meeting (Due tomorrow)\n• Schedule one-on-one meetings (Due in 6 days)\n\n✅ RECENTLY COMPLETED:\n• Set up development environment\n• Complete onboarding checklist\n\nYou're making great progress! Keep up the good work.\n\nBest,\nTaskNet Notifications",
          isRead: true,
          receivedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
        {
          id: crypto.randomUUID(),
          sender: "team@acmecorp.com",
          recipient: "you@example.com",
          subject: "Q4 Planning Meeting - Action Items",
          body: "Hi team,\n\nThanks for a productive Q4 planning session yesterday. Here are the key action items we discussed:\n\n🎯 IMMEDIATE ACTIONS (This Week):\n• Sarah: Finalize product roadmap by Oct 20\n• Mike: Prepare market entry strategy by Oct 25\n• Jennifer: Draft job descriptions for new positions\n• Alex: Set up performance tracking dashboard\n\n📊 Q4 OBJECTIVES:\n1. Product Launch - New feature set release\n2. Market Expansion - Enter European market\n3. Team Growth - Hire 5 new team members\n4. Customer Retention - Achieve 95% retention rate\n\n📅 NEXT MEETINGS:\n• Weekly check-ins: Every Tuesday at 10 AM\n• Monthly progress review: First Monday of each month\n• Board presentation: December 15th\n\nLet me know if you have any questions about your assigned tasks.\n\nBest,\nSarah Johnson\nProject Manager",
          isRead: true,
          receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: crypto.randomUUID(),
          sender: "security@company.com",
          recipient: "you@example.com",
          subject: "🔒 Security Certificate Renewal Required",
          body: "URGENT: Security Certificate Renewal Required\n\nDear System Administrator,\n\nThis is an automated reminder that the following security certificates are expiring soon:\n\n⚠️ CERTIFICATES EXPIRING:\n• SSL Certificate (*.company.com) - Expires: October 13, 2024\n• Code Signing Certificate - Expires: October 15, 2024\n• API Gateway Certificate - Expires: October 18, 2024\n\n📋 ACTION REQUIRED:\n1. Download new certificates from the certificate authority\n2. Update server configurations\n3. Test all affected services\n4. Update monitoring systems\n\n⏰ DEADLINE: These certificates must be renewed within 48 hours to avoid service disruptions.\n\nIf you need assistance with the renewal process, please contact the IT security team immediately.\n\nRegards,\nIT Security Team\nsecurity@company.com",
          isRead: false,
          receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          id: crypto.randomUUID(),
          sender: "client@bigcompany.com",
          recipient: "you@example.com",
          subject: "Feedback on Latest Proposal",
          body: "Hello,\n\nThank you for the comprehensive proposal you sent last week. Our team has reviewed it thoroughly, and we're impressed with the approach you've outlined.\n\n✅ WHAT WE LIKED:\n• Clear timeline and milestones\n• Detailed technical specifications\n• Competitive pricing structure\n• Strong team credentials\n\n📝 QUESTIONS/CONCERNS:\n• Can the delivery timeline be accelerated by 2 weeks?\n• What's the backup plan if key team members become unavailable?\n• Are there any additional costs we should be aware of?\n• Can you provide references from similar projects?\n\n📅 NEXT STEPS:\nWe'd like to schedule a meeting to discuss these points in detail. Are you available for a call this Thursday at 2 PM EST?\n\nLooking forward to moving forward with this project.\n\nBest regards,\nMichael Chen\nCTO, BigCompany Inc.\nmichael.chen@bigcompany.com",
          isRead: true,
          receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
        {
          id: crypto.randomUUID(),
          sender: "hr@company.com",
          recipient: "you@example.com",
          subject: "Reminder: Annual Performance Review Due",
          body: "Annual Performance Review Reminder\n\nDear Team Member,\n\nThis is a friendly reminder that your annual performance review is due in 30 days.\n\n📋 WHAT YOU NEED TO PREPARE:\n• Self-assessment form (due in 2 weeks)\n• Goal achievement summary\n• Professional development plan for next year\n• 360-degree feedback forms (if applicable)\n\n📅 IMPORTANT DATES:\n• Self-assessment deadline: November 1, 2024\n• Manager review meeting: November 8, 2024\n• Final review submission: November 15, 2024\n\n💡 TIPS FOR SUCCESS:\n• Review your goals from the beginning of the year\n• Gather examples of your key accomplishments\n• Think about areas where you'd like to grow\n• Prepare questions about career development\n\n🔗 RESOURCES:\n• Performance review guide: [Internal Link]\n• Self-assessment template: [Internal Link]\n• Goal setting worksheet: [Internal Link]\n\nIf you have any questions about the review process, please don't hesitate to reach out to HR or your manager.\n\nBest regards,\nHuman Resources Team",
          isRead: false,
          receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        }
      ];
      this.saveEmails(sampleEmails);

      // Add sample wiki pages with hierarchical structure
      const sampleWikis = [
        {
          id: crypto.randomUUID(),
          title: "TaskNet User Guide",
          content: "# TaskNet User Guide\n\nWelcome to the comprehensive TaskNet User Guide. This wiki serves as your complete reference for using TaskNet effectively.\n\n## Table of Contents\n\n1. [[Getting Started]]\n2. [[Core Features]]\n3. [[Advanced Features]]\n4. [[Tips and Tricks]]\n5. [[Troubleshooting]]\n6. [[Best Practices]]\n\n## Overview\n\nTaskNet is a comprehensive workspace for managing your productivity. Whether you're an individual contributor or part of a team, TaskNet provides the tools you need to stay organized and efficient.\n\n### Key Benefits\n\n- **Unified Workspace**: All your tasks, notes, projects, and documents in one place\n- **Flexible Views**: Grid, list, kanban, and calendar views for different work styles\n- **Rich Content**: Markdown support for formatted text and documentation\n- **Powerful Search**: Find anything across all your content types\n- **Offline Capable**: Work without internet and sync when connected\n- **Extensible**: Automations, custom fields, and integrations\n\n### Getting Started Quickly\n\n1. **Create your first task** using the Quick Capture button (+)\n2. **Organize work** by setting up projects\n3. **Capture knowledge** in notes and wikis\n4. **Track time** on important activities\n5. **Set goals** to measure progress\n\n## System Requirements\n\n### Supported Browsers\n- Chrome 90+\n- Firefox 88+\n- Safari 14+\n- Edge 90+\n\n### Mobile Support\n- iOS Safari 14+\n- Chrome Mobile 90+\n- Samsung Internet 14+\n\n## Quick Reference\n\n### Keyboard Shortcuts\n\n| Action | Shortcut |\n|--------|----------|\n| Quick Capture | `Ctrl/Cmd + K` |\n| Global Search | `Ctrl/Cmd + /` |\n| New Task | `Ctrl/Cmd + T` |\n| New Note | `Ctrl/Cmd + N` |\n| Toggle Sidebar | `Ctrl/Cmd + B` |\n\n### Markdown Quick Reference\n\n| Element | Syntax |\n|---------|--------|\n| Header | `# H1`, `## H2`, `### H3` |\n| Bold | `**bold text**` |\n| Italic | `*italic text*` |\n| Code | `` `code` `` |\n| Link | `[text](url)` |\n| List | `- item` or `1. item` |\n\nFor more detailed information, explore the specific sections of this guide using the links above.",
          tags: ["documentation", "guide", "help"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Getting Started",
          content: "# Getting Started with TaskNet\n\nThis guide will help you get up and running with TaskNet in just a few minutes.\n\n## Your First Steps\n\n### 1. Familiarize Yourself with the Interface\n\n**Header Navigation**\n- **Dashboard**: Overview of your work and recent activity\n- **Tasks**: Manage your todo list and assignments\n- **Projects**: Organize related work into projects\n- **Notes**: Capture thoughts, ideas, and information\n- **Search**: Find content across all sections\n\n**Secondary Navigation**\n- **Collaboration**: Email, calendar, and documents\n- **Product**: Sprints, goals, and portfolios\n- **Workspace**: Wikis, activity feed, time tracking, kanban\n\n### 2. Create Your First Content\n\n**Quick Capture Method**\n1. Click the **+** button in the bottom-right corner\n2. Choose what type of content to create\n3. Fill in the details and save\n\n**Direct Creation**\n1. Navigate to the appropriate section (Tasks, Notes, etc.)\n2. Click the \"New [Type]\" button\n3. Complete the form and save\n\n### 3. Understanding Content Types\n\n#### Tasks\n- **Purpose**: Track work that needs to be done\n- **Key Features**: Due dates, priorities, status tracking\n- **Best For**: Action items, assignments, reminders\n\n#### Notes\n- **Purpose**: Capture information and thoughts\n- **Key Features**: Markdown formatting, tags, search\n- **Best For**: Meeting notes, ideas, documentation\n\n#### Projects\n- **Purpose**: Organize related work\n- **Key Features**: Status tracking, date ranges, descriptions\n- **Best For**: Large initiatives, campaigns, objectives\n\n#### Wikis\n- **Purpose**: Build knowledge base\n- **Key Features**: Hierarchical organization, cross-references\n- **Best For**: Documentation, processes, reference materials\n\n### 4. Organize Your Content\n\n**Using Tags**\n- Add tags to categorize content\n- Use consistent naming conventions\n- Examples: `#urgent`, `#meeting`, `#project-alpha`\n\n**Project Organization**\n- Create projects for major areas of work\n- Link related tasks and notes to projects\n- Use project status to track progress\n\n**Folder Structure (Wikis)**\n- Create parent-child relationships\n- Build logical hierarchies\n- Example: Company Handbook > HR Policies > Vacation Policy\n\n### 5. Customize Your Workflow\n\n**Views and Layouts**\n- Try different views (Grid, List, Kanban)\n- Adjust according to your work style\n- Switch between views as needed\n\n**Filters and Sorting**\n- Use filters to focus on relevant content\n- Sort by priority, due date, or creation time\n- Save common filter combinations\n\n**Offline Mode**\n- Toggle offline mode when working without internet\n- Changes sync automatically when back online\n- Use for travel or unreliable connections\n\n## Common First-Day Tasks\n\n### Set Up Your Workspace\n1. Create a \"Personal\" project for individual tasks\n2. Add your current todo items as tasks\n3. Create a \"Daily Notes\" note for ongoing thoughts\n4. Set up a \"Reference\" wiki for important information\n\n### Import Existing Content\n1. Go to Settings > Data Manager\n2. Use the import function for existing data\n3. Or manually create content from your current system\n\n### Explore Features\n1. Try the global search with different queries\n2. Experiment with markdown formatting in notes\n3. Test the Quick Capture feature\n4. Set up your first automation (if needed)\n\n## Getting Help\n\n- **User Guide**: This comprehensive wiki\n- **Tips and Tricks**: [[TaskNet Tips and Tricks]]\n- **Troubleshooting**: [[Common Issues and Solutions]]\n- **Best Practices**: [[Productivity Best Practices]]\n\nNext: [[Core Features]] →",
          tags: ["getting-started", "tutorial", "onboarding"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Core Features",
          content: "# Core Features\n\nTaskNet's core features form the foundation of your productivity workspace. This section covers the essential functionality you'll use daily.\n\n## Task Management\n\n### Creating Tasks\n\n**Quick Creation**\n- Use the Quick Capture button (+) for fast task entry\n- Specify title, description, priority, and due date\n- Add tags for easy categorization\n\n**Detailed Creation**\n- Access through Tasks section > New Task\n- Full form with all available options\n- Link to projects and add custom fields\n\n### Task Properties\n\n**Status Options**\n- **Todo**: Not yet started\n- **In Progress**: Currently working on\n- **Done**: Completed\n\n**Priority Levels**\n- **High**: Urgent and important\n- **Medium**: Important but not urgent\n- **Low**: Nice to have\n\n**Additional Fields**\n- Due dates with calendar picker\n- Tags for categorization\n- Descriptions with markdown support\n- Project assignment\n- Custom fields (if configured)\n\n### Task Views\n\n**List View**\n- Clean, compact display of all tasks\n- Quick status changes with checkboxes\n- Inline editing capabilities\n- Sorting and filtering options\n\n**Grid View**\n- Card-based layout with more detail\n- Visual priority and status indicators\n- Better for browsing and overview\n\n**Kanban Board**\n- Visual workflow management\n- Drag-and-drop status changes\n- Columns for Todo, In Progress, Done\n- Great for process visualization\n\n## Note Taking\n\n### Rich Text Support\n\n**Markdown Formatting**\n```markdown\n# Headers for organization\n**Bold** and *italic* text\n- Bulleted lists\n1. Numbered lists\n[Links](https://example.com)\n`Code snippets`\n\n> Blockquotes for important information\n```\n\n**Live Preview**\n- Real-time rendering of markdown\n- WYSIWYG-style editing experience\n- Switch between edit and preview modes\n\n### Note Organization\n\n**Tagging System**\n- Add multiple tags per note\n- Filter notes by tags\n- Tag suggestions based on existing tags\n\n**Search Functionality**\n- Full-text search across all notes\n- Search in titles and content\n- Instant results as you type\n\n**Cross-References**\n- Link between notes using `[[Note Title]]` syntax\n- Automatic backlink tracking\n- Build connected knowledge graphs\n\n## Project Management\n\n### Project Structure\n\n**Basic Information**\n- Name and description\n- Start and end dates\n- Current status tracking\n\n**Status Options**\n- **Active**: Currently in progress\n- **Paused**: Temporarily on hold\n- **Completed**: Successfully finished\n- **Archived**: No longer active but preserved\n\n### Project Views\n\n**Overview Cards**\n- High-level project information\n- Progress indicators and status\n- Quick action buttons\n\n**Detailed View**\n- Complete project information\n- Related tasks and notes\n- Timeline and milestones\n\n### Task Association\n- Link tasks to projects\n- Filter tasks by project\n- Track project completion progress\n\n## Wiki System\n\n### Hierarchical Organization\n\n**Parent-Child Relationships**\n- Create nested wiki structures\n- Build logical information hierarchies\n- Easy navigation between related pages\n\n**Tree Navigation**\n- Expandable/collapsible sidebar\n- Visual indication of page relationships\n- Quick access to any page in the hierarchy\n\n### Content Management\n\n**Rich Editing**\n- Full markdown support\n- Syntax highlighting for code blocks\n- Image and media embedding\n\n**Cross-Linking**\n- Reference other wiki pages\n- Automatic link suggestions\n- Maintain consistency across documentation\n\n### Knowledge Base Features\n\n**Version History**\n- Track changes over time\n- Restore previous versions\n- See who made what changes\n\n**Templates**\n- Standardized page layouts\n- Consistent documentation structure\n- Quick page creation\n\n## Search and Discovery\n\n### Global Search\n\n**Unified Search Bar**\n- Search across all content types\n- Instant results and suggestions\n- Keyboard shortcut access (Ctrl/Cmd + /)\n\n**Search Filters**\n- Filter by content type (tasks, notes, etc.)\n- Date range filtering\n- Tag-based filtering\n- Status and priority filters\n\n### Advanced Search\n\n**Search Operators**\n- Exact phrase matching with quotes\n- Exclude terms with minus sign\n- Tag-specific searches\n- Field-specific searches\n\n**Search Results**\n- Relevant excerpts with highlighting\n- Context around matching terms\n- Direct links to source content\n- Sorting by relevance or date\n\n## Data Management\n\n### Sync and Storage\n\n**Online Mode**\n- Real-time synchronization\n- Cloud backup and storage\n- Multi-device access\n\n**Offline Mode**\n- Local storage for offline work\n- Automatic sync when reconnected\n- Conflict resolution for simultaneous edits\n\n### Import/Export\n\n**Export Options**\n- JSON format for data portability\n- Selective export by content type\n- Complete workspace backup\n\n**Import Capabilities**\n- Restore from backup files\n- Merge with existing content\n- Bulk import from other systems\n\nNext: [[Advanced Features]] →",
          tags: ["features", "documentation", "core"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          title: "Productivity Best Practices",
          content: "# Productivity Best Practices\n\nMaximize your efficiency with TaskNet by following these proven productivity strategies and best practices.\n\n## Task Management Best Practices\n\n### The Getting Things Done (GTD) Method\n\n**1. Capture Everything**\n- Use Quick Capture for immediate task entry\n- Don't let tasks live in your head\n- Capture ideas as soon as they occur\n- Review and process captures regularly\n\n**2. Clarify and Process**\n- Ask: \"What is the next action?\"\n- If it takes less than 2 minutes, do it now\n- If it requires multiple steps, create a project\n- Delegate when appropriate\n\n**3. Organize by Context**\n- Use tags for contexts: `@calls`, `@computer`, `@errands`\n- Group similar actions together\n- Consider energy levels and available time\n\n**4. Review Regularly**\n- Daily: Check today's tasks and urgent items\n- Weekly: Review all projects and upcoming deadlines\n- Monthly: Assess progress and adjust priorities\n\n### Priority Management\n\n**The Eisenhower Matrix**\n\n| | Urgent | Not Urgent |\n|---|---|---|\n| **Important** | Do First (High Priority) | Schedule (Medium Priority) |\n| **Not Important** | Delegate | Eliminate (Low Priority) |\n\n**Implementation in TaskNet**\n- Use High priority for Urgent + Important\n- Use Medium priority for Important but Not Urgent\n- Use Low priority for everything else\n- Regular review to ensure proper categorization\n\n### Time-Boxing\n\n**Assign Time Estimates**\n- Estimate time required for each task\n- Use task descriptions to note estimates\n- Track actual time spent for future reference\n\n**Block Calendar Time**\n- Schedule focused work blocks\n- Protect deep work time\n- Include buffer time for unexpected tasks\n\n## Project Organization\n\n### Project Structure\n\n**Clear Naming Conventions**\n- Use descriptive, searchable names\n- Include dates or versions when relevant\n- Examples: \"Q4 Marketing Campaign\", \"Website Redesign v2\"\n\n**Project Hierarchy**\n- Break large projects into smaller sub-projects\n- Use consistent naming patterns\n- Maintain clear parent-child relationships\n\n### Task Breakdown\n\n**Work Breakdown Structure (WBS)**\n- Decompose large projects into manageable tasks\n- Each task should be completable in one session\n- Use action verbs for task titles\n\n**Dependencies**\n- Identify prerequisite tasks\n- Note dependencies in task descriptions\n- Plan sequential vs. parallel work\n\n## Note-Taking Excellence\n\n### The Cornell Note-Taking System\n\n**Structure Your Notes**\n```markdown\n# Meeting Title - Date\n\n## Key Points\n- Main topics discussed\n- Important decisions made\n- Action items identified\n\n## Details\n[Detailed notes and discussion points]\n\n## Summary\n[Key takeaways and next steps]\n```\n\n### Progressive Summarization\n\n**Layer 1: Original Notes**\n- Capture everything during the meeting/session\n- Don't worry about formatting initially\n\n**Layer 2: Bold Key Points**\n- Review and highlight important information\n- Use **bold** for critical items\n\n**Layer 3: Highlighted Insights**\n- Mark breakthrough insights\n- Connect to other projects or knowledge\n\n## Knowledge Management\n\n### Building Your Second Brain (PARA Method)\n\n**P - Projects**\n- Things you're actively working on\n- Use TaskNet projects for these\n\n**A - Areas**\n- Ongoing responsibilities to maintain\n- Create wiki sections for each area\n\n**R - Resources**\n- Topics of ongoing interest\n- Build resource collections in wikis\n\n**A - Archive**\n- Inactive items from the other categories\n- Use project status changes and note tags\n\n### Zettelkasten (Slip-Box) Method\n\n**Atomic Notes**\n- One concept per note\n- Self-contained and understandable\n- Link-rich and interconnected\n\n**Linking Strategy**\n- Use `[[WikiLinks]]` extensively\n- Create index notes for major topics\n- Build concept maps through linking\n\n## Daily Workflows\n\n### Morning Routine (10 minutes)\n\n1. **Review Today's Tasks**\n   - Check due dates and priorities\n   - Adjust schedule based on energy levels\n   - Identify the \"Most Important Task\" (MIT)\n\n2. **Quick Capture Review**\n   - Process any overnight captures\n   - Convert ideas into actionable tasks\n   - Clean up inbox items\n\n3. **Set Daily Intention**\n   - Choose 1-3 key accomplishments for the day\n   - Block time for focused work\n   - Prepare for known meetings/calls\n\n### End-of-Day Review (5 minutes)\n\n1. **Complete Task Updates**\n   - Mark finished tasks as done\n   - Update progress on ongoing work\n   - Capture any new tasks or ideas\n\n2. **Tomorrow's Preparation**\n   - Review tomorrow's calendar\n   - Identify potential MIT for tomorrow\n   - Set up any needed materials\n\n3. **Weekly Planning (Fridays)**\n   - Review completed vs. planned work\n   - Assess project progress\n   - Plan focus areas for next week\n\n## Team Collaboration\n\n### Shared Project Standards\n\n**Naming Conventions**\n- Agree on consistent project naming\n- Use standardized tag systems\n- Maintain shared terminology\n\n**Status Updates**\n- Regular project status reviews\n- Clear communication of blockers\n- Shared understanding of definitions\n\n### Documentation Standards\n\n**Meeting Notes Template**\n```markdown\n# [Meeting Type] - [Date]\n\n**Attendees:** [List]\n**Duration:** [Time]\n\n## Agenda\n1. [Item 1]\n2. [Item 2]\n\n## Discussion\n[Notes on discussion]\n\n## Decisions\n- [Decision 1]\n- [Decision 2]\n\n## Action Items\n- [ ] [Task] - [Owner] - [Due Date]\n- [ ] [Task] - [Owner] - [Due Date]\n\n## Next Steps\n[What happens next]\n```\n\n## Troubleshooting Common Issues\n\n### Overwhelm Management\n\n**Too Many Tasks**\n- Implement the \"Rule of 3\" - focus on 3 key tasks per day\n- Use the Eisenhower Matrix for prioritization\n- Consider delegating or eliminating low-priority items\n\n**Information Overload**\n- Set up regular review cycles\n- Use the \"2-minute rule\" for quick decisions\n- Create clear filing systems with tags\n\n### Procrastination Solutions\n\n**Task Resistance**\n- Break large tasks into smaller, specific actions\n- Identify and address underlying concerns\n- Use time-boxing (work for just 15 minutes)\n\n**Perfectionism**\n- Set \"good enough\" standards for different types of work\n- Use time limits to prevent over-optimization\n- Focus on progress over perfection\n\n## Continuous Improvement\n\n### Weekly Reviews\n\n**What to Review**\n- Completed vs. planned tasks\n- Time estimates vs. actual time\n- System effectiveness and pain points\n\n**Questions to Ask**\n- What worked well this week?\n- What could be improved?\n- Are my priorities aligned with my goals?\n- Is my system helping or hindering my work?\n\n### System Evolution\n\n**Regular Optimization**\n- Experiment with new approaches\n- Adapt based on changing needs\n- Keep what works, discard what doesn't\n\n**Stay Current**\n- Learn new productivity techniques\n- Adapt TaskNet features to support new methods\n- Share successful strategies with team members\n\nRemember: The best productivity system is the one you actually use consistently. Start simple, build habits, and gradually add complexity as needed.",
          tags: ["best-practices", "productivity", "gtd", "tips"],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        }
      ];
      this.saveWikis(sampleWikis);

      // Add sample documents metadata
      const sampleDocuments = [
        {
          id: crypto.randomUUID(),
          name: "Q4_Budget_Report.pdf",
          path: "documents/q4-budget-report.pdf",
          fileType: "application/pdf",
          size: 2048576, // 2MB
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Team_Photo_2024.jpg",
          path: "images/team-photo-2024.jpg",
          fileType: "image/jpeg",
          size: 5242880, // 5MB
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Project_Proposal_Draft.docx",
          path: "documents/project-proposal-draft.docx",
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          size: 1048576, // 1MB
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Marketing_Assets.zip",
          path: "archives/marketing-assets.zip",
          fileType: "application/zip",
          size: 15728640, // 15MB
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        }
      ];
      this.saveDocuments(sampleDocuments);

      // Add sample forms
      const sampleForms = [
        {
          id: crypto.randomUUID(),
          name: "Project Intake Form",
          description: "Collect initial project requirements and details",
          fields: [
            { name: "project_name", type: "text", label: "Project Name", required: true },
            { name: "description", type: "textarea", label: "Project Description", required: true },
            { name: "priority", type: "select", label: "Priority", required: true, options: ["Low", "Medium", "High"] },
            { name: "budget", type: "number", label: "Budget", required: false },
            { name: "start_date", type: "date", label: "Preferred Start Date", required: false },
            { name: "stakeholders", type: "text", label: "Key Stakeholders", required: false }
          ],
          submitAction: "create_project",
          submissionCount: 12,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Bug Report",
          description: "Report bugs and issues for quick resolution",
          fields: [
            { name: "title", type: "text", label: "Bug Title", required: true },
            { name: "description", type: "textarea", label: "Detailed Description", required: true },
            { name: "severity", type: "select", label: "Severity", required: true, options: ["Low", "Medium", "High", "Critical"] },
            { name: "browser", type: "text", label: "Browser/Device", required: false },
            { name: "steps", type: "textarea", label: "Steps to Reproduce", required: false },
            { name: "urgent", type: "checkbox", label: "Urgent Fix Needed", required: false }
          ],
          submitAction: "create_task",
          submissionCount: 23,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Employee Feedback",
          description: "Anonymous feedback collection for team improvement",
          fields: [
            { name: "department", type: "select", label: "Department", required: false, options: ["Engineering", "Marketing", "Sales", "HR", "Other"] },
            { name: "feedback_type", type: "select", label: "Feedback Type", required: true, options: ["Suggestion", "Concern", "Compliment", "General"] },
            { name: "feedback", type: "textarea", label: "Your Feedback", required: true },
            { name: "anonymous", type: "checkbox", label: "Submit Anonymously", required: false },
            { name: "follow_up", type: "checkbox", label: "Request Follow-up", required: false }
          ],
          submitAction: "store_response",
          submissionCount: 8,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        }
      ];
      this.saveForms(sampleForms);

      // Add sample custom fields
      const sampleCustomFields = [
        {
          id: crypto.randomUUID(),
          name: "Client",
          type: "text" as const,
          entityType: "task" as const,
          isRequired: false,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Estimated Hours",
          type: "number" as const,
          entityType: "task" as const,
          isRequired: false,
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Task Category",
          type: "select" as const,
          options: ["Development", "Design", "Marketing", "Research", "Administrative"],
          entityType: "task" as const,
          isRequired: false,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Project Budget",
          type: "number" as const,
          entityType: "project" as const,
          isRequired: false,
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Project Type",
          type: "select" as const,
          options: ["Internal", "Client Work", "Research", "Maintenance"],
          entityType: "project" as const,
          isRequired: true,
          createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Review Status",
          type: "select" as const,
          options: ["Draft", "Under Review", "Approved", "Published"],
          entityType: "note" as const,
          isRequired: false,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        }
      ];
      this.saveCustomFields(sampleCustomFields);

      // Add sample automations
      const sampleAutomations = [
        {
          id: crypto.randomUUID(),
          name: "High Priority Task Notification",
          description: "Send notification when a high priority task is created",
          trigger: { type: "task_created", conditions: { priority: "high" } },
          action: { type: "send_notification", parameters: { message: "High priority task created" } },
          isActive: true,
          executionCount: 15,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Overdue Task Reminder",
          description: "Remind about tasks that are overdue",
          trigger: { type: "due_date_approaching", conditions: { days_overdue: 1 } },
          action: { type: "send_notification", parameters: { message: "Task is overdue" } },
          isActive: true,
          executionCount: 8,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          name: "Project Completion Follow-up",
          description: "Create follow-up task when project is completed",
          trigger: { type: "project_status_change", conditions: { new_status: "completed" } },
          action: { type: "create_task", parameters: { title: "Project retrospective meeting", priority: "medium" } },
          isActive: false,
          executionCount: 3,
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        }
      ];
      this.saveAutomations(sampleAutomations);
    }
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

  // Forms management
  static getForms(): Form[] {
    return this.getItems<Form>(this.FORMS_KEY).map(form => ({
      ...form,
      createdAt: new Date(form.createdAt),
      updatedAt: new Date(form.updatedAt),
    }));
  }
  static saveForms = (forms: Form[]) => this.saveItems(this.FORMS_KEY, forms);
  static createForm(data: Omit<Form, 'id' | 'createdAt' | 'updatedAt' | 'submissionCount'>): Form {
    const forms = this.getForms();
    const form: Form = { ...data, id: crypto.randomUUID(), submissionCount: 0, createdAt: new Date(), updatedAt: new Date() };
    forms.unshift(form);
    this.saveForms(forms);
    return form;
  }
  static deleteForm = (id: string) => this.saveForms(this.getForms().filter(f => f.id !== id));

  // Custom Fields management
  static getCustomFields(): CustomField[] {
    return this.getItems<CustomField>(this.CUSTOM_FIELDS_KEY).map(field => ({
      ...field,
      createdAt: new Date(field.createdAt),
      updatedAt: new Date(field.updatedAt),
    }));
  }
  static saveCustomFields = (fields: CustomField[]) => this.saveItems(this.CUSTOM_FIELDS_KEY, fields);
  static createCustomField(data: Omit<CustomField, 'id' | 'createdAt' | 'updatedAt'>): CustomField {
    const fields = this.getCustomFields();
    const field: CustomField = { ...data, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    fields.unshift(field);
    this.saveCustomFields(fields);
    return field;
  }
  static deleteCustomField = (id: string) => this.saveCustomFields(this.getCustomFields().filter(f => f.id !== id));

  // Automations management
  static getAutomations(): Automation[] {
    return this.getItems<Automation>(this.AUTOMATIONS_KEY).map(automation => ({
      ...automation,
      createdAt: new Date(automation.createdAt),
      updatedAt: new Date(automation.updatedAt),
    }));
  }
  static saveAutomations = (automations: Automation[]) => this.saveItems(this.AUTOMATIONS_KEY, automations);
  static createAutomation(data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Automation {
    const automations = this.getAutomations();
    const automation: Automation = { ...data, id: crypto.randomUUID(), executionCount: 0, createdAt: new Date(), updatedAt: new Date() };
    automations.unshift(automation);
    this.saveAutomations(automations);
    return automation;
  }
  static deleteAutomation = (id: string) => this.saveAutomations(this.getAutomations().filter(a => a.id !== id));

  // Reminders management
  static getReminders(): Reminder[] {
    return this.getItems<Reminder>(this.REMINDERS_KEY).map(reminder => ({
      ...reminder,
      createdAt: new Date(reminder.createdAt),
      remindAt: new Date(reminder.remindAt),
    }));
  }
  static saveReminders = (reminders: Reminder[]) => this.saveItems(this.REMINDERS_KEY, reminders);
  static createReminder(data: Omit<Reminder, 'id' | 'createdAt' | 'isTriggered'>): Reminder {
    const reminders = this.getReminders();
    const reminder: Reminder = { ...data, id: crypto.randomUUID(), isTriggered: false, createdAt: new Date() };
    reminders.unshift(reminder);
    this.saveReminders(reminders);
    return reminder;
  }
  static deleteReminder = (id: string) => this.saveReminders(this.getReminders().filter(r => r.id !== id));

  // General utilities
  static clearAll() {
    [this.NOTES_KEY, this.TASKS_KEY, this.WIKIS_KEY, this.PROJECTS_KEY, this.EMAILS_KEY, this.DOCUMENTS_KEY, this.FORMS_KEY, this.CUSTOM_FIELDS_KEY, this.AUTOMATIONS_KEY, this.REMINDERS_KEY].forEach(key => {
      localStorage.removeItem(key);
    });
    this.init();
  }
}
