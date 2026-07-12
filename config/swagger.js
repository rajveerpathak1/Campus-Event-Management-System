const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Campus Event Management API",
      version: "1.0.0",
      description: "Production-ready backend for managing campus events",
    },
    servers: [
      {
        url: process.env.BACKEND_URL 
          ? (process.env.BACKEND_URL.endsWith("/api/v1") ? process.env.BACKEND_URL : `${process.env.BACKEND_URL}/api/v1`)
          : "http://localhost:5000/api/v1",
        description: "Current environment server",
      },
      {
        url: "https://campus-event-management-system-lhpe.onrender.com/api/v1",
        description: "Production server (Render)",
      },
      {
        url: "http://localhost:5000/api/v1",
        description: "Local development server",
      },
    ],

    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Rajveer" },
            email: { type: "string", example: "rajveer@gmail.com" },
            role: { type: "string", example: "student" },
          },
        },

        Event: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Hackathon" },
            description: { type: "string", example: "Coding event" },
            event_date: { type: "string", example: "2026-05-01T10:00:00Z" },
            capacity: { type: "integer", example: 100 },
            status: { type: "string", example: "published" },
          },
        },

        Registration: {
          type: "object",
          properties: {
            registration_id: { type: "integer", example: 1 },
            event_id: { type: "integer", example: 1 },
            title: { type: "string", example: "Hackathon" },
          },
        },
      },
    },
  },

  apis: ["./routes/**/*.js"],
};

module.exports = swaggerJsdoc(options);