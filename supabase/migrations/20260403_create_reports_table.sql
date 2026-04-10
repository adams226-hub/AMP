-- Migration: Create reports table for PDF generation
-- This table stores report templates and generated reports to replace hardcoded data

CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type     VARCHAR(50) NOT NULL, -- 'production', 'fuel', 'financial', 'equipment'
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    date_range      VARCHAR(20) DEFAULT 'month', -- 'day', 'week', 'month', 'quarter'
    start_date      DATE,
    end_date        DATE,
    generated_content TEXT, -- The actual report content
    generated_by    UUID REFERENCES users(id),
    generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'completed', -- 'generating', 'completed', 'failed'
    file_url        TEXT, -- URL to stored PDF file if applicable
    metadata        JSONB, -- Additional data like totals, filters, etc.
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_date_range ON reports(start_date, end_date);
CREATE INDEX idx_reports_generated_at ON reports(generated_at);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "reports_read" ON reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reports_write" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reports_update" ON reports FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();