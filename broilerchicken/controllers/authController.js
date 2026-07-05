const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { name, username, email, password, phone_no, address, area } = req.body;

  try {
    if (!name || !username || !email || !password || !phone_no || !address || !area) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `SELECT register_customer($1, $2, $3, $4, $5, $6, $7)`,
      [name, username, email, hashedPassword, phone_no, address, area]
    );

    return res.status(201).json({
      message: "Customer registered successfully",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
      message: err.message || "Registration failed",
    });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM app_user
       WHERE (username = $1 OR email = $1)
       AND UPPER(status) = 'ACTIVE'`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    let customer_id = null;

    if (user.role === "Customer" || user.role === "CUSTOMER") {
      const customerResult = await pool.query(
        `SELECT customer_id
         FROM customer
         WHERE user_id = $1`,
        [user.user_id]
      );

      customer_id = customerResult.rows[0]?.customer_id || null;
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        full_name: user.full_name,
        username: user.username,
        customer_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.full_name,
      username: user.username,
      user_id: user.user_id,
      customer_id,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Login error", error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  const { username, email, newPassword, confirmPassword } = req.body;

  try {
    if ((!username && !email) || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please enter username or email, new password, and confirm password.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    if (newPassword.length < 5) {
      return res.status(400).json({
        message: "Password must be at least 5 characters.",
      });
    }

  const userResult = await pool.query(
    `
    SELECT user_id, username, email, role
    FROM app_user
    WHERE (username = $1 OR email = $2)
    AND UPPER(status) = 'ACTIVE'
    AND UPPER(role) = 'CUSTOMER'
    `,
    [username || "", email || ""]
  );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Account not found.",
      });
    }

    const user = userResult.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE app_user
      SET password = $1
      WHERE user_id = $2
      `,
      [hashedPassword, user.user_id]
    );

    return res.json({
      message: "Password reset successfully. You can now log in using your new password.",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({
      message: "Failed to reset password.",
      error: err.message,
    });
  }
};

module.exports = { register, login, forgotPassword };