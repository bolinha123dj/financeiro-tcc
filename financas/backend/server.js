app.use(cors({
  origin: function (origin, callback) {
    // Permite qualquer origem que venha da Vercel ou Localhost
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));