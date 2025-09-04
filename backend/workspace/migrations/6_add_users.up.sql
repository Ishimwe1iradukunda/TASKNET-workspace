CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT
);

INSERT INTO users (id, name, email, avatar_url) VALUES
('user-1', 'Alex', 'alex@example.com', 'https://i.pravatar.cc/150?u=alex'),
('user-2', 'Beth', 'beth@example.com', 'https://i.pravatar.cc/150?u=beth'),
('user-3', 'Charlie', 'charlie@example.com', 'https://i.pravatar.cc/150?u=charlie'),
('user-4', 'Diana', 'diana@example.com', 'https://i.pravatar.cc/150?u=diana');
