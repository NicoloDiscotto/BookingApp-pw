from flask import Flask, request, jsonify, session, send_from_directory
from flask_swagger_ui import get_swaggerui_blueprint
from datetime import datetime
import sqlite3
import os
import bcrypt

# Configurazione Flask
app = Flask(__name__)
app.static_folder = '../frontend/src'
app.public_folder = '../frontend/public'
app.database = os.path.join(os.path.dirname(__file__), '../db/app.db')
app.secret_key = os.urandom(24) 

# Configurazione di Swagger 
SWAGGER_URL = "/api/docs"  
API_URL = "/swagger.json"  
swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# Connessione al database
def get_db_connection():
    conn = sqlite3.connect(app.database)
    conn.row_factory = sqlite3.Row
    return conn

# Route per login
@app.route('/')
def login_page():
    return send_from_directory(os.path.join(app.static_folder, 'html'), 'login.html')

# Route per index
@app.route('/index')
def index():
    return send_from_directory(os.path.join(app.static_folder, 'html'), 'index.html')

# Route per servire i file HTML
@app.route('/<page>.html')
def html_page(page):
    return send_from_directory(os.path.join(app.static_folder, 'html'), f'{page}.html')

# Route per servire i file CSS
@app.route('/<stylesheet>.css')
def css(stylesheet):
    return send_from_directory(os.path.join(app.static_folder, 'css'), f'{stylesheet}.css')

# Route per servire i file JS
@app.route('/<script>.js')
def js(script):
    return send_from_directory(os.path.join(app.static_folder, 'js'), f'{script}.js')

# Route per servire i file pubblici
@app.route('/public/<path:filename>')
def public_files(filename):
    return send_from_directory(app.public_folder, filename)

# Route per servire lo swagger
@app.route('/swagger.json')
def swagger_json():
    return send_from_directory(os.path.abspath(os.path.dirname(__file__)), "swagger.json")

# Login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    # Verifica delle credenziali dell'utente
    cursor.execute('''
        SELECT id, password 
        FROM users
        WHERE email = ?
    ''', (email,))
    user = cursor.fetchone()
    conn.close()
    
    # Autentica se l'utente esiste e la password è corretta
    if user:
        correct_pw = user['password']
        enter_pw = password.encode('utf-8')
        if bcrypt.checkpw(enter_pw, correct_pw.encode('utf-8')):
            session['user_id'] = user['id'] # Salva l'ID dell'utente nella sessione
            return jsonify({"success": True, "message": "Login effettuato con successo!"})
    
    return jsonify({"success": False, "message": "Credenziali errate."}), 401
    
# Logout
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None) # Rimuove l'ID utente dalla sessione
    return jsonify({"success": True, "message": "Logout effettuato con successo!"})

# Recupera la lista dei dottori
@app.route('/doctors', methods=['GET'])
def get_doctors():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, specialization, image_path 
        FROM doctors
    ''')
    doctors = cursor.fetchall()
    conn.close()

    doctor_list = [] 
    for doctor in doctors:
        doctor_list.append({
            'id': doctor[0],
            'name': doctor[1],
            'specialization': doctor[2],
            'image_path': doctor[3]
        })

    return jsonify(doctor_list)

# Prenotazione di una visita
@app.route('/book-appointment', methods=['POST'])
def book_appointment():
    data = request.json
    date = data.get('date')
    time_slot = data.get('timeSlot')
    doctor_id = data.get('doctorId')
    user_id = session.get('user_id')
            
    if not date or not time_slot or not doctor_id:
        return jsonify({"message": "Dati mancanti: assicurati di aver fornito data, fascia oraria e ID del medico."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT id
        FROM doctors 
        WHERE id = ?
    ''', (doctor_id,))
    doctor = cursor.fetchone()
    if not doctor:
        return jsonify({"message": "Medico non trovato"}), 404

    # Inserimento della prenotazione nel database
    cursor.execute( '''
        INSERT INTO bookings (user_id, doctor_id, date, time_slot)
        VALUES (?, ?, ?, ?)
    ''', (user_id, doctor_id, date, time_slot))
    conn.commit()

    return jsonify({"success": True, "message": "Prenotazione avvenuta con successo!"})

# Recupera le fasce orarie disponibili per un medico in una determinata data
@app.route('/available-time-slots', methods=['GET'])
def available_time_slots():
    doctor_id = request.args.get('doctorId')
    date = request.args.get('date')

    if not doctor_id or not date:
        return jsonify({"message": "Doctor ID o data mancanti"}), 400

    # Lista predefinita delle fasce orarie
    all_slots = [
        "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "14:00-15:00", "15:00-16:00", "16:00-17:00"
    ]

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT time_slot 
        FROM bookings 
        WHERE doctor_id = ? 
        AND date = ?
    ''', (doctor_id, date))
    booked_slots = cursor.fetchall()
    booked_slots = set(row[0] for row in booked_slots)

    # Calcola le fasce orarie disponibili
    available_slots = []
    for slot in all_slots:
        if slot not in booked_slots:
            available_slots.append(slot)

    return jsonify({"availableSlots": available_slots})

# Recupero delle prenotazioni
@app.route('/my-bookings', methods=['GET'])
def my_bookings():
    user_id = session.get('user_id')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT bookings.id, doctors.name, bookings.date, bookings.time_slot
        FROM bookings
        JOIN doctors ON bookings.doctor_id = doctors.id
        WHERE bookings.user_id = ?
    ''', (user_id,))

    bookings = cursor.fetchall()
    
    result = [] # Lista per memorizzare le prenotazioni
    for booking in bookings:
        result.append({
            "booking_id": booking[0],
            "name": booking[1],
            "date": booking[2],
            "time_slot": booking[3]
        })

    return jsonify(result)

# Recupero di una prenotazione specifica
@app.route('/get-booking/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, doctor_id, date, time_slot 
        FROM bookings 
        WHERE id = ? 
    ''', (booking_id,))

    booking = cursor.fetchone()

    if booking:
        cursor.execute(''' 
            SELECT time_slot 
            FROM bookings 
            WHERE doctor_id = ? AND date = ? AND id != ?
        ''', (booking['doctor_id'], booking['date'], booking_id))

        booked_slots = [] # Lista delle fasce orarie già prenotate
        for row in cursor.fetchall():
            booked_slots.append(row[0])

        result = {
            "date": booking[2],
            "time_slot": booking[3],
            "booked_slots": booked_slots
        }
    else:
        result = {"message": "Prenotazione non trovata."}
        return jsonify(result), 404

    return jsonify(result)

# Modifica di una prenotazione
@app.route('/update-booking/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    data = request.json
    date = data.get('date')
    time_slot = data.get('timeSlot')
    doctor_id = data.get('doctorId')

    if not date or not time_slot or not doctor_id:
        return jsonify({"message": "Dati mancanti."}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verifica se la nuova fascia oraria è già prenotata
    cursor.execute('''
        SELECT id 
        FROM bookings 
        WHERE doctor_id = (SELECT doctor_id FROM bookings WHERE id = ?)
        AND date = ? AND time_slot = ? AND id != ?
    ''', (booking_id, date, time_slot, booking_id))
    
    if cursor.fetchone():
        return jsonify({"message": "Fascia oraria già prenotata."}), 400
        
    # Modifica della prenotazione
    cursor.execute('''
        UPDATE bookings 
        SET date = ?, time_slot = ? 
        WHERE id = ?
    ''', (date, time_slot, booking_id))
    conn.commit()

    return jsonify({"success": True, "message": "Prenotazione modificata con successo!"})

# Cancellazione di una prenotazione
@app.route('/delete-booking/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT id 
        FROM bookings
        WHERE id = ?
    ''', (booking_id,))
    
    if not cursor.fetchone():
        return jsonify({"message": "Prenotazione non trovata."}), 404

    # Elimina la prenotazione dal database
    cursor.execute('''
        DELETE 
        FROM bookings 
        WHERE id = ?
    ''', (booking_id,))
    conn.commit()
        
    return jsonify({"success": True, "message": "Prenotazione cancellata con successo!"})


# Gestione errori
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Risorsa non trovata"}), 404

@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify({"error": str(e)}), 500


# Avvio dell'app
if __name__ == '__main__':
    app.run(debug=True)
