import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mor Thai Backend API',
      version: '1.0.0',
      description: 'RESTful API for Mor Thai application - Thai Massage and Spa Services',
      contact: {
        name: 'Mor Thai API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server',
      },
      {
        url: 'https://api.morthai-marrakech.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Categorie: {
          type: 'object',
          required: ['NomCategorie'],
          properties: {
            CAT_UUID: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the category',
            },
            NomCategorie: {
              type: 'string',
              description: 'Name of the category',
              example: 'Massage',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Service: {
          type: 'object',
          required: ['NomService', 'Durée', 'Prix', 'CAT_UUID'],
          properties: {
            Service_UUID: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the service',
            },
            NomService: {
              type: 'string',
              description: 'Name of the service',
              example: 'Thai Massage',
            },
            Description: {
              type: 'string',
              description: 'Description of the service',
            },
            Images: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of image URLs',
            },
            Durée: {
              type: 'integer',
              description: 'Duration in minutes',
              example: 60,
            },
            Prix: {
              type: 'number',
              format: 'decimal',
              description: 'Price of the service',
              example: 500.00,
            },
            CAT_UUID: {
              type: 'string',
              format: 'uuid',
              description: 'Category UUID',
            },
            NomCategorie: {
              type: 'string',
              description: 'Category name (from join)',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Reservation: {
          type: 'object',
          required: ['NomClient', 'Email', 'NumeroTelephone', 'DateRes', 'HeureRes', 'Service_UUID', 'PrixTotal'],
          properties: {
            Reservation_UUID: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the reservation',
            },
            NomClient: {
              type: 'string',
              description: 'Client name',
              example: 'John Doe',
            },
            Email: {
              type: 'string',
              format: 'email',
              description: 'Client email',
              example: 'john@example.com',
            },
            NumeroTelephone: {
              type: 'string',
              description: 'Client phone number',
              example: '+212612345678',
            },
            DateRes: {
              type: 'string',
              format: 'date',
              description: 'Reservation date',
              example: '2024-12-25',
            },
            HeureRes: {
              type: 'string',
              format: 'time',
              description: 'Reservation time',
              example: '14:00:00',
            },
            Service_UUID: {
              type: 'string',
              format: 'uuid',
              description: 'Service UUID',
            },
            ModePaiement: {
              type: 'string',
              description: 'Payment method',
              example: 'cash',
              enum: ['cash', 'card', 'online'],
            },
            PrixTotal: {
              type: 'number',
              format: 'decimal',
              description: 'Total price',
              example: 500.00,
            },
            NbrPersonne: {
              type: 'integer',
              description: 'Number of people',
              default: 1,
            },
            StatusRes: {
              type: 'string',
              description: 'Reservation status',
              default: 'pending',
              enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            },
            Note: {
              type: 'string',
              description: 'Additional notes',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CarteCadeaux: {
          type: 'object',
          required: ['Theme', 'Prix'],
          properties: {
            CarteID: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the gift card',
            },
            Theme: {
              type: 'string',
              description: 'Gift card theme',
              example: 'Anniversary',
            },
            Prix: {
              type: 'number',
              format: 'decimal',
              description: 'Gift card price',
              example: 1000.00,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Offre: {
          type: 'object',
          required: ['NomBeneficiaire', 'EmailBeneficiaire', 'NumTelephoneBeneficiaire', 'NomEnvoyeur', 'CarteCadeaux', 'Service', 'Durée'],
          properties: {
            Offre_UUID: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the offer',
            },
            NomBeneficiaire: {
              type: 'string',
              description: 'Beneficiary name',
              example: 'Jane Doe',
            },
            EmailBeneficiaire: {
              type: 'string',
              format: 'email',
              description: 'Beneficiary email',
              example: 'jane@example.com',
            },
            NumTelephoneBeneficiaire: {
              type: 'string',
              description: 'Beneficiary phone number',
              example: '+212612345679',
            },
            NomEnvoyeur: {
              type: 'string',
              description: 'Sender name',
              example: 'John Doe',
            },
            Note: {
              type: 'string',
              description: 'Additional notes',
            },
            CarteCadeaux: {
              type: 'string',
              format: 'uuid',
              description: 'Gift card UUID',
            },
            Service: {
              type: 'string',
              format: 'uuid',
              description: 'Service UUID',
            },
            Durée: {
              type: 'integer',
              description: 'Duration in minutes',
              example: 60,
            },
            CodeUnique: {
              type: 'string',
              description: 'Unique code for the offer',
              example: 'A1B2C3D4',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/app.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

