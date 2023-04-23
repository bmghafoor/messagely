const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");

function getTime(){

  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;

  return dateTime
}

class User {
  static async register({ username, password, first_name, last_name, phone }) {
    current_time = getTime()
    let hashedPw = await bcrypt.hash(password, 12);
    const results = await db.query(
      `
    INSERT INTO users (username,password,first_name,last_name,phone,join_at,last_login_at) 
    VALUES ($1, $2, $3, $4, $5, ${current_time}, ${current_time}) 
    RETURNING username, password, first_name, last_name, phone`[
        (username, hashedPw, first_name, last_name, phone)
      ]
    );
    return results.rows[0];
  }

  static async authenticate(username, password) {
    const result = await db.query(
      `
    SELECT * FROM users
    WHERE username = $1,`[username]
    );
    let user = result.rows[0];
    if (bcrypt.compare(password, user.password)) {
      return user;
    } else {
      throw new ExpressError("Invalid username/password", 401);
    }
  }

  static async updateLoginTimestamp(username) {
    current_time = getTime()
    const result = await db.query(
      `
    UPDATE users
    SET last_login_at = ${current_time}
    WHERE username = $1
    RETURNING username`,
      [username]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("User not found", 403);
    }
  }

  static async all() {
    const results = await db.query(`
    SELECT username, first_name, last_name, phone
    FROM users`);
    return results.rows;
  }

  static async get(username) {
    const results = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    if (results.rows.length === 0) {
      throw new ExpressError("User not found", 404);
    }
    return results.rows[0];
  }

  static async messagesFrom(username) {
    const results = await db.query(
      `
    SELECT m.id, m.to_username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
    FROM messages as m 
    JOIN users AS u ON m.to_username = u.username
    WHERE from_username = $1`,
      [username]
    );
    return results.rows.map((m) => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }

  static async messagesTo(username) {
    const results = await db.query(
      `
    SELECT m.id,  m.from_username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
    FROM messages AS m
    JOIN users AS u ON m.from_username = u.username
    WHERE to_username = $1`,
      [username]
    );

    return results.rows.map((m) => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }
}

module.exports = User;
