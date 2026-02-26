import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Shhh API',
      version: '0.2.0',
      description: 'Geosocial networking backend API with enterprise-grade security, PostGIS geolocation, and real-time messaging.',
      contact: { name: 'Shhh Team' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            displayName: { type: 'string' },
            bio: { type: 'string' },
            gender: { type: 'string' },
            sexuality: { type: 'string' },
            photosJson: { type: 'array', items: { type: 'object' } },
            verificationStatus: { type: 'string', enum: ['unverified', 'photo_verified', 'id_verified', 'reference_verified'] },
            kinks: { type: 'array', items: { type: 'string' } },
            experienceLevel: { type: 'string', enum: ['new', 'curious', 'experienced', 'veteran'] },
            isHost: { type: 'boolean' },
          },
        },
        NearbyUser: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            displayName: { type: 'string' },
            distance: { type: 'number', description: 'Distance in meters' },
            verificationStatus: { type: 'string' },
            experienceLevel: { type: 'string' },
            isHost: { type: 'boolean' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            startsAt: { type: 'string', format: 'date-time' },
            endsAt: { type: 'string', format: 'date-time' },
            type: { type: 'string', enum: ['party', 'club_night', 'hotel_takeover', 'travel_meetup'] },
            capacity: { type: 'integer' },
            isPrivate: { type: 'boolean' },
            status: { type: 'string', enum: ['upcoming', 'active', 'completed', 'cancelled'] },
          },
        },
        TrustScore: {
          type: 'object',
          properties: {
            totalScore: { type: 'number' },
            tierPoints: { type: 'number' },
            referencePoints: { type: 'number' },
            agePoints: { type: 'number' },
            reportPenalty: { type: 'number' },
            badge: { type: 'string', enum: ['new', 'verified', 'established', 'trusted'] },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & registration' },
      { name: 'Users', description: 'User profiles & interactions' },
      { name: 'Couples', description: 'Couple linking & management' },
      { name: 'Verification', description: 'Multi-tier verification' },
      { name: 'References', description: 'User reference system' },
      { name: 'Discovery', description: 'PostGIS geolocation discovery' },
      { name: 'Messaging', description: 'Conversations & messages' },
      { name: 'Events', description: 'Events & RSVPs' },
      { name: 'Venues', description: 'Venue management & geofences' },
      { name: 'Safety', description: 'Emergency contacts, check-ins, panic' },
      { name: 'Compliance', description: 'GDPR/CCPA data rights' },
      { name: 'Admin', description: 'Moderation dashboard' },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          responses: { 200: { description: 'Server healthy' } },
        },
      },
      '/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register with phone',
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['phone', 'displayName'], properties: { phone: { type: 'string' }, displayName: { type: 'string' } } } } } },
          responses: { 201: { description: 'User created with tokens' }, 409: { description: 'Phone already registered' } },
        },
      },
      '/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with phone',
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['phone'], properties: { phone: { type: 'string' } } } } } },
          responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid credentials' } },
        },
      },
      '/v1/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string', format: 'uuid' } } } } } },
          responses: { 200: { description: 'New token pair' } },
        },
      },
      '/v1/auth/logout': {
        delete: {
          tags: ['Auth'], summary: 'Logout', security: [{ bearerAuth: [] }],
          responses: { 204: { description: 'Logged out' } },
        },
      },
      '/v1/users/me': {
        get: { tags: ['Users'], summary: 'Get current user profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Profile data' } } },
        put: { tags: ['Users'], summary: 'Update profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Updated profile' } } },
      },
      '/v1/users/{id}/like': { post: { tags: ['Users'], summary: 'Like a user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Like recorded, matched flag returned' } } } },
      '/v1/users/{id}/block': { post: { tags: ['Users'], summary: 'Block a user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Blocked' } } } },
      '/v1/users/{id}/report': { post: { tags: ['Users'], summary: 'Report a user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Report created' } } } },
      '/v1/couples': { post: { tags: ['Couples'], summary: 'Create couple profile', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Couple created with invite code' } } } },
      '/v1/couples/me': { get: { tags: ['Couples'], summary: 'Get couple info', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Couple data' } } } },
      '/v1/couples/link': { post: { tags: ['Couples'], summary: 'Link partner with invite code', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Couple activated' } } } },
      '/v1/couples/dissolve': { post: { tags: ['Couples'], summary: 'Request dissolution (7-day cooldown)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Dissolution initiated' } } } },
      '/v1/verification/status': { get: { tags: ['Verification'], summary: 'Get verification status', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Verification status' } } } },
      '/v1/verification/photo': { post: { tags: ['Verification'], summary: 'Submit photo verification', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Verification submitted' } } } },
      '/v1/verification/id': { post: { tags: ['Verification'], summary: 'Submit ID verification (tier 1+)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'ID verification submitted' } } } },
      '/v1/references': { post: { tags: ['References'], summary: 'Create reference (tier 2+)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Reference created' } } } },
      '/v1/references/{userId}': { get: { tags: ['References'], summary: 'Get references for user', security: [{ bearerAuth: [] }], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'References list' } } } },
      '/v1/discover': { get: { tags: ['Discovery'], summary: 'Find nearby users', security: [{ bearerAuth: [] }], parameters: [{ name: 'lat', in: 'query', required: true, schema: { type: 'number' } }, { name: 'lng', in: 'query', required: true, schema: { type: 'number' } }, { name: 'radius', in: 'query', schema: { type: 'number' } }], responses: { 200: { description: 'Nearby users list' } } } },
      '/v1/discover/location': { post: { tags: ['Discovery'], summary: 'Update location', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Location updated' } } } },
      '/v1/conversations': { get: { tags: ['Messaging'], summary: 'List conversations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Conversations' } } }, post: { tags: ['Messaging'], summary: 'Create conversation (tier 1+)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Conversation created' } } } },
      '/v1/conversations/{id}/messages': { get: { tags: ['Messaging'], summary: 'Get messages', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Messages' } } }, post: { tags: ['Messaging'], summary: 'Send message', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Message sent' } } } },
      '/v1/events': { post: { tags: ['Events'], summary: 'Create event (tier 2+)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Event created' } } } },
      '/v1/events/nearby': { get: { tags: ['Events'], summary: 'Find nearby events', security: [{ bearerAuth: [] }], parameters: [{ name: 'lat', in: 'query', required: true, schema: { type: 'number' } }, { name: 'lng', in: 'query', required: true, schema: { type: 'number' } }], responses: { 200: { description: 'Events list' } } } },
      '/v1/events/{id}/rsvp': { post: { tags: ['Events'], summary: 'RSVP to event', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'RSVP recorded' } } } },
      '/v1/events/{id}/checkin': { post: { tags: ['Events'], summary: 'Check in at event', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Checked in' } } } },
      '/v1/venues': { post: { tags: ['Venues'], summary: 'Create venue (tier 2+)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Venue created' } } } },
      '/v1/venues/nearby': { get: { tags: ['Venues'], summary: 'Find nearby venues', security: [{ bearerAuth: [] }], parameters: [{ name: 'lat', in: 'query', required: true, schema: { type: 'number' } }, { name: 'lng', in: 'query', required: true, schema: { type: 'number' } }], responses: { 200: { description: 'Venues list' } } } },
      '/v1/safety/contacts': { get: { tags: ['Safety'], summary: 'List emergency contacts', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Contacts' } } }, post: { tags: ['Safety'], summary: 'Add emergency contact', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Contact added' } } } },
      '/v1/safety/checkin': { post: { tags: ['Safety'], summary: 'Safety check-in', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Check-in recorded' } } } },
      '/v1/safety/panic': { post: { tags: ['Safety'], summary: 'Trigger panic alert', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Alert sent to contacts' } } } },
      '/v1/compliance/data-export': { post: { tags: ['Compliance'], summary: 'GDPR data export', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Full data export' } } } },
      '/v1/compliance/account-deletion': { delete: { tags: ['Compliance'], summary: 'Request account deletion', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Deletion requested' } } } },
      '/v1/compliance/consent': { post: { tags: ['Compliance'], summary: 'Record consent', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Consent recorded' } } } },
      '/v1/admin/stats': { get: { tags: ['Admin'], summary: 'Dashboard stats', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Stats' } } } },
      '/v1/admin/moderation': { get: { tags: ['Admin'], summary: 'Moderation queue', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Queue items' } } } },
      '/v1/admin/reports': { get: { tags: ['Admin'], summary: 'Report list', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Reports' } } } },
      '/v1/admin/reports/{id}/resolve': { post: { tags: ['Admin'], summary: 'Resolve report', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Resolved' } } } },
      '/v1/admin/users/{userId}': { get: { tags: ['Admin'], summary: 'User detail view', security: [{ bearerAuth: [] }], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User detail' } } } },
      '/v1/admin/users/{userId}/ban': { post: { tags: ['Admin'], summary: 'Ban user', security: [{ bearerAuth: [] }], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User banned' } } } },
      '/v1/admin/audit-logs': { get: { tags: ['Admin'], summary: 'Audit logs', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Logs' } } } },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
