-- Add notification_copy_email column to workshops table
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS notification_copy_email text;

COMMENT ON COLUMN public.workshops.notification_copy_email IS 'Email to receive copies of all client notifications';
