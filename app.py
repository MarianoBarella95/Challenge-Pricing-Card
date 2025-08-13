import os
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, flash

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")


def get_db_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        message = request.form.get("message", "").strip()

        if not name or not email:
            flash("Nombre y correo son obligatorios.", "danger")
            return redirect(url_for("index"))

        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                "INSERT INTO submissions (name, email, message) VALUES (?, ?, ?)",
                (name, email, message if message else None),
            )
            connection.commit()

        flash("Datos guardados exitosamente.", "success")
        return redirect(url_for("index"))

    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, name, email, message, created_at FROM submissions ORDER BY created_at DESC LIMIT 20"
        )
        recent_submissions = cursor.fetchall()

    return render_template("index.html", submissions=recent_submissions)


if __name__ == "__main__":
    initialize_database()
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)