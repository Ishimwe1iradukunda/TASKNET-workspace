import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FileText, CheckSquare, FolderOpen, BookOpen, Mail, Database } from "lucide-react";
import backend from "~backend/client";
import { LocalStorageManager } from "../utils/localStorage";

type ResultType = "note" | "task" | "project" | "wiki" | "email" | "document";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOfflineMode: boolean;
  onNavigate: (
    viewId:
      | "notes"
      | "tasks"
      | "projects"
      | "wikis"
      | "email"
      | "documents"
  ) => void;
}

interface ResultItem {
  id: string;
  type: ResultType;
  title: string;
  excerpt?: string;
  meta?: Record<string, any>;
}

function iconForType(t: ResultType) {
  switch (t) {
    case "task":
      return CheckSquare;
    case "project":
      return FolderOpen;
    case "wiki":
      return BookOpen;
    case "email":
      return Mail;
    case "document":
      return Database;
    case "note":
    default:
      return FileText;
  }
}

type NavView = CommandPaletteProps["onNavigate"] extends (v: infer V) => any ? V : never;
function viewForType(t: ResultType): NavView {
  switch (t) {
    case "task":
      return "tasks" as NavView;
    case "project":
      return "projects" as NavView;
    case "wiki":
      return "wikis" as NavView;
    case "email":
      return "email" as NavView;
    case "document":
      return "documents" as NavView;
    case "note":
    default:
      return "notes" as NavView;
  }
}

export function CommandPalette({ open, onOpenChange, isOfflineMode, onNavigate }: CommandPaletteProps) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        if (isOfflineMode) {
          const ql = q.toLowerCase();
          const notes = LocalStorageManager.getNotes()
            .filter(n => n.title.toLowerCase().includes(ql) || n.content.toLowerCase().includes(ql))
            .slice(0, 25)
            .map<ResultItem>(n => ({
              id: n.id,
              type: "note",
              title: n.title,
              excerpt: n.content.slice(0, 120),
              meta: { updatedAt: n.updatedAt, tags: n.tags },
            }));
          const tasks = LocalStorageManager.getTasks()
            .filter(t => t.title.toLowerCase().includes(ql) || (t.description ?? "").toLowerCase().includes(ql))
            .slice(0, 25)
            .map<ResultItem>(t => ({
              id: t.id,
              type: "task",
              title: t.title,
              excerpt: (t.description ?? "").slice(0, 120),
              meta: { status: t.status, priority: t.priority, dueDate: t.dueDate },
            }));
          const projects = LocalStorageManager.getProjects()
            .filter(p => p.name.toLowerCase().includes(ql) || (p.description ?? "").toLowerCase().includes(ql))
            .slice(0, 25)
            .map<ResultItem>(p => ({
              id: p.id,
              type: "project",
              title: p.name,
              excerpt: (p.description ?? "").slice(0, 120),
              meta: { status: p.status },
            }));
          const wikis = LocalStorageManager.getWikis()
            .filter(w => w.title.toLowerCase().includes(ql) || w.content.toLowerCase().includes(ql))
            .slice(0, 25)
            .map<ResultItem>(w => ({
              id: w.id,
              type: "wiki",
              title: w.title,
              excerpt: w.content.slice(0, 120),
              meta: { tags: w.tags },
            }));
          const emails = LocalStorageManager.getEmails()
            .filter(e => e.subject.toLowerCase().includes(ql) || e.body.toLowerCase().includes(ql) || e.sender.toLowerCase().includes(ql))
            .slice(0, 25)
            .map<ResultItem>(e => ({
              id: e.id,
              type: "email",
              title: e.subject,
              excerpt: `From: ${e.sender}`,
              meta: { isRead: e.isRead, receivedAt: e.receivedAt },
            }));
          const documents = LocalStorageManager.getDocuments()
            .filter(d => d.name.toLowerCase().includes(ql))
            .slice(0, 25)
            .map<ResultItem>(d => ({
              id: d.id,
              type: "document",
              title: d.name,
              excerpt: d.fileType,
              meta: { size: d.size },
            }));
          const merged = [...notes, ...tasks, ...projects, ...wikis, ...emails, ...documents].slice(0, 50);
          if (!cancelled) setResults(merged);
        } else {
          const r = await backend.workspace.enterpriseSearch({ query: q, type: "all", limit: 50 });
          if (!cancelled) {
            setResults(
              r.results.map<ResultItem>(x => ({
                id: x.id,
                type: x.type,
                title: x.title,
                excerpt: x.excerpt,
                meta: x.metadata,
              }))
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const handle = setTimeout(run, 150);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, isOfflineMode]);

  const onEnter = () => {
    if (!results[selected]) return;
    const view = viewForType(results[selected].type);
    onNavigate(view);
    onOpenChange(false);
  };

  const grouped = useMemo(() => {
    const g = new Map<ResultType, ResultItem[]>();
    for (const r of results) {
      const arr = g.get(r.type) ?? [];
      arr.push(r);
      g.set(r.type, arr);
    }
    return Array.from(g.entries());
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            Search
            <span className="ml-auto text-xs text-muted-foreground">Ctrl/⌘ + K</span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-3">
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(0);
            }}
            placeholder="Search notes, tasks, projects, wikis, emails, documents..."
            className="h-10"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              }
            }}
          />
        </div>

        <div className="max-h-[50vh] overflow-auto border-t">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center text-muted-foreground">No results</div>
          ) : (
            <div className="py-2">
              {grouped.map(([type, items]) => {
                const Icon = iconForType(type);
                return (
                  <div key={type} className="mb-2">
                    <div className="px-4 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {type}
                    </div>
                    {items.map((item) => {
                      const index = results.findIndex((r) => r.id === item.id && r.type === item.type);
                      const active = index === selected;
                      return (
                        <button
                          key={item.id}
                          className={`w-full text-left px-4 py-2 transition-colors ${active ? "bg-muted" : ""}`}
                          onMouseEnter={() => setSelected(index)}
                          onClick={onEnter}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="truncate font-medium">{item.title}</div>
                                {renderMetaBadges(item)}
                              </div>
                              {item.excerpt && (
                                <div className="text-xs text-muted-foreground line-clamp-1">{item.excerpt}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function renderMetaBadges(item: ResultItem) {
  const m = item.meta ?? {};
  const badges: React.ReactNode[] = [];
  if (item.type === "task") {
    if (m.priority) badges.push(<Badge key="p" variant="outline" className="text-xs capitalize">{String(m.priority)}</Badge>);
    if (m.status) badges.push(<Badge key="s" variant="secondary" className="text-xs capitalize">{String(m.status)}</Badge>);
  }
  if (item.type === "email") {
    if (m.isRead === false) badges.push(<Badge key="u" variant="destructive" className="text-xs">unread</Badge>);
  }
  if (Array.isArray(m.tags) && m.tags.length > 0) {
    badges.push(<Badge key="t" variant="outline" className="text-xs">{String(m.tags[0])}</Badge>);
  }
  return <div className="flex items-center gap-1">{badges}</div>;
}
