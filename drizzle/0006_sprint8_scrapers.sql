CREATE TABLE "oem_part_numbers" (
	"product_id" uuid NOT NULL,
	"part_number" text NOT NULL,
	"raw_number" text NOT NULL,
	"source" text,
	CONSTRAINT "oem_part_numbers_product_id_part_number_pk" PRIMARY KEY("product_id","part_number")
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"fetched" integer DEFAULT 0 NOT NULL,
	"imported" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "display_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "oem_part_numbers" ADD CONSTRAINT "oem_part_numbers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;