import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { insertUserSchema, insertDrawingSchema, insertShapeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Status route to test API connectivity
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'CAD Drawing Tool API is running' });
  });
  
  // User routes
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  });
  
  // Drawing routes
  app.get('/api/drawings', async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      if (!userId) {
        return res.status(400).json({ error: 'userId query parameter is required' });
      }
      
      const drawings = await storage.getUserDrawings(userId);
      res.json(drawings);
    } catch (error) {
      console.error('Error fetching drawings:', error);
      res.status(500).json({ error: 'Failed to fetch drawings' });
    }
  });
  
  app.get('/api/drawings/:id', async (req, res) => {
    try {
      const drawingId = Number(req.params.id);
      const drawing = await storage.getDrawing(drawingId);
      
      if (!drawing) {
        return res.status(404).json({ error: 'Drawing not found' });
      }
      
      res.json(drawing);
    } catch (error) {
      console.error('Error fetching drawing:', error);
      res.status(500).json({ error: 'Failed to fetch drawing' });
    }
  });
  
  app.post('/api/drawings', async (req, res) => {
    try {
      const drawingData = insertDrawingSchema.parse(req.body);
      const drawing = await storage.createDrawing(drawingData);
      res.status(201).json(drawing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating drawing:', error);
        res.status(500).json({ error: 'Failed to create drawing' });
      }
    }
  });
  
  app.patch('/api/drawings/:id', async (req, res) => {
    try {
      const drawingId = Number(req.params.id);
      const drawingData = insertDrawingSchema.partial().parse(req.body);
      
      const updatedDrawing = await storage.updateDrawing(drawingId, drawingData);
      
      if (!updatedDrawing) {
        return res.status(404).json({ error: 'Drawing not found' });
      }
      
      res.json(updatedDrawing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error updating drawing:', error);
        res.status(500).json({ error: 'Failed to update drawing' });
      }
    }
  });
  
  app.delete('/api/drawings/:id', async (req, res) => {
    try {
      const drawingId = Number(req.params.id);
      const success = await storage.deleteDrawing(drawingId);
      
      if (!success) {
        return res.status(404).json({ error: 'Drawing not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting drawing:', error);
      res.status(500).json({ error: 'Failed to delete drawing' });
    }
  });
  
  // Shape routes
  app.get('/api/drawings/:drawingId/shapes', async (req, res) => {
    try {
      const drawingId = Number(req.params.drawingId);
      const shapes = await storage.getDrawingShapes(drawingId);
      res.json(shapes);
    } catch (error) {
      console.error('Error fetching shapes:', error);
      res.status(500).json({ error: 'Failed to fetch shapes' });
    }
  });
  
  app.post('/api/shapes', async (req, res) => {
    try {
      const shapeData = insertShapeSchema.parse(req.body);
      const shape = await storage.createShape(shapeData);
      res.status(201).json(shape);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating shape:', error);
        res.status(500).json({ error: 'Failed to create shape' });
      }
    }
  });
  
  app.patch('/api/shapes/:id', async (req, res) => {
    try {
      const shapeId = Number(req.params.id);
      const shapeData = insertShapeSchema.partial().parse(req.body);
      
      const updatedShape = await storage.updateShape(shapeId, shapeData);
      
      if (!updatedShape) {
        return res.status(404).json({ error: 'Shape not found' });
      }
      
      res.json(updatedShape);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error updating shape:', error);
        res.status(500).json({ error: 'Failed to update shape' });
      }
    }
  });
  
  app.delete('/api/shapes/:id', async (req, res) => {
    try {
      const shapeId = Number(req.params.id);
      const success = await storage.deleteShape(shapeId);
      
      if (!success) {
        return res.status(404).json({ error: 'Shape not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting shape:', error);
      res.status(500).json({ error: 'Failed to delete shape' });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
