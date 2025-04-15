import { users, drawings, shapes, projectAnalyses, feedbacks, type User, type InsertUser, type Drawing, type InsertDrawing, type Shape, type InsertShape, type ProjectAnalysis, type InsertProjectAnalysis, type Feedback, type InsertFeedback } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Drawing methods
  getDrawing(id: number): Promise<Drawing | undefined>;
  getUserDrawings(userId: number): Promise<Drawing[]>;
  createDrawing(drawing: InsertDrawing): Promise<Drawing>;
  updateDrawing(id: number, drawing: Partial<InsertDrawing>): Promise<Drawing | undefined>;
  deleteDrawing(id: number): Promise<boolean>;
  
  // Shape methods
  getShape(id: number): Promise<Shape | undefined>;
  getDrawingShapes(drawingId: number): Promise<Shape[]>;
  createShape(shape: InsertShape): Promise<Shape>;
  updateShape(id: number, shape: Partial<InsertShape>): Promise<Shape | undefined>;
  deleteShape(id: number): Promise<boolean>;
  
  // ProjectAnalysis methods
  getProjectAnalysis(id: number): Promise<ProjectAnalysis | undefined>;
  getUserProjectAnalyses(userId: number): Promise<ProjectAnalysis[]>;
  createProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis>;
  updateProjectAnalysis(id: number, analysis: Partial<InsertProjectAnalysis>): Promise<ProjectAnalysis | undefined>;
  deleteProjectAnalysis(id: number): Promise<boolean>;
  
  // Feedback methods
  getFeedback(id: number): Promise<Feedback | undefined>;
  getAllFeedbacks(): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  deleteFeedback(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Drawing methods
  async getDrawing(id: number): Promise<Drawing | undefined> {
    const [drawing] = await db.select().from(drawings).where(eq(drawings.id, id));
    return drawing;
  }
  
  async getUserDrawings(userId: number): Promise<Drawing[]> {
    return await db.select().from(drawings).where(eq(drawings.userId, userId));
  }
  
  async createDrawing(drawing: InsertDrawing): Promise<Drawing> {
    const [newDrawing] = await db.insert(drawings).values(drawing).returning();
    return newDrawing;
  }
  
  async updateDrawing(id: number, drawing: Partial<InsertDrawing>): Promise<Drawing | undefined> {
    const [updatedDrawing] = await db
      .update(drawings)
      .set(drawing)
      .where(eq(drawings.id, id))
      .returning();
    return updatedDrawing;
  }
  
  async deleteDrawing(id: number): Promise<boolean> {
    const result = await db.delete(drawings).where(eq(drawings.id, id)).returning({ id: drawings.id });
    return result.length > 0;
  }
  
  // Shape methods
  async getShape(id: number): Promise<Shape | undefined> {
    const [shape] = await db.select().from(shapes).where(eq(shapes.id, id));
    return shape;
  }
  
  async getDrawingShapes(drawingId: number): Promise<Shape[]> {
    return await db.select().from(shapes).where(eq(shapes.drawingId, drawingId));
  }
  
  async createShape(shape: InsertShape): Promise<Shape> {
    const [newShape] = await db.insert(shapes).values(shape).returning();
    return newShape;
  }
  
  async updateShape(id: number, shape: Partial<InsertShape>): Promise<Shape | undefined> {
    const [updatedShape] = await db
      .update(shapes)
      .set(shape)
      .where(eq(shapes.id, id))
      .returning();
    return updatedShape;
  }
  
  async deleteShape(id: number): Promise<boolean> {
    const result = await db.delete(shapes).where(eq(shapes.id, id)).returning({ id: shapes.id });
    return result.length > 0;
  }
  
  // ProjectAnalysis methods
  async getProjectAnalysis(id: number): Promise<ProjectAnalysis | undefined> {
    const [analysis] = await db.select().from(projectAnalyses).where(eq(projectAnalyses.id, id));
    return analysis;
  }
  
  async getUserProjectAnalyses(userId: number): Promise<ProjectAnalysis[]> {
    return await db.select().from(projectAnalyses).where(eq(projectAnalyses.userId, userId));
  }
  
  async createProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    const [newAnalysis] = await db.insert(projectAnalyses).values(analysis).returning();
    return newAnalysis;
  }
  
  async updateProjectAnalysis(id: number, analysis: Partial<InsertProjectAnalysis>): Promise<ProjectAnalysis | undefined> {
    const [updatedAnalysis] = await db
      .update(projectAnalyses)
      .set(analysis)
      .where(eq(projectAnalyses.id, id))
      .returning();
    return updatedAnalysis;
  }
  
  async deleteProjectAnalysis(id: number): Promise<boolean> {
    const result = await db.delete(projectAnalyses).where(eq(projectAnalyses.id, id)).returning({ id: projectAnalyses.id });
    return result.length > 0;
  }
  
  // Feedback methods
  async getFeedback(id: number): Promise<Feedback | undefined> {
    const [feedback] = await db.select().from(feedbacks).where(eq(feedbacks.id, id));
    return feedback;
  }
  
  async getAllFeedbacks(): Promise<Feedback[]> {
    return await db.select().from(feedbacks);
  }
  
  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedbacks).values(feedback).returning();
    return newFeedback;
  }
  
  async deleteFeedback(id: number): Promise<boolean> {
    const result = await db.delete(feedbacks).where(eq(feedbacks.id, id)).returning({ id: feedbacks.id });
    return result.length > 0;
  }
}

// Export a single instance of the storage
export const storage = new DatabaseStorage();
