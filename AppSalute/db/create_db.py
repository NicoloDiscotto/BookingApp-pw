import sqlite3
import bcrypt

# Connessione al database SQLite, se il file 'app.db' non esiste allora lo crea
conn = sqlite3.connect('app.db')
cursor = conn.cursor()

# Creazione della tabella 'users'
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL)
''')

# Genera hash per la prima password
password = '12345678'
password_in_bytes = password.encode('utf-8')
salt = bcrypt.gensalt()
hashed_password = bcrypt.hashpw(password_in_bytes, salt)
password1 = hashed_password.decode('utf-8')

# Genera hash per la seconda password
password2 = '12345678'
password2_in_bytes = password2.encode('utf-8')
salt2 = bcrypt.gensalt()
hashed_password2 = bcrypt.hashpw(password2_in_bytes, salt2)
password2 = hashed_password2.decode('utf-8')

# Inserimento di due utenti di default nella tabella 'users'
cursor.execute('''
INSERT OR IGNORE INTO users (email, password) VALUES 
    ('mario.rossi@example.com', ?),
    ('mattia.gialli@example.com', ?)
    ''', (password1, password2))

# Creazione della tabella 'doctors'
cursor.execute('''
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    image_path TEXT NOT NULL)
''')

# Inserimento dei dottori
cursor.execute('''
INSERT OR IGNORE INTO doctors (name, specialization, image_path) VALUES
    ('Dott.ssa Aurora Neri', 'Dermatologa', '/public/icons-doc-3.png'),
    ('Dott. Marco Verdi', 'Oculista', '/public/icons-doc-1.png'),
    ('Dott. Luca Bianchi', 'Fisioterapista', '/public/icons-doc-2.png'),
    ('Dott.ssa Giulia Viola', 'Nutrizionista', '/public/icons-doc-4.png')
''')

# Creazione della tabella 'bookings'
cursor.execute('''
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id))
''')

# Salvataggio delle modifiche e chiusura della connessione al database
conn.commit()
conn.close()

print("Database creato e popolato con successo!")