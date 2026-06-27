CREATE TABLE "product_stock" (
	"product_id" uuid NOT NULL,
	"warehouse_id" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_stock_product_id_warehouse_id_pk" PRIMARY KEY("product_id","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service" text NOT NULL,
	"operation" text NOT NULL,
	"status" text NOT NULL,
	"records_affected" integer DEFAULT 0 NOT NULL,
	"error" text,
	"duration_ms" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"state" text,
	"zip" text,
	"active" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zoho_tokens" (
	"service" text PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"data_center" text DEFAULT 'com' NOT NULL,
	"api_domain" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "zoho_sales_order_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "zoho_invoice_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "zoho_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "zoho_item_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "zoho_contact_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "zoho_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;