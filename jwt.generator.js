// jwt.generator.js
const crypto = require("crypto");

function generateJwtSecret() {
  // Generate 32 random bytes (256 bits)
  const secret = crypto.randomBytes(64).toString("hex");
  return secret;
}

const secret = generateJwtSecret();
console.log("Your new JWT secret key:\n", secret);
