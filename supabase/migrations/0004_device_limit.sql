-- =============================================================================
-- 0004_device_limit.sql — limit submissions per device.
--
-- Two salted-hash identifiers per submission:
--   device_hash  = hash of a server-set httpOnly cookie id
--   client_hash  = hash of a localStorage id sent by the browser
-- The submit endpoint rejects a new submission once EITHER identifier already
-- has the allowed number of rows (default 2), so clearing one still gets caught
-- by the other. (IP is not used for this — patients share hospital WiFi.)
-- =============================================================================

alter table feedback add column if not exists device_hash text;
alter table feedback add column if not exists client_hash text;

create index if not exists feedback_device_hash_idx on feedback (device_hash);
create index if not exists feedback_client_hash_idx on feedback (client_hash);
