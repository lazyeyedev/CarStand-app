const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false means password is excluded from every query by default —
    // controllers that need it must opt in explicitly with .select('+password').
    // minlength here is a schema-level backstop; the real complexity rule
    // (8 chars, 1 letter, 1 number) is enforced in controllers via validatePassword.
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'dealer', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
    isActive: { type: Boolean, default: true },
    // Set whenever the password changes (via change-password or reset-password).
    // Used to invalidate any reset tokens issued before this timestamp, so a
    // reset link can't be reused after it's already been acted on — JWTs are
    // stateless and don't expire themselves just because they were used once.
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
