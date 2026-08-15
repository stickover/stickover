-- Persistent daily visitor log, used to power the admin dashboard's
-- "Total Visitors" card (Today / Yesterday / Last 7 Days).
--
-- live_visitors only tracks who's on the site *right now* (rows are wiped
-- after ~2 min of inactivity), so it can't answer "how many distinct people
-- visited today" once they leave. This table keeps one row per
-- (visit_date, session) so we can COUNT DISTINCT sessions per day, and old
-- rows are safe to prune periodically since we only ever look back 7 days.
CREATE TABLE IF NOT EXISTS visitor_daily_log (
  visit_date  DATE NOT NULL,
  session_id  VARCHAR(128) NOT NULL,
  first_seen  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (visit_date, session_id)
);
