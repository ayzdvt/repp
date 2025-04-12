import { pgTable, text, serial, integer, boolean, json, timestamp, pgEnum, numeric, uniqueIndex, foreignKey, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enum for shape types
export const shapeTypeEnum = pgEnum("shape_type", ["point", "line", "rectangle", "circle", "text"]);

// Drawing table to store user drawings
export const drawings = pgTable("drawings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Setup relations for drawings to users (many-to-one)
export const drawingsRelations = relations(drawings, ({ one }) => ({
  user: one(users, {
    fields: [drawings.userId],
    references: [users.id],
  }),
  shapes: one(shapes, {
    fields: [drawings.id],
    references: [shapes.drawingId],
  }),
}));

// Shapes table to store drawing shapes
export const shapes = pgTable("shapes", {
  id: serial("id").primaryKey(),
  drawingId: integer("drawing_id").references(() => drawings.id, { onDelete: 'cascade' }).notNull(),
  type: shapeTypeEnum("type").notNull(),
  properties: json("properties").notNull(), // Store shape-specific properties as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Setup relations for shapes to drawings (many-to-one)
export const shapesRelations = relations(shapes, ({ one }) => ({
  drawing: one(drawings, {
    fields: [shapes.drawingId],
    references: [drawings.id],
  }),
}));

// Schema definitions for insert operations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDrawingSchema = createInsertSchema(drawings).pick({
  name: true,
  description: true,
  userId: true,
});

export const insertShapeSchema = createInsertSchema(shapes).pick({
  drawingId: true,
  type: true,
  properties: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDrawing = z.infer<typeof insertDrawingSchema>;
export type Drawing = typeof drawings.$inferSelect;

export type InsertShape = z.infer<typeof insertShapeSchema>;
export type Shape = typeof shapes.$inferSelect;
