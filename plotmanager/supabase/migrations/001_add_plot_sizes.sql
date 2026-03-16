-- Add plot_sizes JSONB column to estates table
-- Stores array of {size: string, price: number} for multiple plot size/price options
ALTER TABLE estates ADD COLUMN IF NOT EXISTS plot_sizes JSONB DEFAULT '[]'::jsonb;

-- Backfill existing estates that have a price_per_plot with a single "Standard" entry
UPDATE estates
SET plot_sizes = jsonb_build_array(jsonb_build_object('size', 'Standard', 'price', price_per_plot))
WHERE price_per_plot > 0 AND (plot_sizes IS NULL OR plot_sizes = '[]'::jsonb);
