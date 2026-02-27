import mongoose from 'mongoose';

const currentYear = new Date().getFullYear();

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 2,
    trim: true
  },
  director: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1888,
    max: currentYear
  },
  genre: {
    type: String,
    enum: ['action', 'comedy', 'drama', 'horror', 'scifi'],
    required: true
  },
  copies: {
    type: Number,
    default: 5,
    min: 0
  },
  availableCopies: {
    type: Number
  },
  timesRented: {
    type: Number,
    default: 0
  },
  cover: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

// Inicializar availableCopies igual que copies
movieSchema.pre('save', function(next) {
  if (this.isNew) {
    this.availableCopies = this.copies;
  }
  next();
});

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;