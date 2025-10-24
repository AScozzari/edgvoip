-- Voicemail Boxes table
CREATE TABLE IF NOT EXISTS voicemail_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mailbox_id VARCHAR(50) NOT NULL UNIQUE, -- Usually extension number
  password VARCHAR(20) NOT NULL,
  full_name VARCHAR(100),
  email VARCHAR(255),
  pager_email VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  attach_file BOOLEAN NOT NULL DEFAULT true,
  delete_voicemail BOOLEAN NOT NULL DEFAULT false,
  say_caller_id BOOLEAN NOT NULL DEFAULT true,
  say_caller_id_name BOOLEAN NOT NULL DEFAULT true,
  say_envelope BOOLEAN NOT NULL DEFAULT true,
  skip_greeting BOOLEAN NOT NULL DEFAULT false,
  skip_instructions BOOLEAN NOT NULL DEFAULT false,
  email_attachment_format VARCHAR(10) DEFAULT 'wav',
  voicemail_password VARCHAR(20), -- For accessing voicemail
  max_greeting_length INTEGER DEFAULT 60,
  max_message_length INTEGER DEFAULT 300,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- Additional voicemail settings
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Voicemail Messages table
CREATE TABLE IF NOT EXISTS voicemail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voicemail_box_id UUID NOT NULL REFERENCES voicemail_boxes(id) ON DELETE CASCADE,
  caller_id_name VARCHAR(100),
  caller_id_number VARCHAR(20),
  message_path VARCHAR(500) NOT NULL, -- File path to the voicemail recording
  message_length INTEGER NOT NULL DEFAULT 0, -- Duration in seconds
  is_new BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  transcription TEXT, -- Optional transcription of the message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Voicemail Greetings table (multiple greetings per box)
CREATE TABLE IF NOT EXISTS voicemail_greetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voicemail_box_id UUID NOT NULL REFERENCES voicemail_boxes(id) ON DELETE CASCADE,
  greeting_type VARCHAR(20) NOT NULL DEFAULT 'default', -- default, busy, unavailable
  greeting_path VARCHAR(500), -- File path to greeting
  greeting_text TEXT, -- Text-to-speech greeting
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for voicemail_boxes
CREATE INDEX IF NOT EXISTS idx_voicemail_boxes_tenant_id ON voicemail_boxes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voicemail_boxes_mailbox_id ON voicemail_boxes(mailbox_id);
CREATE INDEX IF NOT EXISTS idx_voicemail_boxes_enabled ON voicemail_boxes(enabled);

-- Indexes for voicemail_messages
CREATE INDEX IF NOT EXISTS idx_voicemail_messages_box_id ON voicemail_messages(voicemail_box_id);
CREATE INDEX IF NOT EXISTS idx_voicemail_messages_is_new ON voicemail_messages(is_new);
CREATE INDEX IF NOT EXISTS idx_voicemail_messages_created_at ON voicemail_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_voicemail_messages_is_deleted ON voicemail_messages(is_deleted);

-- Indexes for voicemail_greetings
CREATE INDEX IF NOT EXISTS idx_voicemail_greetings_box_id ON voicemail_greetings(voicemail_box_id);
CREATE INDEX IF NOT EXISTS idx_voicemail_greetings_type ON voicemail_greetings(greeting_type);
CREATE INDEX IF NOT EXISTS idx_voicemail_greetings_is_active ON voicemail_greetings(is_active);

-- RLS Policies
ALTER TABLE voicemail_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voicemail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voicemail_greetings ENABLE ROW LEVEL SECURITY;

-- Voicemail boxes RLS policy
DROP POLICY IF EXISTS voicemail_boxes_tenant_isolation_policy ON voicemail_boxes;
CREATE POLICY voicemail_boxes_tenant_isolation_policy ON voicemail_boxes
FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Voicemail messages RLS policy (inherits from voicemail_boxes)
DROP POLICY IF EXISTS voicemail_messages_tenant_isolation_policy ON voicemail_messages;
CREATE POLICY voicemail_messages_tenant_isolation_policy ON voicemail_messages
FOR ALL
USING (voicemail_box_id IN (
  SELECT id FROM voicemail_boxes 
  WHERE tenant_id = current_setting('app.tenant_id')::uuid
));

-- Voicemail greetings RLS policy (inherits from voicemail_boxes)
DROP POLICY IF EXISTS voicemail_greetings_tenant_isolation_policy ON voicemail_greetings;
CREATE POLICY voicemail_greetings_tenant_isolation_policy ON voicemail_greetings
FOR ALL
USING (voicemail_box_id IN (
  SELECT id FROM voicemail_boxes 
  WHERE tenant_id = current_setting('app.tenant_id')::uuid
));

-- Triggers to update updated_at column
CREATE TRIGGER update_voicemail_boxes_updated_at BEFORE UPDATE ON voicemail_boxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voicemail_greetings_updated_at BEFORE UPDATE ON voicemail_greetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
