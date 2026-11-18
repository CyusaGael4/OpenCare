import mongoose from 'mongoose';

export const USER_ROLES = Object.freeze(['patient', 'doctor']);

// Deliberately permissive: format is enforced by the API validators, this is a
// last line of defence against malformed data written outside the API.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required.'],
      trim: true,
      minlength: [2, 'Full name is too short.'],
      maxlength: [80, 'Full name is too long.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [254, 'Email is too long.'],
      match: [EMAIL_PATTERN, 'Enter a valid email address.'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      maxlength: [30, 'Phone number is too long.'],
    },
    /*
     * Only ever a bcrypt hash. `select: false` means it is excluded from every
     * query unless explicitly requested, so it cannot leak through a careless
     * controller or a serialised response.
     */
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: 'Role must be either patient or doctor.',
      },
      default: 'patient',
      required: true,
    },
    profileImage: {
      type: String,
      default: null,
      maxlength: [500, 'Image path is too long.'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_document, result) {
        // Never serialise credentials, whatever a caller does.
        delete result._id;
        delete result.passwordHash;
        return result;
      },
    },
  },
);

/** Case-insensitive lookup: emails are stored lowercase and trimmed. */
userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email ?? '').trim().toLowerCase() });
};

/** Login needs the hash, which `select: false` hides by default. */
userSchema.statics.findByEmailWithPassword = function findByEmailWithPassword(email) {
  return this.findOne({ email: String(email ?? '').trim().toLowerCase() }).select(
    '+passwordHash',
  );
};

/** Public shape of a user, safe to return to any client. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    profileImage: this.profileImage,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
