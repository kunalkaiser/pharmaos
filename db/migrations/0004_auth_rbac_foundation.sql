CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 16384,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);

CREATE TABLE IF NOT EXISTS roles (
  role_key TEXT PRIMARY KEY CHECK (role_key IN ('admin', 'reviewer', 'analyst', 'read_only', 'system')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (role_key, description)
VALUES
  ('admin', 'Can access admin surfaces, audit views, and protected internal operations.'),
  ('reviewer', 'Can review candidates and perform governed promotion actions.'),
  ('analyst', 'Can run internal evidence candidate searches and view workspace evidence surfaces.'),
  ('read_only', 'Can view authenticated workspace surfaces without mutation permissions.'),
  ('system', 'Reserved for server-side system events, not a human login role.')
ON CONFLICT (role_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_key TEXT NOT NULL REFERENCES roles (role_key) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_key)
);

CREATE INDEX IF NOT EXISTS user_roles_role_key_idx ON user_roles (role_key);
