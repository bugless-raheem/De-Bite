CREATE TABLE "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"price" real NOT NULL,
	"image" text NOT NULL,
	"options" jsonb NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"order_type" text NOT NULL,
	"address" text,
	"lines" jsonb NOT NULL,
	"subtotal" real NOT NULL,
	"delivery_fee" real NOT NULL,
	"total" real NOT NULL,
	"payment_confirmed" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'received' NOT NULL
);
