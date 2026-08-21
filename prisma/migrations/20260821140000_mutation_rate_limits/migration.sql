CREATE TABLE "rate_limit_windows" (
  "action" VARCHAR(80) NOT NULL,
  "subject_id" UUID NOT NULL,
  "window_started_at" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "rate_limit_windows_pkey" PRIMARY KEY ("action", "subject_id", "window_started_at")
);

CREATE INDEX "rate_limit_windows_window_started_at_idx" ON "rate_limit_windows"("window_started_at");
